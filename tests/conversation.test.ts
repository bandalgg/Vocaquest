import test from 'node:test';
import assert from 'node:assert/strict';
import { dialogues, replyMatches } from '../src/data/conversations';
test('each dialogue has five meaningful recall turns and accepts spoken punctuation differences', () => {
  for (const d of dialogues) {
    assert.equal(d.turns.length, 5);
    for (const turn of d.turns) {
      assert.ok(turn.promptKo && turn.replyKo);
      assert.ok(replyMatches(turn, turn.reply.toUpperCase().replace(/[.,!?]/g, '')));
      assert.ok(!replyMatches(turn, 'I do not know'));
      for (const alt of turn.alternatives ?? []) assert.ok(replyMatches(turn, alt));
    }
  }
});
