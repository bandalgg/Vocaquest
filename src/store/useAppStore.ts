import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import raw from "../data/words.json";
import {
  DEFAULT_SETTINGS,
  Settings,
  Snapshot,
  StudyEvent,
  Word,
} from "../types";
import { dayKey } from "../utils/engine";
export const seedWords: Word[] = raw;
const fresh = (): Snapshot => ({
  settings: { ...DEFAULT_SETTINGS },
  events: [],
  customWords: [],
  favorites: [],
  personalIds: [],
  profileDirty: false,
});
type State = Snapshot & {
  account: string;
  ready: boolean;
  error: string;
  syncStatus: string;
  hydrate: (account: string) => Promise<void>;
  setSettings: (s: Partial<Settings>) => void;
  addEvent: (e: Omit<StudyEvent, "id" | "at" | "day">) => void;
  toggleFavorite: (id: string) => void;
  togglePersonal: (id: string) => void;
  addWord: (w: Word) => void;
  merge: (
    events: StudyEvent[],
    words: Word[],
    profile?: Partial<Snapshot>,
  ) => void;
};
let writes = Promise.resolve();
function persist() {
  const s = useAppStore.getState();
  if (!s.ready) return;
  const snap: Snapshot = {
    settings: s.settings,
    events: s.events,
    customWords: s.customWords,
    favorites: s.favorites,
    personalIds: s.personalIds,
    profileDirty: s.profileDirty,
  };
  const key = "vocaquest:v1:" + s.account;
  writes = writes
    .then(() => AsyncStorage.setItem(key, JSON.stringify(snap)))
    .catch(() => {
      useAppStore.setState({
        error: "기록을 저장하지 못했습니다. 기기 저장 공간을 확인해 주세요.",
      });
    });
}
let hydration = 0;
export const useAppStore = create<State>((set, get) => ({
  ...fresh(),
  account: "guest",
  ready: false,
  error: "",
  syncStatus: "로컬 저장",
  hydrate: async (account) => {
    const token = ++hydration;
    set({ ready: false });
    await writes;
    try {
      const str = await AsyncStorage.getItem("vocaquest:v1:" + account);
      if (token !== hydration) return;
      const saved = str ? JSON.parse(str) : fresh();
      set({
        ...fresh(),
        ...saved,
        settings: { ...DEFAULT_SETTINGS, ...saved.settings },
        account,
        ready: true,
        error: "",
        syncStatus: "로컬 저장",
      });
    } catch {
      if (token === hydration)
        set({
          ...fresh(),
          account,
          ready: true,
          error: "저장한 기록을 읽지 못했습니다. 앱을 다시 시작해 주세요.",
        });
    }
  },
  setSettings: (s) => {
    set({ settings: { ...get().settings, ...s }, profileDirty: true });
    persist();
  },
  addEvent: (e) => {
    const events = [
      ...get().events,
      {
        ...e,
        dailyGoal: get().settings.dailyGoal,
        id: Crypto.randomUUID(),
        at: new Date().toISOString(),
        day: dayKey(),
      },
    ];
    const graded = events.filter((x) => x.type !== "flash");
    const recent = graded.slice(-20);
    const rate =
      recent.filter((x) => x.correct && !x.assisted).length /
      Math.max(1, recent.length);
    const adjust =
      e.type !== "flash" && graded.length >= 10 && graded.length % 10 === 0;
    const level = adjust
      ? Math.max(
          1,
          Math.min(
            5,
            get().settings.level + (rate > 0.85 ? 1 : rate < 0.5 ? -1 : 0),
          ),
        )
      : get().settings.level;
    set({
      events,
      settings:
        level !== get().settings.level
          ? { ...get().settings, level }
          : get().settings,
      profileDirty: get().profileDirty || level !== get().settings.level,
    });
    persist();
  },
  toggleFavorite: (id) => {
    set({
      favorites: get().favorites.includes(id)
        ? get().favorites.filter((x) => x !== id)
        : [...get().favorites, id],
      profileDirty: true,
    });
    persist();
  },
  togglePersonal: (id) => {
    set({
      personalIds: get().personalIds.includes(id)
        ? get().personalIds.filter((x) => x !== id)
        : [...get().personalIds, id],
      profileDirty: true,
    });
    persist();
  },
  addWord: (w) => {
    set({
      customWords: [...get().customWords, w],
      personalIds: [...get().personalIds, w.id],
    });
    persist();
  },
  merge: (events, words, profile) => {
    const current = get();
    set({
      ...profile,
      settings: profile?.settings
        ? { ...DEFAULT_SETTINGS, ...profile.settings }
        : current.settings,
      events: [
        ...new Map(
          [...current.events, ...events].map((e) => [e.id, e]),
        ).values(),
      ].sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id)),
      customWords: [
        ...new Map(
          [...current.customWords, ...words].map((w) => [w.id, w]),
        ).values(),
      ],
    });
    persist();
  },
}));
export function allWords() {
  const s = useAppStore.getState();
  return [...seedWords, ...s.customWords];
}
