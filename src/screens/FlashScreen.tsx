import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import * as Crypto from "expo-crypto";
import { Word } from "../types";
import { useAppStore } from "../store/useAppStore";
import { shuffle } from "../utils/engine";
import {
  Back,
  Button,
  Card,
  Icon,
  Page,
  Progress,
  Row,
  Txt,
  useTheme,
} from "../components/UI";
import { speak, stopSpeech } from "../services/audio";
import { useActiveClock } from "../hooks/useActiveClock";
export function FlashScreen({
  words,
  onClose,
}: {
  words: Word[];
  onClose: () => void;
}) {
  const t = useTheme();
  const s = useAppStore((v) => v.settings);
  const favorites = useAppStore((v) => v.favorites);
  const deck = useMemo(() => (s.random ? shuffle(words) : words), []);
  const [index, setIndex] = useState(0),
    [phase, setPhase] = useState(0),
    [round, setRound] = useState(1),
    [paused, setPaused] = useState(false),
    [done, setDone] = useState(false);
  const clock = useActiveClock(!paused && !done);
  const sessionId = useRef(Crypto.randomUUID()).current;
  const startX = useRef(0),
    touchMoved = useRef(false);
  const w = deck[index];
  function flush() {
    const seconds = Math.floor(clock.ms.current / 1000);
    if (seconds > 0)
      useAppStore
        .getState()
        .addEvent({
          wordId: w.id,
          sessionId,
          type: "flash",
          correct: true,
          assisted: false,
          rating: "known",
          responseMs: 0,
          seconds,
        });
    clock.reset();
  }
  function next() {
    flush();
    setPhase(0);
    if (index < deck.length - 1) setIndex(index + 1);
    else if (round < s.repeat) {
      setRound(round + 1);
      setIndex(0);
    } else setDone(true);
  }
  function previous() {
    flush();
    setIndex(Math.max(0, index - 1));
    setPhase(0);
  }
  useEffect(() => {
    if (paused || done || !clock.active) {
      stopSpeech();
      return;
    }
    if (s.autoVoice && phase === 0)
      void speak(s.reverse ? w.meanings[0] : w.word, s.reverse);
    if (phase === 2 && s.exampleAudio) void speak(w.examples[0].sentence);
    const delay =
      ((phase === 0 ? s.wordSeconds : s.meaningSeconds) * 1000) / s.flashSpeed;
    const id = setTimeout(() => {
      if (phase === 0) setPhase(1);
      else if (phase === 1 && s.showExample) setPhase(2);
      else next();
    }, delay);
    return () => {
      clearTimeout(id);
      stopSpeech();
    };
  }, [index, phase, paused, done, round, clock.active]);
  useEffect(() => () => stopSpeech(), []);
  if (done)
    return (
      <Page title="단어가 조금 더 익숙해졌나요?">
        <Card>
          <Icon name="sparkles" size={58} color={t.gold} />
          <Txt size={24} bold>
            {deck.length}단어 · {s.repeat}회 노출 완료
          </Txt>
          <Txt>
            깜빡이는 익숙해지는 단계입니다. 퀴즈를 풀면 기억 수준과 다음
            복습일이 업데이트됩니다.
          </Txt>
        </Card>
        <Button title="학습 메뉴로" onPress={onClose} />
      </Page>
    );
  return (
    <Page subtitle="FLASH MEMORY" title="보고, 듣고, 기억하기">
      <Back
        onPress={() => {
          flush();
          onClose();
        }}
      />
      <Row style={{ justifyContent: "space-between" }}>
        <Txt>
          {index + 1} / {deck.length} 단어
        </Txt>
        <Txt color={t.muted}>
          {round} / {s.repeat}회 · {s.flashSpeed}x
        </Txt>
      </Row>
      <Progress value={(index + 1) / deck.length} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={paused ? "깜빡이 재생" : "깜빡이 일시정지"}
        onTouchStart={(e) => {
          startX.current = e.nativeEvent.pageX;
          touchMoved.current = false;
        }}
        onTouchMove={(e) => {
          if (Math.abs(e.nativeEvent.pageX - startX.current) > 40)
            touchMoved.current = true;
        }}
        onTouchEnd={(e) => {
          if (touchMoved.current) {
            const dx = e.nativeEvent.pageX - startX.current;
            dx < 0 ? next() : previous();
          }
        }}
        onPress={() => {
          if (!touchMoved.current) setPaused(!paused);
        }}
      >
        <Card
          style={{
            minHeight: 360,
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 44,
            backgroundColor: t.soft,
          }}
        >
          <Txt size={12} color={t.accent} bold>
            {phase === 0 ? "RECALL" : phase === 1 ? "CONNECT" : "IN CONTEXT"}
          </Txt>
          <Txt size={44} bold style={{ textAlign: "center" }}>
            {s.reverse
              ? phase === 0
                ? w.meanings.join(" · ")
                : w.word
              : w.word}
          </Txt>
          {phase >= 1 && (!s.reverse ? s.showMeaning : true) && (
            <Txt size={23} bold style={{ textAlign: "center" }}>
              {s.reverse ? w.meanings.join(" · ") : w.meanings.join(" · ")}
            </Txt>
          )}
          {phase === 2 && (
            <View style={{ gap: 12, marginTop: 12 }}>
              <Txt size={19} style={{ textAlign: "center" }}>
                {w.examples[0].sentence}
              </Txt>
              {s.showMeaning && (
                <Txt color={t.muted} style={{ textAlign: "center" }}>
                  {w.examples[0].translation}
                </Txt>
              )}
            </View>
          )}
          <Txt color={t.muted} size={12}>
            {paused
              ? "일시정지 · 탭해서 계속"
              : "탭하면 일시정지 · 좌우로 넘기기"}
          </Txt>
        </Card>
      </Pressable>
      <Row>
        <Button title="이전" secondary style={{ flex: 1 }} onPress={previous} />
        <Button
          title={paused ? "재생" : "멈춤"}
          style={{ flex: 1 }}
          onPress={() => setPaused(!paused)}
        />
        <Button title="다음" secondary style={{ flex: 1 }} onPress={next} />
      </Row>
      <Button
        title={
          favorites.includes(w.id) ? "★ 중요 단어 저장됨" : "☆ 중요 단어로 저장"
        }
        secondary
        onPress={() => useAppStore.getState().toggleFavorite(w.id)}
      />
    </Page>
  );
}
