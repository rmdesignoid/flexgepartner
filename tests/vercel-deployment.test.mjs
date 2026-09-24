import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import server from '../.vercel/output/functions/__server.func/index.mjs';

for (const path of ['/', '/conversation/preview?practiceId=example-oral-restaurant-v1', '/student/ai-conversation']) {
  test(`Vercel function renders ${path}`, async () => {
    const response = await server.fetch(new Request(`https://example.test${path}`));
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /<html/);
    assert.match(html, /<script/);
  });
}

test('Vercel routes static assets before the server catch-all', () => {
  const config = JSON.parse(readFileSync(new URL('../.vercel/output/config.json', import.meta.url)));
  assert.equal(config.version, 3);
  assert.ok(config.routes.some((r) => r.handle === 'filesystem'));
  assert.equal(config.routes.at(-1).dest, '/__server');
});

const context = createContext({ exports: {}, process: { env: {} }, fetch, AbortSignal });
runInContext(ts.transpileModule(readFileSync(new URL('../db/vercel-bindings.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);

test('D1 adapter binds SQL parameters and preserves mutation metadata', async () => {
  let captured;
  const db = context.exports.createD1Binding({ CLOUDFLARE_ACCOUNT_ID: 'account', CLOUDFLARE_D1_DATABASE_ID: 'database', CLOUDFLARE_D1_API_TOKEN: 'test-token' }, async (url, init) => {
    captured = { url, ...init };
    return Response.json({ success: true, result: [{ success: true, results: [], meta: { changes: 1 } }] });
  });
  const result = await db.prepare('UPDATE events SET title = ?').bind("O'Brien").run();
  assert.equal(result.meta.changes, 1);
  assert.deepEqual(JSON.parse(captured.body), { sql: 'UPDATE events SET title = ?', params: ["O'Brien"] });
  assert.equal(captured.headers.Authorization, 'Bearer test-token');
});

test('D1 adapter fails explicitly without server credentials', () => {
  assert.throws(() => context.exports.createD1Binding({}, fetch), /Calendar database is not configured/);
});
