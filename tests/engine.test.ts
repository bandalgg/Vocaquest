import test from "node:test";
import assert from "node:assert/strict";
import words from "../src/data/words.json";
import { DEFAULT_SETTINGS, StudyEvent, Word } from "../src/types";
import {
  answerFor,
  blankSentence,
  choicesFor,
  dayKey,
  dayOffset,
  distance,
  hint,
  isWeak,
  missionsFor,
  normalize,
  progressOf,
  schedule,
  similarity,
  summary,
  todayQueue,
} from "../src/utils/engine";
const event = (overrides: Partial<StudyEvent> = {}): StudyEvent => ({
  id: "e1",
  wordId: "w001",
  at: "2026-09-01T12:00:00.000Z",
  day: "2026-09-01",
  sessionId: "s1",
  type: "blank",
  correct: true,
  assisted: false,
  responseMs: 3000,
  rating: "known",
  seconds: 3,
  ...overrides,
});
test("108 unique original entries have complete fields and valid cloze answers", () => {
  assert.equal(words.length, 108);
  assert.equal(new Set(words.map((w) => w.word)).size, 108);
  for (const w of words) {
    assert.ok(
      w.ipa &&
        w.meanings.length &&
        w.examples[0].translation &&
        w.categories.length,
    );
    assert.ok(blankSentence(w).includes("______"), w.word);
    assert.ok(!blankSentence(w).includes(w.examples[0].answer), w.word);
  }
});
test("cloze accepts inflection instead of dictionary form", () => {
  assert.equal(answerFor(words[0], "blank"), "acquired");
  assert.notEqual(
    normalize("acquire"),
    normalize(answerFor(words[0], "blank")),
  );
});
test("adjacent transposition receives near-miss", () => {
  assert.equal(distance("acqurie", "acquire"), 1);
  assert.equal(similarity("ACQUIRE", "acquire"), 100);
  assert.ok(similarity("cat", "acquire") < 85);
});
test("input normalizes case and whitespace", () =>
  assert.equal(normalize("  Acquired.  "), "acquired"));
test("hint exposes edges only", () =>
  assert.equal(hint("acquired"), "a _ _ _ _ _ _ d"));
test("new correct word is due in 1 day", () => {
  const p = schedule(undefined, event());
  assert.equal(p.nextReviewAt, "2026-09-02T12:00:00.000Z");
  assert.equal(p.masteryLevel, 1);
});
test("success intervals are 1,3,7,14,30 days", () => {
  let p;
  for (const days of [1, 3, 7, 14, 30]) {
    p = schedule(p, event());
    assert.equal(
      Date.parse(p.nextReviewAt) - Date.parse(event().at),
      days * 86400000,
    );
  }
});
test("incorrect/hinted answers reset to ten minutes and weak", () => {
  for (const e of [
    event({ correct: false }),
    event({ assisted: true }),
    event({ rating: "unknown" }),
  ]) {
    const p = schedule(undefined, e);
    assert.equal(p.nextReviewAt, "2026-09-01T12:10:00.000Z");
    assert.equal(p.successStreak, 0);
    assert.ok(isWeak(p));
  }
});
test("slow answers shorten interval", () =>
  assert.equal(
    schedule(undefined, event({ responseMs: 18000 })).nextReviewAt,
    "2026-09-02T00:00:00.000Z",
  ));
test("multiple stages in same session advance SRS once", () => {
  const events = Array.from({ length: 4 }, (_, i) =>
    event({ id: "e" + i, at: `2026-09-01T12:00:0${i}.000Z` }),
  );
  const p = progressOf(events).w001;
  assert.equal(p.masteryLevel, 1);
  assert.equal(p.correctCount, 4);
});
test("one failed stage keeps the word weak through session", () => {
  const p = progressOf([
    event({ correct: false }),
    event({ id: "e2", at: "2026-09-01T12:01:00.000Z" }),
  ]).w001;
  assert.equal(p.masteryLevel, 1);
  assert.equal(p.successStreak, 0);
  assert.equal(p.wrongCount, 1);
  assert.ok(isWeak(p));
});
test("new session can advance mastery", () => {
  const p = progressOf([
    event(),
    event({ id: "e2", sessionId: "s2", at: "2026-09-02T12:00:00.000Z" }),
  ]).w001;
  assert.equal(p.masteryLevel, 2);
});
test("flash exposure does not fake recall mastery", () =>
  assert.deepEqual(progressOf([event({ type: "flash" })]), {}));
