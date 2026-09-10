import {
  DailyMission,
  Mode,
  Rating,
  Settings,
  StudyEvent,
  UserWordProgress,
  Word,
} from "../types";
export const dayKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function dayOffset(day: string, n: number) {
  const d = new Date(day + "T12:00:00");
  d.setDate(d.getDate() + n);
  return dayKey(d);
}
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[’]/g, "'")
    .replace(/[.!?,;:]$/g, "")
    .replace(/\s+/g, " ");
export function distance(a: string, b: string) {
  a = normalize(a);
  b = normalize(b);
  const d = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) d[i][0] = i;
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + Number(a[i - 1] !== b[j - 1]),
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  return d[a.length][b.length];
}
export const similarity = (a: string, b: string) =>
  Math.max(
    0,
    Math.round(
      100 *
        (1 -
          distance(a, b) /
            Math.max(normalize(a).length, normalize(b).length, 1)),
    ),
  );
export const hint = (answer: string) =>
  answer
    .split("")
    .map((c, i) => (i === 0 || i === answer.length - 1 ? c : "_"))
    .join(" ");
export function blankSentence(w: Word) {
  const e = w.examples[0];
  const escaped = e.answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return e.sentence.replace(new RegExp(`\\b${escaped}\\b`, "i"), "______");
}
export function shuffle<T>(items: T[], rng = Math.random) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
export function schedule(
  p: UserWordProgress | undefined,
  e: StudyEvent,
): UserWordProgress {
  const old = p ?? {
    userId: "",
    wordId: e.wordId,
    correctCount: 0,
    wrongCount: 0,
    masteryLevel: 0,
    lastStudiedAt: "",
    nextReviewAt: "",
    averageResponseTime: 0,
    isFavorite: false,
    successStreak: 0,
  };
  const good = e.correct && !e.assisted && e.rating !== "unknown";
  const streak = good ? Math.min(5, old.successStreak + 1) : 0;
  let delay = good ? [1, 3, 7, 14, 30][streak - 1] * 86400000 : 600000;
  if (good && (e.rating === "hard" || e.responseMs > 15000)) delay *= 0.5;
  const count = old.correctCount + old.wrongCount;
  return {
    ...old,
    correctCount: old.correctCount + Number(good),
    wrongCount: old.wrongCount + Number(!good),
    successStreak: streak,
    masteryLevel: good
      ? Math.max(1, Math.min(streak, e.rating === "hard" ? 2 : 5))
      : 1,
    lastStudiedAt: e.at,
    nextReviewAt: new Date(Date.parse(e.at) + delay).toISOString(),
    averageResponseTime:
      (old.averageResponseTime * count + e.responseMs) / (count + 1),
  };
}
export function progressOf(events: StudyEvent[]) {
  const map: Record<string, UserWordProgress> = {};
  const grouped = new Map<string, StudyEvent[]>();
  for (const e of [...events].sort(
    (a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id),
  )) {
    if (e.type === "flash") continue;
    const key = e.sessionId + ":" + e.wordId;
    grouped.set(key, [...(grouped.get(key) ?? []), e]);
  }
  const groups = [...grouped.values()].sort(
    (a, b) =>
      a[a.length - 1].at.localeCompare(b[b.length - 1].at) ||
      a[0].id.localeCompare(b[0].id),
  );
  for (const group of groups) {
    const last = group[group.length - 1];
    const before = map[last.wordId];
    const good = group.filter(
      (e) => e.correct && !e.assisted && e.rating !== "unknown",
    );
    const aggregate = {
      ...last,
      correct: good.length === group.length,
      assisted: good.length !== group.length,
      responseMs: Math.max(...group.map((e) => e.responseMs)),
      rating: group.some((e) => e.rating === "hard")
        ? ("hard" as Rating)
        : last.rating,
    };
    const next = schedule(before, aggregate);
    const n = (before?.correctCount ?? 0) + (before?.wrongCount ?? 0);
    next.correctCount = (before?.correctCount ?? 0) + good.length;
    next.wrongCount = (before?.wrongCount ?? 0) + group.length - good.length;
    next.averageResponseTime =
      ((before?.averageResponseTime ?? 0) * n +
        group.reduce((v, e) => v + e.responseMs, 0)) /
      (n + group.length);
    map[last.wordId] = next;
  }
  return map;
}
export function isWeak(p?: UserWordProgress) {
  return (
    !!p &&
    p.wrongCount > 0 &&
    (p.masteryLevel <= 2 ||
      p.wrongCount / (p.correctCount + p.wrongCount) > 0.4)
  );
}
export function statusOf(p?: UserWordProgress) {
  return !p
    ? "NEW"
    : isWeak(p)
      ? "WEAK"
      : p.masteryLevel === 5
        ? "PERFECT"
        : p.masteryLevel >= 4
          ? "MASTERED"
          : "LEARNING";
}
export function todayQueue(
  words: Word[],
  events: StudyEvent[],
  s: Settings,
  now = Date.now(),
  weakOnly = false,
) {
  const p = progressOf(events);
  const selected = words.filter((w) =>
    w.categories.some((c) => s.selectedCourses.includes(c)),
  );
  const pool = weakOnly ? selected.filter((w) => isWeak(p[w.id])) : selected;
  const due = pool
    .filter((w) => p[w.id] && Date.parse(p[w.id].nextReviewAt) <= now)
    .sort((a, b) => p[a.id].nextReviewAt.localeCompare(p[b.id].nextReviewAt));
  const weak = pool
    .filter((w) => isWeak(p[w.id]))
    .sort((a, b) => p[b.id].wrongCount - p[a.id].wrongCount);
  const fresh = pool
    .filter((w) => !p[w.id])
    .sort(
      (a, b) =>
        Math.abs(a.difficulty - s.level) - Math.abs(b.difficulty - s.level),
    );
  const used = new Set<string>();
  return [...due, ...weak, ...fresh]
    .filter((w) => {
      if (used.has(w.id)) return false;
      used.add(w.id);
      return true;
    })
    .slice(0, s.dailyGoal);
}
export const modeLabels: Record<Mode, string> = {
  loop: "기억 완성 코스",
  choice: "뜻 선택",
  reverse: "영단어 선택",
  typing: "영단어 입력",
  blank: "문장 빈칸",
  listening: "듣고 받아쓰기",
  meaningAudio: "뜻 듣고 선택",
  sentenceAudio: "문장 듣고 빈칸",
  synonym: "유의어",
  antonym: "반의어",
  context: "문맥 속 의미",
  scramble: "철자 배열",
  speaking: "발음 연습",
};
export function answerFor(w: Word, m: Mode) {
  if (["choice", "context"].includes(m)) return w.meanings[0];
  if (["blank", "sentenceAudio"].includes(m)) return w.examples[0].answer;
  if (m === "synonym") return w.synonyms[0];
  if (m === "antonym") return w.antonyms[0];
  return w.word;
}
export function choicesFor(w: Word, m: Mode, words: Word[]) {
  const answer = answerFor(w, m);
  const candidates = words
    .filter((v) => v.id !== w.id)
    .map((v) => (["choice", "context"].includes(m) ? v.meanings[0] : v.word))
    .filter(
      (v) => v !== answer && !w.synonyms.includes(v) && !w.antonyms.includes(v),
    );
  return shuffle([answer, ...shuffle([...new Set(candidates)]).slice(0, 3)]);
}
const missionPool = [
  { type: "words", title: "서로 다른 단어 10개 학습", target: 10 },
  { type: "blank", title: "빈칸 문제 5개 정답", target: 5 },
  { type: "combo", title: "5문제 연속 정답", target: 5 },
  { type: "listening", title: "리스닝 5문제 완료", target: 5 },
  { type: "speaking", title: "발음 연습 3회 완료", target: 3 },
  { type: "weak", title: "취약 단어 3개 복습", target: 3 },
  { type: "flash", title: "깜빡이 5분 학습", target: 300 },
];
export function missionsFor(
  events: StudyEvent[],
  day = dayKey(),
): DailyMission[] {
  const daily = events.filter((e) => e.day === day);
  let seed = [...day].reduce((v, c) => v * 31 + c.charCodeAt(0), 0) >>> 0;
  const rng = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const prior = progressOf(events.filter((e) => e.day < day));
  let combo = 0,
    maxCombo = 0;
  daily
    .filter((e) => e.type !== "flash")
    .forEach((e) => {
      combo = e.correct && !e.assisted ? combo + 1 : 0;
      maxCombo = Math.max(maxCombo, combo);
    });
  const counts: Record<string, number> = {
    words: new Set(daily.map((e) => e.wordId)).size,
    blank: daily.filter((e) => e.type === "blank" && e.correct && !e.assisted)
      .length,
    combo: maxCombo,
    listening: daily.filter((e) =>
      ["listening", "sentenceAudio", "meaningAudio"].includes(e.type),
    ).length,
    speaking: daily.filter((e) => e.type === "speaking").length,
    weak: new Set(
      daily.filter((e) => isWeak(prior[e.wordId])).map((e) => e.wordId),
    ).size,
    flash: Math.floor(
      daily
        .filter((e) => e.type === "flash")
        .reduce((a, e) => a + e.seconds, 0),
    ),
  };
  return shuffle(missionPool, rng)
    .slice(0, 3)
    .map((m) => ({
      ...m,
      id: day + ":" + m.type,
      current: Math.min(m.target, counts[m.type]),
      completed: counts[m.type] >= m.target,
      rewardXp: 50,
      rewardCoins: 20,
    }));
}
export function summary(events: StudyEvent[], goal: number) {
  const days = [...new Set(events.map((e) => e.day))].sort();
  const today = dayKey();
  let streak = 0,
    cursor = days.includes(today) ? today : dayOffset(today, -1);
  while (days.includes(cursor)) {
    streak++;
    cursor = dayOffset(cursor, -1);
  }
  let longestStreak = 0,
    run = 0,
    previous = "";
  for (const d of days) {
    run = previous && dayOffset(previous, 1) === d ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    previous = d;
  }
  let xp = 0,
    coins = 0;
  const rewarded = new Set<string>();
  for (const e of events) {
    const key = `${e.day}:${e.wordId}:${e.type}`;
    if (e.correct && !e.assisted && e.type !== "flash" && !rewarded.has(key)) {
      xp += 5;
      rewarded.add(key);
    }
  }
  for (const d of days) {
    const daily = events.filter((e) => e.day === d);
    const target = daily[0]?.dailyGoal;
    if (target && new Set(daily.map((e) => e.wordId)).size >= target) xp += 30;
    for (const m of missionsFor(events, d))
      if (m.completed) {
        xp += m.rewardXp;
        coins += m.rewardCoins;
      }
    if (missionsFor(events, d).every((m) => m.completed)) xp += 50;
  }
  const attempts = events.filter((e) => e.type !== "flash");
  const todayEvents = events.filter((e) => e.day === today);
  return {
    xp,
    coins,
    level: 1 + Math.floor(xp / 250),
    streak,
    longestStreak,
    studied: new Set(todayEvents.map((e) => e.wordId)).size,
    total: new Set(events.map((e) => e.wordId)).size,
    minutes: Math.floor(events.reduce((a, e) => a + e.seconds, 0) / 60),
    accuracy: attempts.length
      ? Math.round(
          (attempts.filter((e) => e.correct && !e.assisted).length /
            attempts.length) *
            100,
        )
      : 0,
    todayEvents,
    goal,
  };
}
export function adaptiveMode(events: StudyEvent[]): Mode {
  const candidates: Mode[] = [
    "choice",
    "blank",
    "listening",
    "reverse",
    "typing",
    "sentenceAudio",
  ];
  return [...candidates].sort((a, b) => {
    const score = (m: Mode) => {
      const es = events.filter((e) => e.type === m).slice(-20);
      return es.length
        ? es.filter((e) => e.correct && !e.assisted).length / es.length
        : 0.45;
    };
    return score(a) - score(b);
  })[0];
}

export function sessionsOf(events: StudyEvent[], userId: string) {
  const ids = [...new Set(events.map((e) => e.sessionId))];
  return ids.map((id) => {
    const es = events
      .filter((e) => e.sessionId === id)
      .sort((a, b) => a.at.localeCompare(b.at));
    const quizzes = es.filter((e) => e.type !== "flash");
    return {
      id,
      userId,
      startedAt: es[0].at,
      endedAt: es[es.length - 1].at,
      correctAnswers: quizzes.filter((e) => e.correct && !e.assisted).length,
      wrongAnswers: quizzes.filter((e) => !e.correct || e.assisted).length,
      wordsStudied: new Set(es.map((e) => e.wordId)).size,
      xpEarned: summary(es, 20).xp,
    };
  });
}
