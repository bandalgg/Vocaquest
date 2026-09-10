import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, View } from "react-native";
import * as Crypto from "expo-crypto";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Mode, Rating, Word } from "../types";
import { allWords, useAppStore } from "../store/useAppStore";
import {
  answerFor,
  blankSentence,
  choicesFor,
  distance,
  hint,
  modeLabels,
  normalize,
  shuffle,
  similarity,
} from "../utils/engine";
import {
  Back,
  Button,
  Card,
  Chip,
  Field,
  Icon,
  Page,
  Progress,
  Row,
  Txt,
  useTheme,
  wrap,
} from "../components/UI";
import { WordCard } from "../components/WordCard";
import { feedback, speak, stopSpeech } from "../services/audio";
import { useRecognition } from "../hooks/useRecognition";
import { useActiveClock } from "../hooks/useActiveClock";
export function SessionScreen({
  words,
  mode,
  onClose,
}: {
  words: Word[];
  mode: Mode;
  onClose: () => void;
}) {
  const t = useTheme();
  const settings = useAppStore((s) => s.settings);
  const [index, setIndex] = useState(0),
    [stage, setStage] = useState(0),
    [input, setInput] = useState(""),
    [tries, setTries] = useState(0),
    [resolved, setResolved] = useState(false),
    [correct, setCorrect] = useState(false),
    [message, setMessage] = useState(""),
    [detail, setDetail] = useState(false),
    [done, setDone] = useState(false),
    [results, setResults] = useState({ good: 0, total: 0 }),
    [usedLetters, setUsedLetters] = useState<number[]>([]),
    [transcript, setTranscript] = useState("");
  const sessionId = useRef(Crypto.randomUUID()).current;
  const lock = useRef(false),
    committed = useRef(false);
  const stages: Mode[] =
    mode === "loop"
      ? ["loop", "choice", "blank", "listening", "speaking"]
      : [mode];
  const current = stages[stage];
  const w = words[index];
  const answer = answerFor(w, current);
  const options = useMemo(
    () => choicesFor(w, current, allWords()),
    [w.id, current],
  );
  const letters = useMemo(
    () => shuffle(w.word.split("").map((c, i) => ({ c, i }))),
    [w.id],
  );
  const clock = useActiveClock(!resolved && !done);
  const response = useRef(0);
  const recognition = useRecognition((text) => {
    if (current !== "speaking" || lock.current || done) return;
    setTranscript(text);
    const score = similarity(text, w.word);
    resolve(
      score >= 85,
      `인식: ${text}\n텍스트 유사도 ${score}% · 음소 발음 점수가 아닙니다.`,
    );
  });
  useEffect(() => {
    if (!clock.active) {
      stopSpeech();
      recognition.stop();
    }
  }, [clock.active]);
  useEffect(() => {
    lock.current = false;
    committed.current = false;
    setInput("");
    setUsedLetters([]);
    setTries(0);
    setResolved(false);
    setCorrect(false);
    setMessage("");
    setDetail(false);
    setTranscript("");
    clock.reset();
    if (settings.autoVoice) {
      if (
        current === "loop" ||
        current === "listening" ||
        current === "speaking"
      )
        void speak(w.word);
      if (current === "sentenceAudio") void speak(w.examples[0].sentence);
      if (current === "meaningAudio") void speak(w.meanings[0], true);
    }
    return stopSpeech;
  }, [index, stage]);
  function resolve(ok: boolean, text: string) {
    if (lock.current) return;
    lock.current = true;
    response.current = Math.max(250, clock.ms.current);
    setCorrect(ok);
    setResolved(true);
    setMessage(text);
    feedback(ok);
  }
  function submit(value = input) {
    if (resolved || lock.current || !value.trim()) return;
    const good = normalize(value) === normalize(answer);
    if (good) {
      resolve(
        true,
        current === "blank"
          ? `정답! ${w.word} → ${answer}`
          : "정답! 기억이 한 걸음 더 단단해졌어요.",
      );
      return;
    }
    const n = tries + 1;
    setTries(n);
    if (n >= 3) {
      resolve(false, `정답은 ${answer}입니다. 복습 목록에 저장할게요.`);
    } else {
      feedback(false);
      setMessage(
        `${distance(value, answer) <= 1 ? "거의 맞았어요! 철자를 확인해 보세요." : "다시 생각해 보세요."}${n === 2 ? "\n힌트: " + hint(answer) : ""}`,
      );
    }
  }
  function next(rating: Rating = "known", skip = false) {
    if (committed.current) return;
    committed.current = true;
    stopSpeech();
    recognition.stop();
    if (current !== "loop" && !skip) {
      useAppStore
        .getState()
        .addEvent({
          sessionId,
          wordId: w.id,
          type: current,
          correct,
          assisted: tries > 0 || !correct,
          responseMs: response.current,
          rating,
          seconds: response.current / 1000,
        });
      setResults((r) => ({
        good: r.good + Number(correct && tries === 0),
        total: r.total + 1,
      }));
    }
    if (stage < stages.length - 1) setStage(stage + 1);
    else if (index < words.length - 1) {
      setStage(0);
      setIndex(index + 1);
    } else setDone(true);
  }
  useEffect(() => {
    if (resolved && settings.autoNext) {
      const id = setTimeout(() => next(), 1600);
      return () => clearTimeout(id);
    }
  }, [resolved, settings.autoNext]);
  const select = [
    "choice",
    "reverse",
    "meaningAudio",
    "synonym",
    "antonym",
    "context",
  ].includes(current);
  const total = words.length * stages.length,
    position = index * stages.length + stage + 1;
  if (done)
    return (
      <Page subtitle="QUEST COMPLETE" title="오늘도 한 걸음 성장했어요">
        <Animated.View entering={FadeInDown}>
          <Card style={{ alignItems: "center", paddingVertical: 34 }}>
            <Icon name="sparkles" size={64} color={t.gold} />
            <Txt size={32} bold>
              퀘스트 완료!
            </Txt>
            <Txt size={20}>
              {results.good} / {results.total} 첫 시도 정답
            </Txt>
            <Txt color={t.muted}>
              결과는 기기에 저장되었습니다.{"\n"}틀린 단어는 10분 뒤 다시
              만나요.
            </Txt>
          </Card>
        </Animated.View>
        <Button title="홈으로 돌아가기" onPress={onClose} />
      </Page>
    );
  return (
    <Page>
      <Back
        onPress={() =>
          Alert.alert(
            "학습을 마칠까요?",
            "완료한 문제의 기록은 저장되어 있습니다.",
            [
              { text: "계속 학습", style: "cancel" },
              { text: "나가기", onPress: onClose },
            ],
          )
        }
      />
      <Row style={{ justifyContent: "space-between" }}>
        <Txt size={12} bold color={t.accent}>
          {modeLabels[current]}
        </Txt>
        <Txt color={t.muted}>
          {position} / {total}
        </Txt>
      </Row>
      <Progress value={(position - 1) / total} />
      {current === "loop" ? (
        <>
          <Txt size={21} bold>
            먼저 보고, 듣고, 기억하세요.
          </Txt>
          <WordCard word={w} />
          <Button title="기억했어요 · 문제 풀기" onPress={() => next()} />
        </>
      ) : (
        <>
          <Animated.View
            key={`${index}:${stage}`}
            entering={FadeInDown.duration(220)}
          >
            <Card style={{ minHeight: 210, justifyContent: "center" }}>
              {current === "listening" ? (
                <>
                  <Icon name="headset-outline" size={50} color={t.accent} />
                  <Txt size={22} bold>
                    들리는 단어를 입력하세요
                  </Txt>
                </>
              ) : current === "meaningAudio" ? (
                <Txt size={23} bold>
                  뜻을 듣고 영어 단어를 고르세요
                </Txt>
              ) : ["blank", "sentenceAudio"].includes(current) ? (
                <>
                  <Txt size={23} bold>
                    {blankSentence(w)}
                  </Txt>
                  <Txt color={t.muted}>{w.examples[0].translation}</Txt>
                </>
              ) : current === "typing" ||
                current === "reverse" ||
                current === "scramble" ? (
                <>
                  <Txt size={27} bold>
                    {w.meanings.join(" · ")}
                  </Txt>
                  <Txt color={t.muted}>
                    {current === "scramble"
                      ? "글자를 눌러 단어를 완성하세요"
                      : "영어로 떠올려 보세요"}
                  </Txt>
                </>
              ) : current === "context" ? (
                <>
                  <Txt size={21}>{w.examples[0].sentence}</Txt>
                  <Txt color={t.accent} bold>
                    이 문장에서 {w.word}의 뜻은?
                  </Txt>
                </>
              ) : (
                <>
                  <Txt size={37} bold>
                    {w.word}
                  </Txt>
                  <Txt color={t.muted}>
                    {current === "synonym"
                      ? "가장 가까운 유의어를 고르세요"
                      : current === "antonym"
                        ? "반대 의미의 단어를 고르세요"
                        : current === "speaking"
                          ? "듣고, 직접 말해 보세요"
                          : "가장 가까운 뜻을 고르세요"}
                  </Txt>
                </>
              )}
              {[
                "listening",
                "sentenceAudio",
                "meaningAudio",
                "speaking",
              ].includes(current) && (
                <Button
                  title="다시 듣기"
                  secondary
                  icon="volume-high-outline"
                  onPress={() =>
                    void speak(
                      current === "sentenceAudio"
                        ? w.examples[0].sentence
                        : current === "meaningAudio"
                          ? w.meanings[0]
                          : w.word,
                      current === "meaningAudio",
                    )
                  }
                />
              )}
            </Card>
          </Animated.View>
          {select ? (
            <View style={{ gap: 10 }}>
              {options.map((o, i) => (
                <Button
                  key={o}
                  title={`${i + 1}   ${o}`}
                  secondary
                  disabled={resolved}
                  onPress={() => submit(o)}
                />
              ))}
            </View>
          ) : current === "speaking" ? (
            <>
              <Button
                title={
                  recognition.listening ? "듣는 중 · 종료" : "눌러서 말하기"
                }
                icon="mic-outline"
                disabled={resolved || !recognition.available}
                onPress={() =>
                  recognition.listening
                    ? recognition.stop()
                    : void recognition.start()
                }
              />
              {recognition.error && (
                <Txt color={t.red}>{recognition.error}</Txt>
              )}
              {!recognition.available && (
                <Txt color={t.muted}>
                  이 기기에서 음성 인식을 사용할 수 없습니다. 발음 듣기는 사용할
                  수 있어요.
                </Txt>
              )}
              {!resolved && (
                <Button
                  title="발음은 다음에 연습하기"
                  secondary
                  onPress={() => next("known", true)}
                />
              )}
            </>
          ) : current === "scramble" ? (
            <>
              <Card>
                <Txt size={27} bold>
                  {usedLetters.map((i) => letters[i].c).join("") || "___"}
                </Txt>
                <View style={wrap}>
                  {letters.map((l, i) => (
                    <Chip
                      key={l.i}
                      title={l.c}
                      selected={usedLetters.includes(i)}
                      onPress={() => {
                        if (!resolved && !usedLetters.includes(i))
                          setUsedLetters([...usedLetters, i]);
                      }}
                    />
                  ))}
                </View>
                <Button
                  title="한 글자 지우기"
                  secondary
                  disabled={resolved}
                  onPress={() => setUsedLetters(usedLetters.slice(0, -1))}
                />
              </Card>
              <Button
                title="정답 확인"
                disabled={resolved || !usedLetters.length}
                onPress={() =>
                  submit(usedLetters.map((i) => letters[i].c).join(""))
                }
              />
            </>
          ) : (
            <>
              <Field
                accessibilityLabel="영어 정답 입력"
                placeholder="영어로 입력하세요"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                value={input}
                onChangeText={setInput}
                editable={!resolved}
                onSubmitEditing={() => submit()}
                returnKeyType="done"
              />
              <Button
                title="정답 확인"
                disabled={resolved || !input.trim()}
                onPress={() => submit()}
              />
            </>
          )}
          {message && (
            <Card
              style={{ backgroundColor: resolved && correct ? t.soft : t.card }}
            >
              <Txt bold color={resolved && !correct ? t.red : t.ink}>
                {message}
              </Txt>
              {resolved && (
                <>
                  <Txt size={13} color={t.muted}>
                    {correct && tries === 0
                      ? "같은 날 처음 맞힌 단어·문제 유형에 +5 XP"
                      : "취약 단어로 기록 · 짧은 간격으로 복습"}
                  </Txt>
                  <Button
                    title={detail ? "설명 접기" : "자세히 보기"}
                    secondary
                    onPress={() => setDetail(!detail)}
                  />
                  {detail && <WordCard word={w} compact />}
                </>
              )}
            </Card>
          )}
          {resolved ? (
            <>
              <Txt size={13} color={t.muted}>
                기억하기 얼마나 쉬웠나요? 선택하면 다음 문제로 이동합니다.
              </Txt>
              <View style={wrap}>
                {(
                  [
                    ["unknown", "몰라요"],
                    ["hard", "어려워요"],
                    ["known", "알아요"],
                    ["perfect", "완벽해요"],
                  ] as const
                ).map(([r, l]) => (
                  <Chip key={r} title={l} onPress={() => next(r)} />
                ))}
              </View>
              <Button title="다음 문제" onPress={() => next()} />
            </>
          ) : (
            current !== "speaking" && (
              <Button
                title="모르겠어요 · 정답 보기"
                secondary
                onPress={() =>
                  resolve(
                    false,
                    `정답은 ${answer}입니다. 취약 단어에 저장할게요.`,
                  )
                }
              />
            )
          )}
        </>
      )}
    </Page>
  );
}
