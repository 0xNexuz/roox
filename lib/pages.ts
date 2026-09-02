export const siteOrigin = 'https://useroox.vercel.app';
export const handbookUrl = 'https://magnum-inc.gitbook.io/roox';
export const pages = [
  { id: 'home', path: '/', label: 'Overview', title: 'Roox — The open inference layer', description: 'Explore the Roox GPU marketplace prototype, designed for pay-per-call AI inference on Robinhood Chain.' },
  { id: 'market', path: '/market', label: 'Marketplace', title: 'Marketplace — Roox', description: 'Explore the Roox GPU marketplace prototype. Compare models, hardware, regions, and per-call pricing.' },
  { id: 'providers', path: '/providers', label: 'Provide compute', title: 'Provide compute — Roox', description: 'Prepare spare GPU capacity for the Roox inference pilot. Learn how provider onboarding will work.' },
  { id: 'docs', path: '/docs', label: 'Documentation', title: 'Documentation — Roox', description: 'Read the Roox quickstart, provider guide, inference pilot details, and current launch readiness.' },
] as const;

export type PageId = typeof pages[number]['id'];

export function resolvePage(pathname: string): PageId | 'not-found' {
  const path = pathname.replace(/\/+$/, '') || '/';
  return pages.find((page) => page.path === path)?.id ?? 'not-found';
}

export function pageMetadata(id: PageId) {
  const page = pages.find((item) => item.id === id)!;
  const url = siteOrigin + page.path;
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    openGraph: { title: page.title, description: page.description, url, images: [siteOrigin + '/og.png'] },
    twitter: { card: 'summary_large_image' as const, title: page.title, description: page.description, images: [siteOrigin + '/og.png'] },
  };
}

export function pageHtml(html: string, id: PageId | 'not-found') {
  const page = pages.find((item) => item.id === id);
  const title = page?.title ?? 'Page not found — Roox';
  const description = page?.description ?? 'This Roox page could not be found.';
  // All values are trusted build-time literals; no request data enters metadata.
  return html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*("\s*\/?>)/g, `$1${description}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*("\s*\/?>)/, `$1${title}$2`)
    .replace('content="/og.png"', `content="${siteOrigin}/og.png"`)
    .replace('</head>', `${page ? `<link rel="canonical" href="${siteOrigin}${page.path}" /><meta property="og:url" content="${siteOrigin}${page.path}" />` : '<meta name="robots" content="noindex" />'}<meta name="twitter:title" content="${title}" /><meta name="twitter:description" content="${description}" /><meta name="twitter:image" content="${siteOrigin}/og.png" /></head>`);
}
