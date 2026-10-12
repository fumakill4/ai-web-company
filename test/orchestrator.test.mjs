import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
const source = stripTypeScriptTypes(await readFile(new URL('../src/lib/orchestrator.ts', import.meta.url), 'utf8'));
const { createOrchestratorHandler } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
function fixture(user = { id: 'owner-a' }, website = { id: 'site-a', name: 'GameHub' }) {
  const calls = [];
  const client = { auth: { getUser: async () => ({ data: { user }, error: null }) }, from(table) {
    calls.push(['table', table]);
    return { select() { return this; }, eq(key, value) { calls.push(['eq', key, value]); return this; }, ilike() { return this; }, limit() { return this; },
      maybeSingle: async () => ({ data: website, error: null }), insert(data) { calls.push(['insert', data]); return this; }, single: async () => ({ data: { id: 'task-a' }, error: null }) };
  } };
  return { calls, handle: createOrchestratorHandler(() => client) };
}
function request(body, token = 'fixture-token') { return new Request('https://app.example/api/orchestrator', { method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {}, body: JSON.stringify(body) }); }
test('anonymous and invalid sessions never access task tables', async () => {
  const f = fixture(); assert.equal((await f.handle(request({ instruction: 'hi' }, ''))).status, 401); assert.deepEqual(f.calls, []);
  const g = fixture(null); assert.equal((await g.handle(request({ instruction: 'hi' }))).status, 401); assert.deepEqual(g.calls, []);
});
test('caller-supplied owner cannot impersonate another owner', async () => {
  const f = fixture(); assert.equal((await f.handle(request({ instruction: 'hello', owner_id: 'victim' }))).status, 200);
  assert.ok(f.calls.some(c => c[0] === 'eq' && c[1] === 'owner_id' && c[2] === 'owner-a'));
  const row = f.calls.find(c => c[0] === 'insert')[1][0]; assert.equal(row.created_by, 'owner-a'); assert.equal(row.website_id, 'site-a');
});
test('missing owned website and invalid instructions never enqueue', async () => {
  const f = fixture({ id: 'owner-a' }, null); assert.equal((await f.handle(request({ instruction: 'hello' }))).status, 404); assert.ok(!f.calls.some(c => c[0] === 'insert'));
  for (const instruction of [null, {}, '', 'x'.repeat(4001)]) {
    const g = fixture(); assert.equal((await g.handle(request({ instruction }))).status, 400); assert.deepEqual(g.calls, []);
  }
});
