# Getting started

## Try the product

Open [useroox.vercel.app](https://useroox.vercel.app).

1. Search for a model, GPU type, provider, or region.
2. Filter the marketplace by language, reasoning, or image workloads.
3. Select **Run a call** on a provider card.
4. Review the estimated cost, latency, and network.
5. Select **Run test call**.

The call flow is simulated and never spends funds.

## Connect a wallet

Select **Connect** in the header. Roox requests an injected EVM wallet, switches to Robinhood Chain, and asks for account access. If the chain is missing, Roox offers to add it.

Rejecting either wallet request leaves the wallet unchanged.

## Run the repository

Requirements:

- Node.js 22.13 or newer
- npm

```bash
git clone https://github.com/0xNexuz/roox.git
cd roox
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vinext development server |
| `npm run build` | Build the Sites/Cloudflare target |
| `npm run lint` | Run Oxlint |
| `npx vite build --config vercel.vite.config.ts` | Build the Vercel target |
