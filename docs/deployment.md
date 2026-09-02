# Deployment

Kyros has two independent production targets.

## Vercel

The public application is [usekyros.vercel.app](https://usekyros.vercel.app).

Configuration:

- `vercel.json`
- `vercel.vite.config.ts`
- `vercel-main.tsx`
- output directory: `vercel-dist/`

Local verification:

```bash
npx vite build --config vercel.vite.config.ts
```

## Sites / Cloudflare

The private Sites deployment is [kyros.elllbest7.chatgpt.site](https://kyros.elllbest7.chatgpt.site).

Configuration:

- `.openai/hosting.json`
- `vite.config.ts`
- Vinext and the Cloudflare Vite plugin
- output directory: `dist/`

Local verification:

```bash
npm run build
```

## Release checklist

1. Run both production builds.
2. Check `git diff --check`.
3. Confirm no private references or secrets are staged.
4. Push the validated commit.
5. Verify the public page and `/favicon.svg` return HTTP 200.
6. Test search, filters, checkout, wallet cancellation, and reduced motion.

Never commit Vercel’s `.vercel/` directory, local Wrangler state, environment files, or credentials.
