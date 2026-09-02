# Current implementation

This page is the source of truth for what the repository does today.

## Implemented

- Four pages: Overview, Marketplace, Provide Compute, and Documentation
- Responsive marketplace interface
- Six seeded provider records
- Search across provider, model, GPU, and region
- Workload filters
- Provider comparison cards
- Inference checkout dialog
- Simulated routing and completion state
- Injected EVM wallet discovery
- Robinhood Chain add/switch request
- Wallet account request
- Vercel and Cloudflare/Vinext production builds
- Branded favicon, social card, and visual assets
- Reduced-motion behavior
- Protected operator-only `POST /api/inference` pilot, disabled by default
- Fixed-model/worker configuration, bounded request and response bodies, timeouts, no automatic retries
- Per-instance pilot rate/concurrency guard (not distributed quotas)
- Automated routing and mocked-worker safety tests

## Simulated

- Online GPU count
- Calls settled
- Median network latency
- Average cost per call
- Provider availability, uptime, and latency
- Inference execution
- No signed receipt or payment is created by the demo checkout

## Not implemented

- Provider registration
- Worker daemon
- Model health checking
- Public multi-provider inference routing
- Customer authentication, scoped customer API keys, and durable quotas
- Verified usage metering
- Receipt signing and verification
- Smart contracts
- Escrow or payment transfer
- Disputes and slashing
- Live analytics

## Private pilot boundary

The operator pilot forwards one bounded request to an operator-configured worker only when all server-side settings are valid. It returns an explicitly unverified response and no payment or receipt. The public checkout still simulates calls. Real GPU connectivity has not yet been validated; do not represent the pilot as a live decentralized network.

Read [Pilot setup](../developers/inference-pilot.md) before enabling it. A per-instance limiter does not provide a global spend cap.

## Safety boundary

The checkout explicitly says **Prototype only. This test will not spend funds.** Keep that boundary until audited settlement contracts, verified metering, and a production backend exist.
