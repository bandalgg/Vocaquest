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
import { todayQueue } from "./src/utils/engine";
import { Icon, IconName, Txt, useTheme } from "./src/components/UI";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LearnScreen } from "./src/screens/LearnScreen";
import { WordsScreen } from "./src/screens/WordsScreen";
import { StatsScreen } from "./src/screens/StatsScreen";
import { MyScreen } from "./src/screens/MyScreen";
import { SessionScreen } from "./src/screens/SessionScreen";
import { FlashScreen } from "./src/screens/FlashScreen";
import { stopSpeech } from "./src/services/audio";
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
  }, [session, tab]);
  function start(mode: Mode | "flash", words?: Word[]) {
    const chosen =
      words ?? todayQueue(allWords(), state.events, state.settings);
    if (!chosen.length) {
      Alert.alert(
        "학습할 단어가 없습니다",
        "다른 코스를 선택하거나 내 단어장에 단어를 추가해 주세요. 복습할 단어는 복습 시간이 되면 표시됩니다.",
      );
      return;
    }
    setSession({ mode, words: chosen });
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
              <LearnScreen start={start} />
            ) : tab === 2 ? (
              <WordsScreen startWeak={(ws) => start("blank", ws)} />
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
