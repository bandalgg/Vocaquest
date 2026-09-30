import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  BackHandler,
  Pressable,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAppStore, allWords } from "./src/store/useAppStore";
import { Mode, Word } from "./src/types";
import { todayQueue, supportsMode } from "./src/utils/engine";
import { Icon, IconName, Txt, useTheme } from "./src/components/UI";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LearnScreen } from "./src/screens/LearnScreen";
import { WordsScreen } from "./src/screens/WordsScreen";
import { StatsScreen } from "./src/screens/StatsScreen";
import { MyScreen } from "./src/screens/MyScreen";
import { SessionScreen } from "./src/screens/SessionScreen";
import { FlashScreen } from "./src/screens/FlashScreen";
import { ConversationScreen } from "./src/screens/ConversationScreen";
import { stopSpeech } from "./src/services/audio";
import { restoreSession } from './src/utils/checkpoint';
const tabs: { title: string; icon: IconName }[] = [
  { title: "홈", icon: "grid-outline" },
  { title: "학습", icon: "planet-outline" },
  { title: "단어장", icon: "book-outline" },
  { title: "통계", icon: "bar-chart-outline" },
  { title: "MY", icon: "person-outline" },
];
function Shell() {
  const t = useTheme();
  const state = useAppStore();
  const [tab, setTab] = useState(0),
    [session, setSession] = useState<{
      mode: Mode | "flash";
      words: Word[];
    } | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [conversation, setConversation] = useState(false);
  useEffect(() => {
    let mounted = true;
    // Preserve the previous guest storage key without requiring an account.
    void useAppStore.getState().hydrate("guest").then(() => {
      if (mounted) setInitialized(true);
    });
    const lifecycle = AppState.addEventListener("change", (status) => {
      if (status !== "active") stopSpeech();
    });
    return () => {
      mounted = false;
      lifecycle.remove();
      stopSpeech();
    };
  }, []);
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (conversation) { setConversation(false); return true; }
      if (session) {
        Alert.alert("학습을 마칠까요?", "완료한 문제는 저장되었습니다.", [
          { text: "계속", style: "cancel" },
          { text: "마치기", onPress: () => setSession(null) },
        ]);
        return true;
      }
      if (tab !== 0) {
        setTab(0);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [session, tab, conversation]);
  function start(mode: Mode | "flash", words?: Word[]) {
    const saved = restoreSession(useAppStore.getState().savedSession, allWords());
    if (saved && mode !== 'flash' && !words) {
      setSession({ mode: saved.checkpoint.mode, words: saved.words });
      return;
    }
    const chosen = (words ?? todayQueue(allWords().filter(w => supportsMode(w, mode)), state.events, state.settings))
      .filter(w => supportsMode(w, mode)).slice(0, state.settings.dailyGoal);
    if (!chosen.length) {
      Alert.alert(
        "학습할 단어가 없습니다",
        "선택한 범위에 이 문제 유형을 지원하는 단어가 없거나 아직 복습 시간이 되지 않았습니다. 다른 유형이나 코스를 선택해 주세요.",
      );
      return;
    }
    const begin = () => {
      if (mode !== 'flash') useAppStore.getState().saveSession(null);
      setSession({ mode, words: chosen });
    };
    if (saved && mode !== 'flash') {
      Alert.alert('진행 중인 학습이 있어요', '이어하기를 누르면 저장된 문제로 돌아갑니다. 새 학습을 선택해도 완료한 정답 기록은 유지됩니다.', [
        { text: '취소', style: 'cancel' },
        { text: '새 학습', onPress: begin },
        { text: '이어하기', onPress: () => setSession({ mode: saved.checkpoint.mode, words: saved.words }) },
      ]);
    } else begin();
  }
  if (!initialized || !state.ready)
    return (
      <View
        style={{ flex: 1, backgroundColor: t.bg, justifyContent: "center" }}
      >
        <ActivityIndicator size="large" color={t.accent} />
      </View>
    );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style={state.settings.dark ? "light" : "dark"} />
      {state.error && (
        <View style={{ padding: 12, backgroundColor: t.soft }}>
          <Txt color={t.red}>{state.error}</Txt>
        </View>
      )}
      {!state.settings.onboarded ? (
        <OnboardingScreen />
      ) : conversation ? (
        <ConversationScreen onClose={() => setConversation(false)} />
      ) : session ? (
        session.mode === "flash" ? (
          <FlashScreen words={session.words} onClose={() => setSession(null)} />
        ) : (
          <SessionScreen
            words={session.words}
            mode={session.mode}
            onClose={() => setSession(null)}
          />
        )
      ) : (
        <>
          <View style={{ flex: 1 }}>
            {tab === 0 ? (
              <HomeScreen start={start} onMy={() => setTab(4)} />
            ) : tab === 1 ? (
              <LearnScreen start={start} onConversation={() => setConversation(true)} />
            ) : tab === 2 ? (
              <WordsScreen startWeak={(ws) => start("loop", ws)} />
            ) : tab === 3 ? (
              <StatsScreen />
            ) : (
              <MyScreen />
            )}
          </View>
          <View
            style={{
              flexDirection: "row",
              borderTopWidth: 1,
              borderTopColor: t.line,
              backgroundColor: t.card,
              paddingTop: 9,
              paddingBottom: 8,
            }}
          >
            {tabs.map((item, i) => (
              <Pressable
                key={item.title}
                accessibilityRole="tab"
                accessibilityLabel={item.title}
                accessibilityState={{ selected: tab === i }}
                onPress={() => setTab(i)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  gap: 3,
                  minHeight: 49,
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 4,
                    borderRadius: 13,
                    backgroundColor: tab === i ? t.soft : "transparent",
                  }}
                >
                  <Icon
                    name={item.icon}
                    size={22}
                    color={tab === i ? t.accent : t.muted}
                  />
                </View>
                <Txt size={10} bold color={tab === i ? t.accent : t.muted}>
                  {item.title}
                </Txt>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <Shell />
    </SafeAreaProvider>
  );
}
