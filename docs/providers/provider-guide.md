# Provider guide

{% hint style="warning" %}
The provider software described here is planned. No worker binary or registration contract is included yet.
{% endhint %}

## Intended provider journey

1. Install the Roox worker.
2. Connect a payout wallet.
3. Register hardware and region.
4. Select one or more supported models.
5. Run benchmark and health checks.
6. Set a per-call price and concurrency limit.
7. Accept routed inference requests.
8. Sign metering receipts after completed calls.
9. Receive settlement after verification.

## Minimum worker responsibilities

- Authenticate with the gateway
- Advertise model and hardware capabilities
- Report health and available capacity
- Validate request limits
- Isolate model workloads
- Meter usage consistently
- Hash request and response payloads
- Sign receipts with a registered key
- Avoid retaining private prompts or outputs

## Verification model

Provider verification should combine hardware attestation where available, reproducible benchmarks, uptime history, signed receipts, anomaly detection, and economic penalties for provable abuse.

## Operational expectations

Production providers need secure key storage, bounded logs, encrypted transport, model licensing compliance, predictable egress controls, and a clear process for upgrades and emergency shutdown.
