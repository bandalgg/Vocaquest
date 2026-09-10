export const COURSES = [
  "수능 영어",
  "고등학교 영어",
  "중학교 영어",
  "TOEIC",
  "TOEFL",
  "IELTS",
  "OPIC",
  "비즈니스 영어",
  "일상 영어",
  "사용자 직접 단어장",
] as const;
export type Course = (typeof COURSES)[number];
export interface Word {
  id: string;
  word: string;
  pronunciation: string;
  ipa: string;
  partOfSpeech: string;
  meanings: string[];
  examples: { sentence: string; translation: string; answer: string }[];
  synonyms: string[];
  antonyms: string[];
  difficulty: number;
  categories: string[];
  frequency: number;
  audioUrl: string | null;
}
export type Mode =
  | "loop"
  | "choice"
  | "reverse"
  | "typing"
  | "blank"
  | "listening"
  | "meaningAudio"
  | "sentenceAudio"
  | "synonym"
  | "antonym"
  | "context"
  | "scramble"
  | "speaking";
export type Rating = "unknown" | "hard" | "known" | "perfect";
export interface StudyEvent {
  id: string;
  wordId: string;
  at: string;
  day: string;
  sessionId: string;
  type: Mode | "flash";
  dailyGoal?: number;
  correct: boolean;
  assisted: boolean;
  responseMs: number;
  rating: Rating;
  seconds: number;
}
export interface UserWordProgress {
  userId: string;
  wordId: string;
  correctCount: number;
  wrongCount: number;
  masteryLevel: number;
  lastStudiedAt: string;
  nextReviewAt: string;
  averageResponseTime: number;
  isFavorite: boolean;
  successStreak: number;
}
export interface Settings {
  nickname: string;
  dailyGoal: number;
  dailyMinutes: number;
  selectedCourses: string[];
  level: number;
  onboarded: boolean;
  dark: boolean;
  autoVoice: boolean;
  voiceRate: number;
  accent: "en-US" | "en-GB";
  flashSpeed: number;
  wordSeconds: number;
  meaningSeconds: number;
  showExample: boolean;
  showMeaning: boolean;
  repeat: number;
  random: boolean;
  reverse: boolean;
  exampleAudio: boolean;
  sound: boolean;
  haptic: boolean;
  autoNext: boolean;
  reminder: string;
  reminderEnabled: boolean;
}
export interface DailyMission {
  id: string;
  type: string;
  target: number;
  current: number;
  completed: boolean;
  rewardXp: number;
  rewardCoins: number;
  title: string;
}
export interface StudySession {
  id: string;
  userId: string;
  startedAt: string;
  endedAt: string;
  correctAnswers: number;
  wrongAnswers: number;
  wordsStudied: number;
  xpEarned: number;
}
export interface User {
  id: string;
  nickname: string;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  dailyGoal: number;
  selectedCourses: string[];
}
export interface Snapshot {
  settings: Settings;
  events: StudyEvent[];
  customWords: Word[];
  favorites: string[];
  personalIds: string[];
  profileDirty: boolean;
}
export const DEFAULT_SETTINGS: Settings = {
  nickname: "퀘스터",
  dailyGoal: 20,
  dailyMinutes: 10,
  selectedCourses: ["TOEIC"],
  level: 2,
  onboarded: false,
  dark: false,
  autoVoice: true,
  voiceRate: 1,
  accent: "en-US",
  flashSpeed: 1,
  wordSeconds: 2,
  meaningSeconds: 3,
  showExample: true,
  showMeaning: true,
  repeat: 1,
  random: false,
  reverse: false,
  exampleAudio: false,
  sound: true,
  haptic: true,
  autoNext: false,
  reminder: "20:00",
  reminderEnabled: false,
};
