// Operator-only pilot. No customer billing, proof verification, or settlement.
// Never import this module into a browser component.
type PilotEnvironment = Readonly<Record<string, string | undefined>>;
type GatewayOptions = { fetcher?: typeof fetch; now?: () => number; timeoutMs?: number };

class PilotError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

function reply(status: number, body: unknown, extra: Record<string, string> = {}) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra },
  });
}

async function equalKey(actual: string, expected: string) {
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(actual)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const left = new Uint8Array(a), right = new Uint8Array(b);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  return difference === 0;
}

function configuration(env: PilotEnvironment) {
  if (env.ROOX_INFERENCE_ENABLED !== 'true') return null;
  const key = env.ROOX_GATEWAY_KEY ?? '';
  const workerKey = env.ROOX_WORKER_KEY ?? '';
  const model = env.ROOX_MODEL ?? '';
  if (key.length < 32 || key.length > 256 || /\s/.test(key)) return null;
  if (!workerKey || workerKey.length > 4096 || /[\r\n]/.test(workerKey)) return null;
  if (!model || model.length > 200) return null;
  try {
    const url = new URL(env.ROOX_WORKER_ORIGIN ?? '');
    // Only an operator-configured HTTPS origin. Callers cannot choose a URL,
    // route, key, or model outside this configuration. Redirects are rejected.
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') return null;
    if (url.port && url.port !== '443') return null;
    if (!url.hostname.includes('.') || /^[\d.]+$/.test(url.hostname) || url.hostname.includes(':')) return null;
    if (/(^|\.)(localhost|local|internal)$/.test(url.hostname)) return null;
    return { key, workerKey, model, endpoint: new URL('/v1/chat/completions', url).href };
  } catch { return null; }
}

async function readJson(body: ReadableStream<Uint8Array> | null, limit: number, signal: AbortSignal) {
  if (!body) throw new PilotError(400, 'invalid_json');
  signal.throwIfAborted();
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let onAbort = () => {};
  const aborted = new Promise<never>((_resolve, reject) => {
    onAbort = () => reject(signal.reason);
    signal.addEventListener('abort', onAbort, { once: true });
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), aborted]);
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw new PilotError(413, 'body_too_large');
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    try { return JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes)); }
    catch { throw new PilotError(400, 'invalid_json'); }
  } catch (error) {
    void reader.cancel().catch(() => {});
    throw error;
  } finally {
    signal.removeEventListener('abort', onAbort);
    reader.releaseLock();
  }
}

function tokenCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

export function createInferenceGateway({ fetcher = fetch, now = Date.now, timeoutMs = 20_000 }: GatewayOptions = {}) {
  // A per-instance pilot guard, NOT a distributed quota or billing system.
  // Public multi-tenant rollout requires durable quotas before enabling access.
  let inFlight = false;
  let starts: number[] = [];
  return async function handle(request: Request, env: PilotEnvironment): Promise<Response> {
    if (request.method !== 'POST') return reply(405, { error: 'method_not_allowed' }, { Allow: 'POST' });
    const config = configuration(env);
    if (!config) return reply(503, { error: 'pilot_not_configured', payments_enabled: false });
    const authorization = request.headers.get('authorization') ?? '';
    if (!authorization.startsWith('Bearer ') || authorization.length > 263 ||
        !await equalKey(authorization.slice(7), config.key)) {
      return reply(401, { error: 'unauthorized' }, { 'WWW-Authenticate': 'Bearer' });
    }
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
      return reply(415, { error: 'json_required' });
    }
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(timeoutMs)]);
    let ownsSlot = false;
    let contactingWorker = false;
    try {
      const input = await readJson(request.body, 16_384, signal);
      if (!input || typeof input !== 'object' || Array.isArray(input) ||
          Object.keys(input).some((key) => !['model', 'prompt', 'max_tokens'].includes(key)) ||
          input.model !== config.model || typeof input.prompt !== 'string' ||
          !input.prompt.trim() || input.prompt.length > 8000 ||
          !Number.isInteger(input.max_tokens) || input.max_tokens < 1 || input.max_tokens > 512) {
        return reply(400, { error: 'invalid_request' });
      }
      signal.throwIfAborted();
      const time = now();
      starts = starts.filter((start) => time - start < 60_000);
      if (inFlight || starts.length >= 10) return reply(429, { error: 'pilot_busy' }, { 'Retry-After': '60' });
      inFlight = true;
      ownsSlot = true;
      starts.push(time);
      contactingWorker = true;
      const upstream = await fetcher(config.endpoint, {
        method: 'POST', redirect: 'error', signal,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + config.workerKey },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: input.prompt }],
          max_tokens: input.max_tokens,
          stream: false,
        }),
      });
      if (!upstream.ok) {
        void upstream.body?.cancel().catch(() => {});
        return reply(502, { error: 'worker_unavailable' });
      }
      const output = await readJson(upstream.body, 262_144, signal);
      const content = output?.choices?.[0]?.message?.content;
      if (output?.model !== config.model || typeof content !== 'string' || !content.trim() || content.length > 32768) {
        return reply(502, { error: 'invalid_worker_response' });
      }
      return reply(200, {
        id: 'pilot_' + crypto.randomUUID(),
        status: 'completed',
        model: config.model,
        output: { text: content },
        usage: {
          input_tokens: tokenCount(output?.usage?.prompt_tokens),
          output_tokens: tokenCount(output?.usage?.completion_tokens),
        },
        verification: 'unverified_worker_response',
        receipt: null,
        settlement: { enabled: false, customer_charge: 0 },
      });
    } catch (error) {
      if (signal.aborted) return reply(504, { error: 'request_timeout' });
      if (contactingWorker) return reply(502, { error: 'worker_unavailable' });
      if (error instanceof PilotError) return reply(error.status, { error: error.code });
      return reply(500, { error: 'request_failed' });
    } finally {
      if (ownsSlot) inFlight = false;
    }
  };
}
