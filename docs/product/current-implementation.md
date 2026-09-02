# Current implementation

This page is the source of truth for what the repository does today.

## Implemented

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

## Simulated

- Online GPU count
- Calls settled
- Median network latency
- Average cost per call
- Provider availability, uptime, and latency
- Inference execution
- Receipt identifier
- Payment readiness

## Not implemented

- Provider registration
- Worker daemon
- Model health checking
- Inference gateway
- Authentication and API keys
- Usage metering
- Receipt signing and verification
- Smart contracts
- Escrow or payment transfer
- Disputes and slashing
- Live analytics

## Safety boundary

The checkout explicitly says **Prototype only. This test will not spend funds.** Keep that boundary until audited settlement contracts, verified metering, and a production backend exist.
