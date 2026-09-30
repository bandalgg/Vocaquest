import { SessionCheckpoint, Word } from '../types';

export function restoreSession(saved: SessionCheckpoint | null | undefined, words: Word[]) {
  if (!saved || saved.version !== 1 || !Array.isArray(saved.wordIds) || !saved.wordIds.length) return null;
  const byId = new Map(words.map(w => [w.id, w]));
  const queue = saved.wordIds.map(id => byId.get(id));
  const modes = ['loop','choice','reverse','typing','blank','listening','meaningAudio','sentenceAudio','synonym','antonym','context','scramble','speaking'];
  if (!modes.includes(saved.mode) || queue.some(w => !w) || !Number.isInteger(saved.index) || saved.index < 0 || saved.index >= queue.length) return null;
  if (!Number.isInteger(saved.stage) || saved.stage < 0 || saved.stage >= (saved.mode === 'loop' ? 5 : 1)) return null;
  if (typeof saved.sessionId !== 'string' || typeof saved.input !== 'string' || !saved.results || !Array.isArray(saved.usedLetters)) return null;
  return { checkpoint: saved, words: queue as Word[] };
}

export function seededRandom(key: string) {
  let seed = [...key].reduce((s, c) => Math.imul(s, 31) + c.charCodeAt(0), 1) >>> 0;
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
