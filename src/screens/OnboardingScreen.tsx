import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { COURSES } from "../types";
import { seedWords, useAppStore } from "../store/useAppStore";
import { choicesFor } from "../utils/engine";
import {
  Button,
  Card,
  Chip,
  Field,
  Page,
  Progress,
  Txt,
  useTheme,
  wrap,
} from "../components/UI";
export function OnboardingScreen() {
  const t = useTheme();
  const settings = useAppStore((s) => s.settings);
  const [step, setStep] = useState(0),
    [courses, setCourses] = useState(settings.selectedCourses),
    [goal, setGoal] = useState(String(settings.dailyGoal)),
    [minutes, setMinutes] = useState(settings.dailyMinutes),
    [index, setIndex] = useState(0),
    [score, setScore] = useState(0);
  const test = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const target = 1 + (i % 5);
        return seedWords.filter((w) => w.difficulty === target)[
          Math.floor(i / 5)
        ];
      }),
    [],
  );
  const word = test[index];
  const choices = useMemo(() => choicesFor(word, "choice", seedWords), [word]);
  function finish() {
    useAppStore
      .getState()
      .setSettings({
        selectedCourses: courses,
        dailyGoal: Math.min(100, Math.max(1, Number(goal) || 20)),
        dailyMinutes: minutes,
        level: Math.max(1, Math.min(5, Math.ceil((score / 18) * 5))),
        onboarded: true,
      });
  }
  return (
    <Page
      subtitle="YOUR FIRST QUEST"
      title={
        step === 0
          ? "어디로 떠나볼까요?"
          : step === 1
            ? "작게 시작해도 좋아요"
            : step === 2
              ? "지금의 실력을 알아볼게요"
              : "준비 완료!"
      }
    >
      <Progress value={(step + 1) / 4} />
      {step === 0 ? (
        <>
          <Txt color={t.muted}>공부하고 싶은 코스를 모두 골라 주세요.</Txt>
          <View style={wrap}>
            {COURSES.map((c) => (
              <Chip
                key={c}
                title={c}
                selected={courses.includes(c)}
                onPress={() =>
                  setCourses(
                    courses.includes(c)
                      ? courses.filter((x) => x !== c)
                      : [...courses, c],
                  )
                }
              />
            ))}
          </View>
          <Button
            title="다음"
            disabled={!courses.length}
            onPress={() => setStep(1)}
          />
        </>
      ) : step === 1 ? (
        <>
          <Card>
            <Txt bold>하루 목표 단어</Txt>
            <View style={wrap}>
              {[10, 20, 30, 50].map((n) => (
                <Chip
                  key={n}
                  title={`${n}개`}
                  selected={goal === String(n)}
                  onPress={() => setGoal(String(n))}
                />
              ))}
            </View>
            <Field
              label="직접 설정 · 1~100개"
              value={goal}
              onChangeText={setGoal}
              keyboardType="number-pad"
            />
            <Txt bold>하루 학습 시간</Txt>
            <View style={wrap}>
              {[5, 10, 15, 20, 30].map((n) => (
                <Chip
                  key={n}
                  title={`${n}분`}
                  selected={minutes === n}
                  onPress={() => setMinutes(n)}
                />
              ))}
            </View>
          </Card>
          <Button title="18문항 레벨 테스트 시작" onPress={() => setStep(2)} />
          <Button title="이전" secondary onPress={() => setStep(0)} />
        </>
      ) : step === 2 ? (
        <>
          <Txt color={t.muted}>
            문제 {index + 1} / 18 · 모르는 단어는 편하게 넘겨 주세요.
          </Txt>
          <Card>
            <Txt bold size={36}>
              {word.word}
            </Txt>
            <Txt>가장 가까운 뜻을 고르세요.</Txt>
            {choices.map((c) => (
              <Button
                key={c}
                title={c}
                secondary
                onPress={() => {
                  if (c === word.meanings[0]) setScore(score + 1);
                  if (index === 17) setStep(3);
                  else setIndex(index + 1);
                }}
              />
            ))}
          </Card>
          <Button
            title="모르겠어요"
            secondary
            onPress={() => (index === 17 ? setStep(3) : setIndex(index + 1))}
          />
        </>
      ) : (
        <>
          <Card>
            <Txt size={48}>✦</Txt>
            <Txt size={28} bold>
              나의 시작 레벨 {Math.max(1, Math.ceil((score / 18) * 5))}
            </Txt>
            <Txt>
              {score} / 18 정답 · 공식 시험 점수가 아닌 초기 학습 난이도
              추정치입니다.
            </Txt>
            <Txt>
              하루 {goal}단어, {minutes}분.{"\n"}정답률에 맞춰 다음 퀘스트를
              조정해 드릴게요.
            </Txt>
          </Card>
          <Button title="나의 퀘스트 열기" onPress={finish} />
        </>
      )}
    </Page>
  );
}
