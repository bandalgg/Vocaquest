import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { Alert, Platform } from "react-native";
import { createAudioPlayer } from "expo-audio";
import { useAppStore } from "../store/useAppStore";
let serial = 0;
export async function speak(text: string, korean = false) {
  const turn = ++serial;
  await Speech.stop();
  if (turn !== serial) return;
  const s = useAppStore.getState().settings;
  Speech.speak(text, {
    language: korean ? "ko-KR" : s.accent,
    rate: s.voiceRate,
    onError: () =>
      Alert.alert(
        "음성을 재생하지 못했습니다",
        "기기 설정에서 영어 음성을 설치하고 미디어 음량을 확인해 주세요.",
      ),
  });
}
export function stopSpeech() {
  serial++;
  void Speech.stop();
}
let success: ReturnType<typeof createAudioPlayer> | undefined,
  failure: ReturnType<typeof createAudioPlayer> | undefined;
export function feedback(correct: boolean) {
  const s = useAppStore.getState().settings;
  if (s.haptic && Platform.OS !== "web")
    void Haptics.notificationAsync(
      correct
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    ).catch(() => {});
  if (s.sound) {
    try {
      success ??= createAudioPlayer(require("../../assets/correct.wav"));
      failure ??= createAudioPlayer(require("../../assets/incorrect.wav"));
      const p = correct ? success : failure;
      void p.seekTo(0);
      p.play();
    } catch {
      /* optional sound must never block study */
    }
  }
}
