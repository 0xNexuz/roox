# Inference API

{% hint style="warning" %}
This is a proposed API contract for the next Roox backend. It is not implemented by the current repository.
{% endhint %}

## Create an inference call

```http
POST /v1/inference
Authorization: Bearer kyr_live_...
Content-Type: application/json
```

```json
{
  "model": "Llama 3.3 70B",
  "input": {
    "messages": [
      { "role": "user", "content": "Explain proof-of-inference simply." }
    ]
  },
  "max_tokens": 256,
  "constraints": {
    "max_price_usd": "0.0050",
    "max_latency_ms": 350,
    "regions": ["Lagos", "Amsterdam"]
  }
}
```

## Proposed response

```json
{
  "id": "call_01J...",
  "status": "completed",
  "provider": "kyr-8f2a",
  "model": "Llama 3.3 70B",
  "output": {
    "text": "..."
  },
  "usage": {
    "input_tokens": 18,
    "output_tokens": 126
  },
  "quote": {
    "currency": "USD",
    "amount": "0.0048"
  },
  "receipt": {
    "request_hash": "0x...",
    "response_hash": "0x...",
    "signature": "0x..."
  }
}
```

## Required backend properties

- Idempotency keys for retried requests
- Streaming and non-streaming responses
- Request timeouts and cancellation
- Provider failover
- Signed quotes
- Deterministic metering rules
- Receipt replay protection
- Rate limits and API-key scopes
- Clear non-settlement of failed calls
