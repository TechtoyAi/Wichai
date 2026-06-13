import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBattle } from '../src/state.js';

test('initial battle has 3 hearts and index 0', () => {
  const b = createBattle({ questions: [{ q_id: 'Q1' }, { q_id: 'Q2' }] });
  assert.equal(b.hearts, 3);
  assert.equal(b.index, 0);
  assert.deepEqual(b.choices, []);
  assert.equal(b.elapsed, 0);
  assert.equal(b.done(), false);
});

test('answerCorrect advances index, keeps hearts', () => {
  const b = createBattle({ questions: [{ q_id: 'Q1' }, { q_id: 'Q2' }] });
  b.answer('A', true, 5);
  assert.equal(b.index, 1);
  assert.equal(b.hearts, 3);
  assert.deepEqual(b.choices, ['A']);
  assert.equal(b.elapsed, 5);
});

test('answerWrong advances index, -1 heart', () => {
  const b = createBattle({ questions: [{ q_id: 'Q1' }] });
  b.answer('B', false, 7);
  assert.equal(b.index, 1);
  assert.equal(b.hearts, 2);
  assert.equal(b.done(), true);
});

test('done() true when all answered OR hearts == 0', () => {
  const b = createBattle({ questions: [{ q_id: 'Q1' }, { q_id: 'Q2' }, { q_id: 'Q3' }] });
  b.answer('A', false, 3);
  b.answer('A', false, 3);
  b.answer('A', false, 3); // 0 hearts after this
  assert.equal(b.hearts, 0);
  assert.equal(b.done(), true);
});

test('result.win when all answered and hearts > 0', () => {
  const b = createBattle({ questions: [{ q_id: 'Q1' }, { q_id: 'Q2' }] });
  b.answer('A', true, 5);
  b.answer('B', true, 5);
  assert.equal(b.result().win, true);
  assert.equal(b.result().hearts_left, 3);
});

test('result.win false when hearts hit 0 before finishing all', () => {
  const b = createBattle({ questions: [{ q_id: 'Q1' }, { q_id: 'Q2' }, { q_id: 'Q3' }] });
  b.answer('A', false, 3);
  b.answer('A', false, 3);
  b.answer('A', false, 3);
  assert.equal(b.result().win, false);
});
