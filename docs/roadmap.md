# Roadmap

## Phase 0 — Product prototype

- [x] Marketplace experience
- [x] Provider comparison
- [x] Wallet connection
- [x] Robinhood Chain switch/add flow
- [x] Simulated inference checkout
- [x] Responsive motion and brand system
- [x] Vercel and Sites deployments
- [x] GitBook-ready documentation

## Private pilot — In progress

- [x] Four-page navigation without changing the visual system
- [x] Operator-key-protected, disabled-by-default inference gateway
- [x] Request bounds, fixed model/worker, timeout, and per-instance safety guards
- [x] Mocked-worker and routing tests
- [ ] Connect and validate a real GPU worker end to end
- [ ] Durable quotas, operator monitoring, and incident controls

This pilot is separate from the public simulated checkout and does not enable customer billing.

## Phase 1 — Usable inference network

- [ ] Provider registry service
- [ ] GPU worker reference implementation
- [ ] Public multi-provider inference gateway
- [ ] API keys and request limits
- [ ] Live provider health and capacity
- [ ] Streaming model responses

## Phase 2 — Verifiable calls

- [ ] Signed provider quotes
- [ ] Deterministic usage metering
- [ ] Request and response commitments
- [ ] Signed inference receipts
- [ ] Receipt verifier
- [ ] Replay and timeout protection

## Phase 3 — Settlement

- [ ] Settlement contract design
- [ ] Escrow and payment release
- [ ] Provider registration keys
- [ ] Dispute and failure policy
- [ ] Contract tests and external audit
- [ ] Testnet launch before any production funds

## Phase 4 — Network hardening

- [ ] Multi-provider failover
- [ ] Reputation and quality scoring
- [ ] Privacy-preserving request handling
- [ ] Provider anomaly detection
- [ ] Observability and incident response
- [ ] Governance and protocol upgrade process

Roadmap ordering may change after threat modeling and provider research. Security and verifiability take priority over mainnet speed.
