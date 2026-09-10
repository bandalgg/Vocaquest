import { Word } from "../types";
export interface LearningAI {
  example(input: {
    word: Word;
    interests: string[];
    level: number;
  }): Promise<{ sentence: string; translation: string }>;
  explain(input: { word: Word; interests: string[] }): Promise<string>;
}
/** Optional implementation should call your authenticated server/Edge Function.
 * Never ship paid AI provider secrets in EXPO_PUBLIC_* variables. */
export const offlineAI: LearningAI = {
  example: async ({ word }) => word.examples[0],
  explain: async ({ word }) =>
    `${word.word}: ${word.meanings.join(", ")}. ${word.examples[0].translation}`,
};
