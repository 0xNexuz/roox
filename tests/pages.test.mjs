import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pages, resolvePage, pageMetadata, pageHtml } from '../lib/pages.ts';

test('four real page paths resolve, including trailing slashes', () => {
  assert.equal(pages.length, 4);
  for (const page of pages) {
    assert.equal(resolvePage(page.path), page.id);
    assert.equal(resolvePage(page.path + '/'), page.id);
    assert.equal(pageMetadata(page.id).alternates.canonical, 'https://useroox.vercel.app' + page.path);
  }
  assert.equal(resolvePage('/does-not-exist'), 'not-found');
});

test('each static route has its own matching metadata', () => {
  const template = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const page of pages) {
    const html = pageHtml(template, page.id);
    assert.ok(html.includes('<title>' + page.title + '</title>'));
    assert.ok(html.includes('content="' + page.description + '"'));
    assert.ok(html.includes('href="https://useroox.vercel.app' + page.path + '"'));
    assert.ok(html.includes('content="https://useroox.vercel.app/og.png"'));
  }
  assert.match(pageHtml(template, 'not-found'), /name="robots" content="noindex"/);
});

test('root and nested redirects apply only to the legacy host', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  for (const source of ['/', '/:path*']) {
    const rule = config.redirects.find((item) => item.source === source);
    assert.ok(rule);
    assert.equal(rule.permanent, true);
    assert.equal(rule.has[0].value.eq, 'usekyros.vercel.app');
    assert.ok(rule.destination.startsWith('https://useroox.vercel.app/'));
  }
  assert.equal(config.cleanUrls, true);
});
