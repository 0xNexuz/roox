# Deployment

Roox has two independent production targets.

## Vercel

The public application is [useroox.vercel.app](https://useroox.vercel.app).

Configuration:

- `vercel.json`
- `vercel.vite.config.ts`
- `vercel-main.tsx`
- `api/inference.ts` (private pilot, disabled by default)
- Four clean page routes: `/`, `/market`, `/providers`, `/docs`
- Host-scoped HTTP 308 redirects from `usekyros.vercel.app` to the same Roox path
- output directory: `vercel-dist/`

Local verification:

```bash
npm run build:vercel
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

1. Run `npm test`, `npx tsc --noEmit`, and both production builds.
2. Check `git diff --check`.
3. Confirm no private references or secrets are staged.
4. Push the validated commit.
5. Verify all four public pages and `/favicon.svg` return HTTP 200, unknown pages return 404, and both the legacy root and nested URLs redirect with path/query preserved.
6. Confirm unconfigured `POST /api/inference` returns HTTP 503 without contacting a worker.
7. Test search, filters, checkout, wallet cancellation, and reduced motion.

The pilot must remain disabled until a real worker and operator are ready. Configure secrets separately in each hosting environment; neither GitHub nor a Sites source push configures production secrets. See [Private inference pilot](developers/inference-pilot.md).

Never commit Vercel’s `.vercel/` directory, local Wrangler state, secret environment files, or credentials. `.env.example` is a safe, empty configuration template.
