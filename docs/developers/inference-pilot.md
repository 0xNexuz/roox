# Private inference pilot

The repository implements an operator-only bridge at `POST /api/inference`. This is a controlled integration step, not a production marketplace. The public checkout remains a clearly labeled simulation.

## Before enabling

You need an HTTPS model-serving origin under your control, with an authenticated, non-streaming `POST /v1/chat/completions` endpoint. Its response must contain the exact configured model name and `choices[0].message.content`. The gateway does not provision GPUs, load models, or register providers.

No real GPU connection has been validated by the repository's automated tests. Those tests use mocks. Real validation must be performed separately after configuring a worker.

## Server-side settings

Copy the names from `.env.example` into your hosting environment's secret settings. Set these separately for Vercel and Sites if you want both environments enabled.

| Setting | Value |
| --- | --- |
| `ROOX_INFERENCE_ENABLED` | Leave `false` until ready; set `true` to opt in |
| `ROOX_GATEWAY_KEY` | Unique random operator secret, at least 32 characters, no whitespace |
| `ROOX_WORKER_ORIGIN` | HTTPS origin only, e.g. `https://worker.example.com`; no path, credentials, or nonstandard port |
| `ROOX_WORKER_KEY` | Private worker API key |
| `ROOX_MODEL` | Exact single model ID served by that worker |

Never use `VITE_` or `NEXT_PUBLIC_` prefixes for these settings. Never embed either key in the browser or GitBook. The hostname must be a trusted public origin; the basic origin validation is not a DNS-level egress firewall. Configure provider-side access controls and cost limits.

Redeploy after changing production settings. With missing or invalid configuration, the API responds with HTTP 503 and does not call the worker. Keep `ROOX_INFERENCE_ENABLED=false` until your real integration test is approved.

## Operator request

Use a server-side API client. Substitute the configured model ID and send the operator secret privately in the Authorization header.

```http
POST /api/inference
Authorization: Bearer <private-operator-key>
Content-Type: application/json
```

```json
{
  "model": "your-exact-model-id",
  "prompt": "Reply with a short greeting.",
  "max_tokens": 64
}
```

Only these three fields are accepted. The caller cannot override the worker, headers, model, route, or generation settings beyond the output-token bound.

## Response and failures

A valid worker result includes `output.text`, `verification: "unverified_worker_response"`, `receipt: null`, and `settlement: { "enabled": false, "customer_charge": 0 }`. Token counts come from the worker and are unverified; omitted or invalid counts remain `null`.

| HTTP status | Meaning |
| --- | --- |
| 200 | Worker returned a valid response; no receipt verification or settlement |
| 400 / 413 / 415 | Invalid request, oversized body, or incorrect content type |
| 401 | Missing or incorrect operator key |
| 405 | Method other than POST |
| 429 | Per-instance pilot concurrency or request limit reached |
| 502 | Worker failed, redirected, or returned an invalid/oversized response |
| 503 | Pilot disabled or configuration incomplete |
| 504 | Request or worker exceeded the deadline |

The deadline is 20 seconds. Requests are limited to 16 KiB, prompts to 8,000 characters, and output to 1–512 requested tokens. The worker body is limited to 256 KiB. No retries are performed automatically.

## Important limits

- One call at a time and ten starts per minute are enforced **per running instance**, not globally. Serverless scaling can multiply this allowance.
- There is no customer account system, durable quota, spend ledger, billing, streaming, failover, or idempotency layer.
- Roox does not charge customers, but your hosting and GPU provider may charge you for requests. Set upstream budget limits before testing.
- A timeout does not prove the worker stopped generating. Stop/revoke the worker credentials for an urgent shutdown; disabling Roox prevents new calls only after configuration is applied.
- Do not submit sensitive prompts. Logs/retention/privacy on the worker are the operator's responsibility.
- Do not share the operator key with public customers or enable the public checkout against this endpoint.

## Validation before expansion

1. Run `npm test` and both builds.
2. Confirm the deployed, unconfigured API returns 503.
3. Configure a controlled worker, then make one authorized call and verify the actual GPU server's logs and response.
4. Test an invalid key, model mismatch, worker failure, and timeout without secrets appearing in responses.
5. Add durable authentication, quotas, observability, and audited payment/receipt services before any public paid-inference launch.
