import React from "react";
import { View } from "react-native";
import { Word } from "../types";
import { Button, Card, Row, Txt, useTheme } from "./UI";
import { speak } from "../services/audio";
import { useAppStore } from "../store/useAppStore";
export function WordCard({
  word: w,
  compact = false,
}: {
  word: Word;
  compact?: boolean;
}) {
  const t = useTheme();
  const favorites = useAppStore((s) => s.favorites);
  const personal = useAppStore((s) => s.personalIds);
  const e = w.examples[0];
  return (
    <Card>
      <Row style={{ justifyContent: "space-between" }}>
        <Txt size={12} color={t.accent} bold>
          {w.partOfSpeech} · LEVEL {w.difficulty}
        </Txt>
        <Button
          title={favorites.includes(w.id) ? "★" : "☆"}
          secondary
          onPress={() => useAppStore.getState().toggleFavorite(w.id)}
        />
      </Row>
      <Txt size={36} bold>
        {w.word}
      </Txt>
      <Txt color={t.muted}>/{w.ipa}/</Txt>
      <Txt size={22} bold>
        {w.meanings.join(" · ")}
      </Txt>
      <Button
        title="발음 듣기"
        icon="volume-high-outline"
        secondary
        onPress={() => void speak(w.word)}
      />
      {!compact && (
        <>
          <View
            style={{ height: 1, backgroundColor: t.line, marginVertical: 5 }}
          />
          <Txt size={18}>{e.sentence}</Txt>
          <Txt color={t.muted}>{e.translation}</Txt>
          <Button
            title="예문 듣기"
            secondary
            onPress={() => void speak(e.sentence)}
          />
          <Txt size={13}>
            유의어 {w.synonyms.join(", ") || "등록된 유의어 없음"}
          </Txt>
          <Txt size={13}>
            반의어 {w.antonyms.join(", ") || "등록된 반의어 없음"}
          </Txt>
          <Button
            title={
              personal.includes(w.id) ? "내 단어장에서 빼기" : "+ 내 단어장"
            }
            secondary
            onPress={() => useAppStore.getState().togglePersonal(w.id)}
          />
        </>
      )}
    </Card>
  );
}
