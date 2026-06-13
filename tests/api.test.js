import { test } from 'node:test';
import assert from 'node:assert/strict';
import { call } from '../src/api.js';

test('call() POSTs JSON body and returns parsed response', async () => {
  let captured;
  globalThis.fetch = async (url, opts) => {
    captured = { url, opts };
    return { ok: true, json: async () => ({ ok: true, token: 'abc' }) };
  };
  const res = await call({ action: 'login', name: 'a', pass: 'b' });
  assert.equal(captured.opts.method, 'POST');
  assert.equal(captured.opts.body, JSON.stringify({ action: 'login', name: 'a', pass: 'b' }));
  assert.equal(captured.opts.headers['Content-Type'], 'text/plain;charset=utf-8');
  assert.equal(res.token, 'abc');
});

test('call() throws on response ok:false', async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ ok: false, error: 'bad' }) });
  await assert.rejects(() => call({ action: 'x' }), /bad/);
});

test('call() throws on HTTP error', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => ({}) });
  await assert.rejects(() => call({ action: 'x' }), /HTTP 500/);
});