test("due review outranks new words and queue has no duplicates", () => {
  const s = { ...DEFAULT_SETTINGS, selectedCourses: ["수능 영어"] };
  const q = todayQueue(words, [event()], s, Date.parse("2026-09-03"));
  assert.equal(q[0].id, "w001");
  assert.equal(new Set(q.map((w) => w.id)).size, q.length);
});
test("course constraints respected even with overdue review", () => {
  const q = todayQueue(
    words,
    [event()],
    DEFAULT_SETTINGS,
    Date.parse("2026-09-03"),
  );
  assert.ok(q.every((w) => w.categories.includes("TOEIC")));
});
test("custom only course empty is valid", () =>
  assert.equal(
    todayQueue(words, [], {
      ...DEFAULT_SETTINGS,
      selectedCourses: ["사용자 직접 단어장"],
    }).length,
    0,
  ));
test("choice distractors exclude correct alternatives", () => {
  for (const w of words) {
    const choices = choicesFor(w, "choice", words);
    assert.equal(choices.length, 4);
    assert.equal(new Set(choices).size, 4);
    assert.ok(choices.includes(w.meanings[0]));
  }
});
test("daily missions are stable and contain three unique types", () => {
  const a = missionsFor([], "2026-09-01"),
    b = missionsFor([], "2026-09-01");
  assert.deepEqual(a, b);
  assert.equal(new Set(a.map((m) => m.type)).size, 3);
});
test("XP not farmed by repeating same word and mode in a day", () =>
  assert.equal(
    summary([event(), event({ id: "e2", sessionId: "s2" })], 20).xp,
    5,
  ));
test("streak respects calendar days, yesterday and gap", () => {
  const today = dayKey();
  assert.equal(summary([event({ day: dayOffset(today, -1) })], 20).streak, 1);
  assert.equal(summary([event({ day: dayOffset(today, -2) })], 20).streak, 0);
  assert.equal(
    summary(
      [event({ day: today }), event({ id: "e2", day: dayOffset(today, -1) })],
      20,
    ).streak,
    2,
  );
});
test("flash study time counts active seconds only", () => {
  assert.equal(
    summary([event({ type: "flash", seconds: 180 })], 20).minutes,
    3,
  );
  assert.equal(summary([event({ type: "flash" })], 20).accuracy, 0);
});
test("daily goal XP granted once from goal captured in first event", () => {
  const e = event({ dailyGoal: 1 });
  assert.equal(summary([e], 1).xp, 35);
  assert.equal(summary([e, event({ id: "e2", dailyGoal: 50 })], 50).xp, 35);
});
test("out of order sync produces same progress", () => {
  const a = event(),
    b = event({ id: "e2", sessionId: "s2", at: "2026-09-04T12:00:00.000Z" });
  assert.deepEqual(progressOf([a, b]), progressOf([b, a]));
});
test('yesterday mistakes return with new words even under a review backlog', () => {
  const pool = words.filter(w => w.categories.includes('수능 영어'));
  const now = new Date(2026, 8, 11, 9).getTime();
  const at = new Date(2026, 8, 10, 21).toISOString();
  const events = pool.slice(0, 12).map((w, i) => event({ id: `mix-${i}`, wordId: w.id, sessionId: `mix-${i}`, at, day: dayKey(new Date(at)), correct: false }));
  const queue = todayQueue(pool, events, { ...DEFAULT_SETTINGS, selectedCourses: ['수능 영어'], dailyGoal: 10 }, now);
  assert.equal(queue.length, 10);
  assert.equal(queue.filter(w => events.some(e => e.wordId === w.id)).length, 7);
  assert.equal(new Set(queue.map(w => w.id)).size, 10);
});
test('ordinary learning waits ten minutes before an incorrect word is due', () => {
  const now = new Date(2026, 8, 11, 10).getTime();
  const e = event({ correct: false, at: new Date(now).toISOString(), day: dayKey(new Date(now)) });
  const settings = { ...DEFAULT_SETTINGS, selectedCourses: ['수능 영어'] };
  assert.ok(!todayQueue(words, [e], settings, now + 60000).some(w => w.id === e.wordId));
  assert.ok(todayQueue(words, [e], settings, now + 600001).some(w => w.id === e.wordId));
});
