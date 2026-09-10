import { useEffect, useRef, useState } from "react";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { stopSpeech } from "../services/audio";
import { useAppStore } from "../store/useAppStore";
export function useRecognition(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const callback = useRef(onResult);
  callback.current = onResult;
  useSpeechRecognitionEvent("start", () => setListening(true));
  useSpeechRecognitionEvent("end", () => setListening(false));
  useSpeechRecognitionEvent("error", (e) => {
    setError(
      e.error === "not-allowed"
        ? "마이크·음성 인식 권한을 허용해 주세요."
        : e.message || "음성 인식을 사용할 수 없습니다.",
    );
    setListening(false);
  });
  useSpeechRecognitionEvent("result", (e) => {
    if (e.isFinal && e.results[0]) callback.current(e.results[0].transcript);
  });
  useEffect(
    () => () => {
      ExpoSpeechRecognitionModule.abort();
    },
    [],
  );
  return {
    listening,
    error,
    available: ExpoSpeechRecognitionModule.isRecognitionAvailable(),
    start: async () => {
      setError("");
      try {
        stopSpeech();
        const p = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!p.granted) {
          setError("설정에서 마이크·음성 인식 권한을 허용해 주세요.");
          return;
        }
        ExpoSpeechRecognitionModule.start({
          lang: useAppStore.getState().settings.accent,
          interimResults: false,
          continuous: false,
          maxAlternatives: 1,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "음성 인식 시작 실패");
      }
    },
    stop: () => ExpoSpeechRecognitionModule.stop(),
  };
}
