import React from "react";
import { Pressable, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { allWords, useAppStore } from "../store/useAppStore";
import {
  dayKey,
  isWeak,
  missionsFor,
  progressOf,
  summary,
  todayQueue,
} from "../utils/engine";
import {
  Button,
  Card,
  Chip,
  Icon,
  Page,
  Progress,
  Row,
  Txt,
  useTheme,
  wrap,
} from "../components/UI";
import { COURSES, Mode, Word } from "../types";
export function HomeScreen({
  start,
  onMy,
}: {
  start: (mode: Mode | "flash", words?: Word[]) => void;
  onMy: () => void;
}) {
  const t = useTheme();
  const state = useAppStore();
  const s = state.settings;
  const stats = summary(state.events, s.dailyGoal);
  const p = progressOf(state.events);
  const words = allWords();
  const queue = todayQueue(words, state.events, s);
  const due = words.filter(
    (w) =>
      w.categories.some((c) => s.selectedCourses.includes(c)) &&
      p[w.id] &&
      Date.parse(p[w.id].nextReviewAt) <= Date.now(),
  );
  const weak = words.filter((w) => isWeak(p[w.id]));
  const missions = missionsFor(state.events);
  return (
    <Page>
      <Row style={{ justifyContent: "space-between" }}>
        <Row>
          <View
            style={{
              width: 44,
              height: 44,
              backgroundColor: t.soft,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="planet-outline" color={t.accent} />
          </View>
          <View>
            <Txt size={12} bold color={t.muted}>
              VOCA QUEST
            </Txt>
            <Txt size={17} bold>
              {s.nickname}의 모험
            </Txt>
          </View>
        </Row>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="내 프로필"
          onPress={onMy}
          style={{ padding: 10 }}
        >
          <Icon name="person-circle-outline" size={34} />
        </Pressable>
      </Row>
      <Row style={{ justifyContent: "space-between" }}>
        <Chip title={`✦ LV.${stats.level}`} selected onPress={onMy} />
        <Txt color={t.muted} size={13}>
          {stats.xp % 250} / 250 XP
        </Txt>
        <Txt size={14} bold>
          🔥 {stats.streak}일
        </Txt>
      </Row>
      <Progress value={(stats.xp % 250) / 250} />
      <View style={{ gap: 5, marginVertical: 2 }}>
        <Txt size={30} bold>
          오늘의 나를 한 단어 더.
        </Txt>
        <Txt color={t.muted}>짧은 배움이 오래 남는 기억으로.</Txt>
      </View>
      <LinearGradient
        colors={["#184E43", "#277C61"]}
        style={{ borderRadius: 28, padding: 24, gap: 18, overflow: "hidden" }}
      >
        <View
          style={{
            position: "absolute",
            right: -25,
            top: 10,
            width: 170,
            height: 170,
            borderRadius: 90,
            borderWidth: 25,
            borderColor: "#ffffff0b",
          }}
        />
        <Row style={{ justifyContent: "space-between" }}>
          <Txt color="#D3E7C9" bold size={12}>
            TODAY'S QUEST
          </Txt>
          <Txt size={26} color="#DFCA7F">
            ✦
          </Txt>
        </Row>
        <Txt color="#FFFFFF" size={21} bold>
          오늘의 목표
        </Txt>
        <Row style={{ alignItems: "baseline" }}>
          <Txt size={46} color="#FFFFFF" bold>
            {stats.studied}
          </Txt>
          <Txt size={19} color="#C6DCCB">
            / {s.dailyGoal} 단어
          </Txt>
        </Row>
        <Progress value={stats.studied / s.dailyGoal} color="#D7EC91" />
        <Txt color="#D5E5D7" size={13}>
          {stats.studied >= s.dailyGoal
            ? "✦ 목표 달성! 오늘의 첫 목표 완료에 +30 XP"
            : `${Math.max(0, s.dailyGoal - stats.studied)}단어만 더 만나면 오늘의 목표 완료`}
        </Txt>
        <Button
          title={
            queue.length ? "오늘의 학습 시작  →" : "선택한 코스 복습하기  →"
          }
          onPress={() =>
            start(
              "loop",
              queue.length
                ? queue
                : words
                    .filter((w) =>
                      w.categories.some((c) => s.selectedCourses.includes(c)),
                    )
                    .slice(0, s.dailyGoal),
            )
          }
          style={{ backgroundColor: "#E4F0BB" }}
          secondary
        />
      </LinearGradient>
      <Row>
        {[
          {
            title: "새 단어",
            n: queue.filter((w) => !p[w.id]).length,
            icon: "leaf-outline" as const,
            mode: "loop" as const,
          },
          {
            title: "복습",
            n: due.length,
            icon: "refresh-outline" as const,
            mode: "blank" as const,
          },
          {
            title: "취약",
            n: weak.length,
            icon: "fitness-outline" as const,
            mode: "blank" as const,
          },
        ].map((c, i) => (
          <Pressable
            key={c.title}
            accessibilityRole="button"
            onPress={() =>
              start(c.mode, i === 1 ? due : i === 2 ? weak : queue)
            }
            style={{ flex: 1 }}
          >
            <Card style={{ padding: 14, alignItems: "center" }}>
              <Icon name={c.icon} color={t.accent} />
              <Txt size={23} bold>
                {c.n}
              </Txt>
              <Txt size={12} color={t.muted}>
                {c.title}
              </Txt>
            </Card>
          </Pressable>
        ))}
      </Row>
      <Row style={{ justifyContent: "space-between" }}>
        <Txt size={21} bold>
          오늘의 도전과제
        </Txt>
        <Txt size={12} color={t.accent}>
          {missions.filter((m) => m.completed).length} / 3
        </Txt>
      </Row>
      {missions.every((m) => m.completed) && (
        <Card style={{ backgroundColor: t.soft }}>
          <Txt bold>✦ DAILY COMPLETE · 보너스 +50 XP</Txt>
        </Card>
      )}
      {missions.map((m) => (
        <Card key={m.id} style={{ padding: 16 }}>
          <Row>
            <Icon
              name={m.completed ? "checkmark-circle" : "ellipse-outline"}
              color={t.accent}
            />
            <View style={{ flex: 1, gap: 7 }}>
              <Txt bold size={14}>
                {m.title}
              </Txt>
              <Progress value={m.current / m.target} />
            </View>
            <Txt size={12}>
              {m.current}/{m.target}
            </Txt>
          </Row>
          <Txt size={11} color={t.muted}>
            +{m.rewardXp} XP · +{m.rewardCoins} Coins{" "}
            {m.completed ? "· 지급 완료" : ""}
          </Txt>
        </Card>
      ))}
      <Card>
        <Txt bold>오늘의 집중 시간</Txt>
        <Progress
          value={
            stats.todayEvents.reduce((a, e) => a + e.seconds, 0) /
            (s.dailyMinutes * 60)
          }
        />
        <Txt color={t.muted} size={13}>
          {Math.floor(
            stats.todayEvents.reduce((a, e) => a + e.seconds, 0) / 60,
          )}{" "}
          / {s.dailyMinutes}분
        </Txt>
      </Card>
      <Txt size={20} bold>
        학습 코스
      </Txt>
      <View style={wrap}>
        {COURSES.map((c) => (
          <Chip
            key={c}
            title={c}
            selected={s.selectedCourses.includes(c)}
            onPress={() => {
              const next = s.selectedCourses.includes(c)
                ? s.selectedCourses.filter((x) => x !== c)
                : [...s.selectedCourses, c];
              if (next.length) state.setSettings({ selectedCourses: next });
            }}
          />
        ))}
      </View>
    </Page>
  );
}
