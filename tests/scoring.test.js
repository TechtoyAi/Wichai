import { test } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) globalThis.crypto = webcrypto;
import { checkAnswer, isCritical, hashChoice } from '../src/scoring.js';

test('hashChoice produces sha256 hex of q_id + choice', async () => {
  const hex = await hashChoice('Q-001', 'A');
  assert.match(hex, /^[0-9a-f]{64}$/);
});

test('checkAnswer matches when client hash equals server answer_hash', async () => {
  const answerHash = await hashChoice('Q-001', 'A');
  assert.equal(await checkAnswer('Q-001', 'A', answerHash), true);
  assert.equal(await checkAnswer('Q-001', 'B', answerHash), false);
});

test('isCritical true when elapsed <= sec_per_question / 3', () => {
  assert.equal(isCritical(5, 20), true);   // 5/20 < 1/3
  assert.equal(isCritical(6.7, 20), true); // 6.7/20 ≈ 1/3
  assert.equal(isCritical(8, 20), false);  // 8/20 > 1/3
});
