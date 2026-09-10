import React, { useState } from "react";
import { Alert, Switch, View } from "react-native";
import {
  Button,
  Card,
  Chip,
  Field,
  Page,
  Row,
  Txt,
  useTheme,
  wrap,
} from "../components/UI";
import { useAppStore } from "../store/useAppStore";
import { summary } from "../utils/engine";
import { Settings } from "../types";
import { setReminder } from "../services/notifications";
export function MyScreen() {
  const t = useTheme();
  const state = useAppStore();
  const s = state.settings;
  const stats = summary(state.events, s.dailyGoal);
  const [goal, setGoal] = useState(String(s.dailyGoal)),
    [time, setTime] = useState(s.reminder);
  const patch = (v: Partial<Settings>) => state.setSettings(v);
  function toggle(key: keyof Settings, label: string) {
    return (
      <Row style={{ justifyContent: "space-between" }} key={key}>
        <Txt style={{ flex: 1 }}>{label}</Txt>
        <Switch
          accessibilityLabel={label}
          value={Boolean(s[key])}
          onValueChange={(v) => patch({ [key]: v })}
          trackColor={{ true: t.accent, false: t.line }}
        />
      </Row>
    );
  }
  function choose(
    key: keyof Settings,
    label: string,
    values: (number | string)[],
  ) {
    return (
      <View style={{ gap: 10 }} key={key}>
        <Txt bold>{label}</Txt>
        <View style={wrap}>
          {values.map((v) => (
            <Chip
              key={v}
              title={String(v)}
              selected={s[key] === v}
              onPress={() => patch({ [key]: v })}
            />
          ))}
        </View>
      </View>
    );
  }
  async function remind(enabled: boolean) {
    try {
      await setReminder(time, enabled);
      patch({ reminder: time, reminderEnabled: enabled });
      Alert.alert(
        "알림 설정",
        enabled ? `매일 ${time}에 알려드릴게요.` : "학습 알림을 껐습니다.",
      );
    } catch (e) {
      Alert.alert("알림 설정", String(e instanceof Error ? e.message : e));
    }
  }
  return (
    <Page subtitle="MY QUEST" title="내 페이스로, 꾸준히">
      <Card>
        <Txt size={24} bold>
          {s.nickname} · LV.{stats.level}
        </Txt>
        <Txt>
          ✦ {stats.xp} XP ◉ {stats.coins} Coins 🔥 {stats.streak}일
        </Txt>
        <Txt size={12} color={t.muted}>
          로그인 없이 사용 · 이 기기에 저장
        </Txt>
        <Field
          label="닉네임"
          value={s.nickname}
          onChangeText={(nickname) => patch({ nickname })}
          maxLength={20}
        />
      </Card>
      <Card>
        <Txt size={21} bold>
          학습 목표
        </Txt>
        <Field
          label="하루 목표 단어 · 1~100개"
          keyboardType="number-pad"
          value={goal}
          onChangeText={setGoal}
        />
        <Button
          title="목표 저장"
          secondary
          onPress={() => {
            const n = Number(goal);
            if (!Number.isInteger(n) || n < 1 || n > 100) {
              Alert.alert("목표 설정", "1~100 사이 정수를 입력해 주세요.");
              return;
            }
            patch({ dailyGoal: n });
            Alert.alert("목표 저장", `${n}단어로 설정했습니다.`);
          }}
        />
        {choose("dailyMinutes", "하루 목표 시간 · 분", [5, 10, 15, 20, 30])}
      </Card>
      <Card>
        <Txt size={21} bold>
          음성과 학습
        </Txt>
        {toggle("autoVoice", "자동 음성")}
        {choose("voiceRate", "발음 속도", [0.7, 0.85, 1, 1.15])}
        {choose("accent", "발음 언어", ["en-US", "en-GB"])}
        {toggle("exampleAudio", "깜빡이 예문 자동재생")}
        {toggle("sound", "정답 / 오답 효과음")}
        {toggle("haptic", "진동 피드백")}
        {toggle("autoNext", "정답 확인 후 자동 이동")}
        {toggle("dark", "다크모드")}
      </Card>
      <Card>
        <Txt size={21} bold>
          깜빡이 설정
        </Txt>
        {choose("flashSpeed", "재생 속도", [0.5, 0.75, 1, 1.25, 1.5, 2])}
        {choose("wordSeconds", "단어 표시 · 초", [1, 2, 3, 5, 8])}
        {choose("meaningSeconds", "뜻 / 예문 표시 · 초", [1, 2, 3, 5, 8])}
        {choose("repeat", "반복 횟수", [1, 2, 3, 5])}
        {toggle("showExample", "예문 표시")}
        {toggle("showMeaning", "한국어 뜻 표시")}
        {toggle("random", "단어 순서 섞기")}
        {toggle("reverse", "한국어 → 영어")}
      </Card>
      <Card>
        <Txt size={21} bold>
          학습 알림
        </Txt>
        <Field
          label="매일 알려드릴 시간 · HH:MM"
          value={time}
          onChangeText={setTime}
          maxLength={5}
          keyboardType="numbers-and-punctuation"
        />
        <Button
          title="이 시간에 알림 설정"
          secondary
          onPress={() => void remind(true)}
        />
        {s.reminderEnabled && (
          <Button
            title="알림 끄기"
            secondary
            onPress={() => void remind(false)}
          />
        )}
      </Card>
      <Card>
        <Txt bold>데이터와 개인정보</Txt>
        <Txt size={13} color={t.muted}>
          회원가입과 서버 전송 없이 학습 기록을 이 기기에 저장합니다. 앱 삭제 또는 데이터 초기화 시 기록이 사라질 수 있으며 다른 기기와 동기화되지 않습니다. 단어장은 기기에 포함되어 오프라인으로 학습할 수 있습니다. 음성 합성은
          기기에 설치된 언어 음성을 사용합니다. 음성 인식은 운영체제 제공자가
          처리하며 기기 설정에 따라 네트워크를 사용할 수 있습니다. 앱은 음성
          녹음 파일을 저장하지 않습니다.
        </Txt>
      </Card>
    </Page>
  );
}
