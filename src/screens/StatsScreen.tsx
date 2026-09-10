import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { allWords, useAppStore } from "../store/useAppStore";
import { dayKey, dayOffset, progressOf, summary } from "../utils/engine";
import {
  Card,
  Icon,
  Page,
  Progress,
  Row,
  Txt,
  useTheme,
} from "../components/UI";
export function StatsScreen() {
  const t = useTheme();
  const state = useAppStore();
  const stats = summary(state.events, state.settings.dailyGoal);
  const p = progressOf(state.events);
  const today = dayKey();
  const weekday = (new Date().getDay() + 6) % 7;
  const monday = dayOffset(today, -weekday);
  const week = Array.from({ length: 7 }, (_, i) => dayOffset(monday, i));
  const amount = (d: string) =>
    new Set(state.events.filter((e) => e.day === d).map((e) => e.wordId)).size;
  const values = week.map(amount);
  const max = Math.max(5, ...values);
  const [selected, setSelected] = useState(today);
  const events = state.events.filter((e) => e.day === selected);
  const attempts = events.filter((e) => e.type !== "flash");
  const totalMastered = Object.values(p).filter(
    (v) => v.masteryLevel === 5,
  ).length;
  const last84 = Array.from({ length: 84 }, (_, i) => dayOffset(today, i - 83));
  const achievements = [
    ["첫 100단어", stats.total, 100],
    ["7일 연속 학습", stats.longestStreak, 7],
    ["30일 연속 학습", stats.longestStreak, 30],
    ["1,000단어 완전 암기", totalMastered, 1000],
    [
      "빈칸 100회 정답",
      state.events.filter((e) => e.type === "blank" && e.correct && !e.assisted)
        .length,
      100,
    ],
    [
      "리스닝 100회 정답",
      state.events.filter(
        (e) => e.type === "listening" && e.correct && !e.assisted,
      ).length,
      100,
    ],
  ] as const;
  return (
    <Page subtitle="GROWTH JOURNAL" title="쌓이는 나의 성장">
      <Row>
        <Card style={{ flex: 1 }}>
          <Txt color={t.muted} size={12}>
            전체 학습 단어
          </Txt>
          <Txt bold size={34}>
            {stats.total}
          </Txt>
          <Txt size={12}>완전 암기 {totalMastered}개</Txt>
        </Card>
        <Card style={{ flex: 1 }}>
          <Txt color={t.muted} size={12}>
            평균 정답률
          </Txt>
          <Txt bold size={34}>
            {stats.accuracy}%
          </Txt>
          <Txt size={12}>누적 {stats.minutes}분</Txt>
        </Card>
      </Row>
      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <Txt size={20} bold>
            이번 주 학습
          </Txt>
          <Txt color={t.accent} bold>
            {values.reduce((a, b) => a + b, 0)} 단어
          </Txt>
        </Row>
        <Svg width="100%" height={180} viewBox="0 0 350 180">
          {values.map((v, i) => (
            <React.Fragment key={i}>
              <Rect
                x={i * 50 + 12}
                y={140 - (v / max) * 100}
                width={26}
                height={Math.max(3, (v / max) * 100)}
                rx={8}
                fill={week[i] === today ? t.accent : t.soft}
              />
              <SvgText
                x={i * 50 + 25}
                y={130 - (v / max) * 100}
                textAnchor="middle"
                fontSize={12}
                fill={t.ink}
              >
                {v}
              </SvgText>
              <SvgText
                x={i * 50 + 25}
                y={165}
                textAnchor="middle"
                fontSize={12}
                fill={t.muted}
              >
                {["월", "화", "수", "목", "금", "토", "일"][i]}
              </SvgText>
            </React.Fragment>
          ))}
        </Svg>
        <Progress
          value={
            values.reduce((a, b) => a + b, 0) / (state.settings.dailyGoal * 5)
          }
        />
        <Txt size={12} color={t.muted}>
          주간 도전 · {state.settings.dailyGoal * 5}단어 / 오늘 {stats.studied}
          단어 / 연속 {stats.streak}일
        </Txt>
      </Card>
      <Card>
        <Txt size={20} bold>
          배움의 발자국
        </Txt>
        <Txt size={12} color={t.muted}>
          최근 84일 · 날짜를 눌러 기록을 확인하세요.
        </Txt>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 5 }}>
            {Array.from({ length: 12 }, (_, col) => (
              <View key={col} style={{ gap: 5 }}>
                {last84.slice(col * 7, col * 7 + 7).map((d) => (
                  <Pressable
                    key={d}
                    accessibilityRole="button"
                    accessibilityLabel={`${d} ${amount(d)}단어`}
                    onPress={() => setSelected(d)}
                    style={{
                      width: 21,
                      height: 21,
                      borderRadius: 5,
                      borderWidth: selected === d ? 2 : 0,
                      borderColor: t.gold,
                      backgroundColor: amount(d) ? t.accent : t.line,
                      opacity: amount(d)
                        ? Math.min(
                            1,
                            0.25 +
                              (amount(d) / state.settings.dailyGoal) * 0.75,
                          )
                        : 0.5,
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
        <Txt bold>{selected}</Txt>
        <Txt size={13}>
          {amount(selected)}단어 ·{" "}
          {Math.floor(events.reduce((a, e) => a + e.seconds, 0) / 60)}분 ·
          정답률{" "}
          {attempts.length
            ? Math.round(
                (attempts.filter((e) => e.correct && !e.assisted).length /
                  attempts.length) *
                  100,
              )
            : 0}
          %
        </Txt>
        <Txt size={13} color={t.muted}>
          획득 XP {summary(events, state.settings.dailyGoal).xp}
        </Txt>
      </Card>
      <Txt size={20} bold>
        코스별 숙련도
      </Txt>
      {state.settings.selectedCourses.map((c) => {
        const ws = allWords().filter((w) => w.categories.includes(c));
        const score = ws.length
          ? ws.reduce((a, w) => a + (p[w.id]?.masteryLevel ?? 0), 0) /
            (ws.length * 5)
          : 0;
        return (
          <Card key={c}>
            <Row style={{ justifyContent: "space-between" }}>
              <Txt bold>{c}</Txt>
              <Txt color={t.accent}>{Math.round(score * 100)}%</Txt>
            </Row>
            <Progress value={score} />
            <Txt color={t.muted} size={12}>
              {ws.length}개 단어 기준
            </Txt>
          </Card>
        );
      })}
      <Txt size={20} bold>
        성장의 배지
      </Txt>
      {achievements.map(([name, current, target]) => (
        <Card key={name}>
          <Row>
            <Icon
              name={current >= target ? "ribbon" : "ribbon-outline"}
              color={current >= target ? t.gold : t.muted}
            />
            <View style={{ flex: 1 }}>
              <Txt bold>{name}</Txt>
              <Txt color={t.muted} size={12}>
                {Math.min(current, target)} / {target}
              </Txt>
            </View>
          </Row>
          <Progress value={current / target} />
        </Card>
      ))}
    </Page>
  );
}
