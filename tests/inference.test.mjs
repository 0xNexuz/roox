import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInferenceGateway } from '../lib/inference-gateway.ts';

const env = {
  ROOX_INFERENCE_ENABLED: 'true',
  ROOX_GATEWAY_KEY: 'operator-test-key-with-at-least-32-characters',
  ROOX_WORKER_ORIGIN: 'https://worker.example.com',
  ROOX_WORKER_KEY: 'worker-test-key',
  ROOX_MODEL: 'test-model',
};
const input = { model: 'test-model', prompt: 'A short test prompt.', max_tokens: 128 };
function request(body = input, headers = {}, method = 'POST') {
  return new Request('https://useroox.vercel.app/api/inference', {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + env.ROOX_GATEWAY_KEY, ...headers },
    ...(method === 'POST' ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
  });
}
function worker() {
  return Response.json({
    model: 'test-model', choices: [{ message: { content: 'A real worker response shape.' } }],
    usage: { prompt_tokens: 5, completion_tokens: 8 },
  });
}
function forbiddenFetch() { throw new Error('No upstream request was expected.'); }

test('disabled or missing configuration fails closed without calling a worker', async () => {
  for (const missing of Object.keys(env)) {
    const handle = createInferenceGateway({ fetcher: forbiddenFetch });
    assert.equal((await handle(request(), { ...env, [missing]: undefined })).status, 503);
  }
  const handle = createInferenceGateway({ fetcher: forbiddenFetch });
  assert.equal((await handle(request(), { ...env, ROOX_INFERENCE_ENABLED: 'false' })).status, 503);
});

test('rejects insecure or credential-bearing worker origins', async () => {
  for (const origin of ['http://worker.example.com', 'https://127.0.0.1', 'https://localhost', 'https://worker.local', 'https://user:pass@worker.example.com', 'https://worker.example.com/path', 'https://worker.example.com?next=private']) {
    const handle = createInferenceGateway({ fetcher: forbiddenFetch });
    assert.equal((await handle(request(), { ...env, ROOX_WORKER_ORIGIN: origin })).status, 503);
  }
});

test('requires a correct private operator key', async () => {
  const handle = createInferenceGateway({ fetcher: forbiddenFetch });
  for (const Authorization of ['', 'Bearer wrong', 'Bearer ' + 'x'.repeat(300)]) {
    assert.equal((await handle(request(input, { Authorization }), env)).status, 401);
  }
});

test('rejects unsupported methods and content types', async () => {
  const handle = createInferenceGateway({ fetcher: forbiddenFetch });
  assert.equal((await handle(request(undefined, {}, 'GET'), env)).status, 405);
  assert.equal((await handle(request(input, { 'Content-Type': 'text/plain' }), env)).status, 415);
});

test('enforces the exact model, prompt, and output limits', async () => {
  const handle = createInferenceGateway({ fetcher: forbiddenFetch });
  for (const body of ['{bad', null, [], { ...input, model: 'other' }, { ...input, prompt: ' ' }, { ...input, prompt: 'x'.repeat(8001) }, { ...input, max_tokens: 513 }, { ...input, max_tokens: 0 }, { ...input, max_tokens: 1.5 }, { ...input, url: 'http://private/' }]) {
    assert.equal((await handle(request(body), env)).status, 400);
  }
});

test('limits raw body bytes even without content-length', async () => {
  const handle = createInferenceGateway({ fetcher: forbiddenFetch });
  assert.equal((await handle(request('x'.repeat(16385)), env)).status, 413);
});

test('forwards only approved fields and never fabricates a receipt or payment', async () => {
  const handle = createInferenceGateway({ fetcher: async (url, options) => {
    assert.equal(url, 'https://worker.example.com/v1/chat/completions');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, 'Bearer ' + env.ROOX_WORKER_KEY);
    assert.deepEqual(JSON.parse(options.body), {
      model: input.model, messages: [{ role: 'user', content: input.prompt }], max_tokens: 128, stream: false,
    });
    return worker();
  } });
  const res = await handle(request(), env), result = await res.json();
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.equal(result.output.text, 'A real worker response shape.');
  assert.equal(result.receipt, null);
  assert.equal(result.verification, 'unverified_worker_response');
  assert.deepEqual(result.settlement, { enabled: false, customer_charge: 0 });
  assert.deepEqual(result.usage, { input_tokens: 5, output_tokens: 8 });
  assert.ok(!JSON.stringify(result).includes(env.ROOX_WORKER_KEY));
});

test('upstream failure and invalid responses are errors, not success', async () => {
  for (const fetcher of [
    async () => new Response('private diagnostic with a secret', { status: 500 }),
    async () => new Response('not json'),
    async () => Response.json({ model: 'wrong', choices: [] }),
    async () => new Response('x'.repeat(262145)),
    async () => { throw new Error('sensitive worker error'); },
  ]) {
    const res = await createInferenceGateway({ fetcher })(request(), env);
    assert.equal(res.status, 502);
    assert.ok(!JSON.stringify(await res.json()).includes('secret'));
  }
});

test('missing usage remains unknown, never estimated', async () => {
  const handle = createInferenceGateway({ fetcher: async () => Response.json({
    model: 'test-model', choices: [{ message: { content: 'Output' } }],
  }) });
  assert.deepEqual((await (await handle(request(), env)).json()).usage, { input_tokens: null, output_tokens: null });
});

test('per-instance pilot limit stops repeated calls and resets after a minute', async () => {
  let time = 0;
  const handle = createInferenceGateway({ now: () => time, fetcher: async () => worker() });
  for (let i = 0; i < 10; i++) assert.equal((await handle(request(), env)).status, 200);
  assert.equal((await handle(request(), env)).status, 429);
  time = 60001;
  assert.equal((await handle(request(), env)).status, 200);
});

test('permits only one in-flight call per instance and releases its slot', async () => {
  let release, started;
  const waiting = new Promise((resolve) => { started = resolve; });
  const handle = createInferenceGateway({ fetcher: () => new Promise((resolve) => { release = resolve; started(); }) });
  const first = handle(request(), env);
  await waiting;
  assert.equal((await handle(request(), env)).status, 429);
  release(worker());
  assert.equal((await first).status, 200);
});

test('aborts a slow worker without retrying it', async () => {
  let calls = 0;
  const handle = createInferenceGateway({ timeoutMs: 25, fetcher: (_url, { signal }) => {
    calls++;
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
  } });
  // Keep the test alive because AbortSignal.timeout uses an unref timer.
  const keepAlive = setTimeout(() => {}, 1000);
  try { assert.equal((await handle(request(), env)).status, 504); }
  finally { clearTimeout(keepAlive); }
  assert.equal(calls, 1);
});
