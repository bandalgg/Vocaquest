import React, { useState } from "react";
import { View } from "react-native";
import { allWords, useAppStore } from "../store/useAppStore";
import {
  adaptiveMode,
  isWeak,
  modeLabels,
  progressOf,
  todayQueue,
} from "../utils/engine";
import {
  Button,
  Card,
  Chip,
  Page,
  Txt,
  useTheme,
  wrap,
} from "../components/UI";
import { Mode, Word } from "../types";
export function LearnScreen({
  start,
  onConversation,
}: {
  start: (m: Mode | "flash", words?: Word[]) => void;
  onConversation: () => void;
}) {
  const t = useTheme();
  const state = useAppStore();
  const [category, setCategory] = useState("전체");
  const courseWords = allWords().filter((w) =>
    w.categories.some((c) => state.settings.selectedCourses.includes(c)),
  );
  const subs = [...new Set(courseWords.flatMap((w) => w.categories))].filter(
    (c) => !state.settings.selectedCourses.includes(c),
  );
  const pool =
    category === "전체"
      ? courseWords
      : courseWords.filter((w) => w.categories.includes(category));
  const p = progressOf(state.events);
  const queue = todayQueue(pool, state.events, state.settings);
  const deck = (queue.length ? queue : pool).slice(0, state.settings.dailyGoal);
  return (
    <Page subtitle="TRAIN YOUR MEMORY" title="나만의 학습 루틴">
      <Card><Txt size={22} bold>루미와 회화 학습</Txt><Txt>5문장을 익히고 캐릭터와 직접 대화해 보세요.</Txt><Button title="회화학습 시작" onPress={onConversation}/></Card>
      <Card style={{ backgroundColor: t.soft }}>
        <Txt size={23} bold>
          보고 → 떠올리고 → 말하기
        </Txt>
        <Txt>
          한 단어를 여러 감각으로 만나보세요. 전체 코스는 노출, 뜻 선택, 빈칸,
          받아쓰기, 발음 순서로 진행됩니다.
        </Txt>
        <Button
          title="기억 완성 코스 시작"
          onPress={() => start("loop", deck)}
        />
        <Button
          title={`약한 유형 집중 · ${modeLabels[adaptiveMode(state.events)]}`}
          secondary
          onPress={() => start(adaptiveMode(state.events), deck)}
        />
      </Card>
      <Txt bold>시험별 세부 단어장</Txt>
      <View style={wrap}>
        {["전체", ...subs].map((c) => (
          <Chip
            key={c}
            title={c}
            selected={category === c}
            onPress={() => setCategory(c)}
          />
        ))}
      </View>
      <Txt color={t.muted}>
        {pool.length}개 단어 · 지금 학습 {deck.length}개
      </Txt>
      <Button
        title="깜빡이 자동 학습"
        icon="flash-outline"
        onPress={() => start("flash", deck)}
      />
      <Button
        title="취약 단어만 학습"
        secondary
        onPress={() =>
          start(
            "blank",
            pool.filter((w) => isWeak(p[w.id])),
          )
        }
      />
      <Txt size={20} bold>
        원하는 방식으로 연습
      </Txt>
      {(Object.entries(modeLabels) as [Mode, string][])
        .filter(([m]) => m !== "loop")
        .map(([m, label]) => (
          <Button
            key={m}
            title={label + "  →"}
            secondary
            onPress={() =>
              start(
                m,
                deck.filter((w) =>
                  m === "synonym"
                    ? w.synonyms.length > 0
                    : m === "antonym"
                      ? w.antonyms.length > 0
                      : true,
                ),
              )
            }
          />
        ))}
    </Page>
  );
}
