import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { pages, pageHtml } from './lib/pages';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'roox-static-pages',
      enforce: 'post',
      generateBundle(_options, bundle) {
        const entry = bundle['index.html'];
        if (!entry || entry.type !== 'asset') throw new Error('Missing Roox HTML entry.');
        const original = String(entry.source);
        entry.source = pageHtml(original, 'home');
        for (const page of pages.filter((item) => item.id !== 'home')) {
          this.emitFile({ type: 'asset', fileName: page.path.slice(1) + '.html', source: pageHtml(original, page.id) });
        }
        this.emitFile({ type: 'asset', fileName: '404.html', source: pageHtml(original, 'not-found') });
      },
    },
  ],
  resolve: {
    alias: {
      '@': projectRoot,
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  build: {
    outDir: 'vercel-dist',
    emptyOutDir: true,
  },
});
