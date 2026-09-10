import React, { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import * as Crypto from "expo-crypto";
import { Word } from "../types";
import { allWords, useAppStore } from "../store/useAppStore";
import { isWeak, progressOf, statusOf } from "../utils/engine";
import {
  Back,
  Button,
  Card,
  Chip,
  Empty,
  Field,
  Page,
  Row,
  Txt,
  useTheme,
  wrap,
} from "../components/UI";
import { WordCard } from "../components/WordCard";
export function WordsScreen({
  startWeak,
}: {
  startWeak: (words: Word[]) => void;
}) {
  const t = useTheme();
  const state = useAppStore();
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("전체"),
    [selected, setSelected] = useState<Word | null>(null),
    [adding, setAdding] = useState(false);
  const [word, setWord] = useState(""),
    [meaning, setMeaning] = useState(""),
    [sentence, setSentence] = useState(""),
    [translation, setTranslation] = useState(""),
    [ipa, setIpa] = useState(""),
    [pos, setPos] = useState("명사"),
    [answer, setAnswer] = useState("");
  const progress = progressOf(state.events);
  const words = allWords();
  const visible = words.filter(
    (w) =>
      (!query ||
        `${w.word} ${w.meanings.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (filter === "전체" ||
        (filter === "내 단어장" && state.personalIds.includes(w.id)) ||
        (filter === "중요" && state.favorites.includes(w.id)) ||
        (filter === "오답노트" && !!progress[w.id]?.wrongCount)),
  );
  function save() {
    const base = word.trim().toLowerCase();
    const form = (answer.trim() || base).toLowerCase();
    if (
      !/^[a-z]+(?:[ '-][a-z]+)*$/.test(base) ||
      !meaning.trim() ||
      !sentence.trim() ||
      !translation.trim()
    ) {
      Alert.alert(
        "단어 확인",
        "영어 단어, 뜻, 예문, 예문 해석을 입력해 주세요.",
      );
      return;
    }
    const escaped = form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`\\b${escaped}\\b`, "i").test(sentence)) {
      Alert.alert(
        "빈칸 정답 확인",
        "예문에 실제로 등장하는 활용형을 입력해 주세요. 예: acquire → acquired",
      );
      return;
    }
    if (words.some((w) => w.word === base)) {
      Alert.alert("이미 있는 단어", "검색 후 내 단어장에 추가해 주세요.");
      return;
    }
    state.addWord({
      id: Crypto.randomUUID(),
      word: base,
      meanings: [meaning.trim()],
      examples: [
        {
          sentence: sentence.trim(),
          translation: translation.trim(),
          answer: form,
        },
      ],
      ipa: ipa.trim(),
      pronunciation: ipa.trim(),
      partOfSpeech: pos,
      synonyms: [],
      antonyms: [],
      difficulty: state.settings.level,
      categories: ["사용자 직접 단어장"],
      frequency: 1,
      audioUrl: null,
    });
    setAdding(false);
    setFilter("내 단어장");
    setWord("");
    setMeaning("");
    setSentence("");
    setTranslation("");
    setAnswer("");
  }
  if (selected)
    return (
      <Page>
        <Back onPress={() => setSelected(null)} />
        <WordCard word={selected} />
      </Page>
    );
  if (adding)
    return (
      <Page title="나의 단어 추가">
        <Back onPress={() => setAdding(false)} />
        <Field
          label="영어 단어"
          value={word}
          onChangeText={setWord}
          autoCapitalize="none"
        />
        <Field label="한국어 뜻" value={meaning} onChangeText={setMeaning} />
        <View style={wrap}>
          {["명사", "동사", "형용사", "부사", "표현"].map((p) => (
            <Chip
              key={p}
              title={p}
              selected={p === pos}
              onPress={() => setPos(p)}
            />
          ))}
        </View>
        <Field label="IPA · 선택" value={ipa} onChangeText={setIpa} />
        <Field
          label="영어 예문"
          value={sentence}
          onChangeText={setSentence}
          multiline
        />
        <Field
          label="예문의 한국어 해석"
          value={translation}
          onChangeText={setTranslation}
          multiline
        />
        <Field
          label="빈칸 정답 · 예문 속 활용형, 원형과 같으면 생략"
          value={answer}
          onChangeText={setAnswer}
          autoCapitalize="none"
        />
        <Button title="내 단어장에 저장" onPress={save} />
      </Page>
    );
  return (
    <Page subtitle="YOUR WORD COLLECTION" title="단어를 모아, 나의 언어로">
      <Field
        accessibilityLabel="단어 검색"
        placeholder="영어 단어 또는 한국어 뜻 검색"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
      />
      <View style={wrap}>
        {["전체", "내 단어장", "중요", "오답노트"].map((f) => (
          <Chip
            key={f}
            title={f}
            selected={filter === f}
            onPress={() => setFilter(f)}
          />
        ))}
      </View>
      <Button
        title="+ 직접 단어 추가"
        secondary
        onPress={() => setAdding(true)}
      />
      {filter === "오답노트" && (
        <Button
          title="취약 단어만 학습"
          onPress={() => startWeak(words.filter((w) => isWeak(progress[w.id])))}
        />
      )}
      <Txt size={13} color={t.muted}>
        {visible.length}개 단어 · 저장된 단어 데이터에서 검색
      </Txt>
      {!visible.length && (
        <Empty
          title="아직 비어 있어요"
          description="단어를 검색해 추가하거나 직접 나만의 예문을 저장해 보세요."
        />
      )}
      {visible.map((w) => {
        const p = progress[w.id];
        const rate = p
          ? Math.round((p.correctCount / (p.correctCount + p.wrongCount)) * 100)
          : 0;
        return (
          <Pressable
            key={w.id}
            accessibilityRole="button"
            accessibilityLabel={`${w.word} 상세 보기`}
            onPress={() => setSelected(w)}
          >
            <Card style={{ padding: 18 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <View style={{ flex: 1 }}>
                  <Txt size={21} bold>
                    {w.word} {state.favorites.includes(w.id) ? "★" : ""}
                  </Txt>
                  <Txt size={14} color={t.muted}>
                    {w.meanings.join(" · ")}
                  </Txt>
                </View>
                <Txt size={10} bold color={isWeak(p) ? t.red : t.accent}>
                  {statusOf(p)}
                </Txt>
              </Row>
              {filter === "오답노트" && p && (
                <>
                  <Txt size={12}>
                    {rate < 40 ? "매우 취약" : rate < 70 ? "취약" : "보통"} ·
                    오답 {p.wrongCount} / 정답 {p.correctCount} · 정답률 {rate}%
                  </Txt>
                  <Txt size={11} color={t.muted}>
                    최근 {new Date(p.lastStudiedAt).toLocaleString("ko-KR")}
                    {"\n"}복습{" "}
                    {new Date(p.nextReviewAt).toLocaleString("ko-KR")}
                  </Txt>
                </>
              )}
            </Card>
          </Pressable>
        );
      })}
    </Page>
  );
}
