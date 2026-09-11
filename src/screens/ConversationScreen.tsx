import React, { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Path } from 'react-native-svg';
import { Back, Button, Card, Field, Page, Progress, Txt, useTheme } from '../components/UI';
import { dialogues, Dialogue, replyMatches } from '../data/conversations';
import { feedback, speak, stopSpeech } from '../services/audio';
import { useRecognition } from '../hooks/useRecognition';
import { useAppStore } from '../store/useAppStore';

type Phase = 'choose' | 'memorize' | 'chat' | 'done';
export function ConversationScreen({ onClose }: { onClose: () => void }) {
  const t = useTheme();
  const autoVoice = useAppStore(s => s.settings.autoVoice);
  const [lesson, setLesson] = useState<Dialogue>(dialogues[0]);
  const [phase, setPhase] = useState<Phase>('choose');
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState('');
  const [correct, setCorrect] = useState(false);
  const [hint, setHint] = useState(false);
  const [assisted, setAssisted] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [records, setRecords] = useState<Record<string, { completedAt: string; assisted: number }>>({});
  const turn = lesson.turns[index];
  const recognition = useRecognition(text => { setAnswer(text); setMessage('인식한 문장을 확인하고 제출해 주세요.'); });
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem('vocaquest:conversation:v1').then(raw => {
      if (active && raw) setRecords(JSON.parse(raw));
    }).catch(() => { if (active) setMessage('이전 회화 기록을 불러오지 못했습니다.'); });
    return () => { active = false; stopSpeech(); };
  }, []);
  useEffect(() => {
    if (phase === 'chat' && autoVoice) void speak(turn.prompt);
    return () => stopSpeech();
  }, [phase, index, lesson.id, autoVoice]);
  const resetTurn = () => { recognition.stop(); stopSpeech(); setAnswer(''); setCorrect(false); setHint(false); setMessage(''); };
  function submit() {
    if (correct || !answer.trim()) return;
    recognition.stop();
    const ok = replyMatches(turn, answer);
    feedback(ok);
    setCorrect(ok);
    setMessage(ok ? '잘했어요! 대화를 이어가 볼까요?' : '연습한 표현으로 다시 답해 보세요. 뜻이 같은 다른 문장까지 자동 채점하지는 않아요.');
    if (ok && hint) setAssisted(n => n + 1);
  }
  async function advance() {
    if (savingRef.current) return;
    if (index < lesson.turns.length - 1) {
      setHistory(h => [...h, answer.trim()]); resetTurn(); setIndex(n => n + 1); return;
    }
    savingRef.current = true; setSaving(true);
    try {
      const updated = { ...records, [lesson.id]: { completedAt: new Date().toISOString(), assisted } };
      await AsyncStorage.setItem('vocaquest:conversation:v1', JSON.stringify(updated));
      setRecords(updated); setPhase('done'); stopSpeech();
    } catch { Alert.alert('저장 실패', '기기 저장 공간을 확인한 뒤 다시 눌러 주세요.'); }
    finally { savingRef.current = false; setSaving(false); }
  }
  return <Page title="루미와 한 문장씩" subtitle="CONVERSATION QUEST">
    <Back onPress={() => { recognition.stop(); stopSpeech(); onClose(); }} />
    <View style={{ alignItems: 'center', gap: 6 }}>
      <Svg width={90} height={90} viewBox="0 0 90 90" accessibilityLabel="회화 친구 루미">
        <Circle cx={45} cy={45} r={40} fill={t.soft} /><Path d="M25 25 Q45 5 65 25 L70 59 Q45 85 20 59 Z" fill={t.accent}/>
        <Circle cx={34} cy={40} r={4} fill="white"/><Circle cx={56} cy={40} r={4} fill="white"/><Path d="M35 55 Q45 65 55 55" stroke="white" strokeWidth={3} fill="none"/>
      </Svg><Txt bold>루미</Txt>
    </View>
    {phase === 'choose' ? <>
      <Txt>먼저 내 대답 5개를 듣고 익힌 뒤, 루미와 대화하며 직접 입력하거나 말해 보세요.</Txt>
      {dialogues.map(d => <Card key={d.id}><Txt size={21} bold>{d.title}</Txt><Txt>{d.setting}</Txt>
        {records[d.id] && <Txt color={t.accent}>최근 완료 · {new Date(records[d.id].completedAt).toLocaleDateString('ko-KR')}</Txt>}
        <Button title={`${d.title} · 5문장 학습`} onPress={() => { setLesson(d); setIndex(0); setHistory([]); setAssisted(0); resetTurn(); setPhase('memorize'); }}/></Card>)}
    </> : phase === 'done' ? <Card>
      <Txt size={26} bold>다섯 문장으로 대화했어요!</Txt><Txt>{5 - assisted}문장 스스로 답변 · {assisted}문장 힌트 사용</Txt>
      <Txt>완료 기록을 이 기기에 저장했습니다.</Txt><Button title="다른 상황 고르기" onPress={() => { resetTurn(); setPhase('choose'); }}/>
    </Card> : <>
      <Txt bold>{lesson.title} · {phase === 'memorize' ? '문장 익히기' : '대화하기'} {index + 1} / 5</Txt><Progress value={(index + 1) / 5}/>
      {phase === 'chat' && history.map((reply, i) => <View key={i} style={{ gap: 8 }}><Card><Txt color={t.muted}>루미 · {lesson.turns[i].prompt}</Txt></Card><Card style={{ backgroundColor: t.soft, marginLeft: 30 }}><Txt>나 · {reply}</Txt></Card></View>)}
      <Card><Txt bold>루미</Txt><Txt size={22}>{turn.prompt}</Txt><Txt color={t.muted}>{turn.promptKo}</Txt><Button title="루미의 말 듣기" secondary onPress={() => void speak(turn.prompt)}/></Card>
      <Card style={{ marginLeft: 24, backgroundColor: t.soft }}><Txt bold>나 · {turn.replyKo}</Txt>
        {phase === 'memorize' ? <><Txt size={22} bold>{turn.reply}</Txt><Button title="내 문장 듣고 따라 하기" secondary onPress={() => void speak(turn.reply)}/></> : <>
          <Field label="영어로 답해 보세요" value={answer} onChangeText={setAnswer} autoCapitalize="sentences" autoCorrect={false} editable={!correct} onSubmitEditing={submit} returnKeyType="done"/>
          {!correct && <><Button title={recognition.listening ? '말하기 멈추기' : '마이크로 답하기'} secondary onPress={() => recognition.listening ? recognition.stop() : void recognition.start()} disabled={!recognition.available}/>
            <Button title="대답 제출" onPress={submit} disabled={!answer.trim()}/><Button title="연습한 문장 힌트" secondary onPress={() => setHint(true)}/></>}
          {hint && <Txt>{turn.reply}</Txt>}{message ? <Txt>{message}</Txt> : null}
          {recognition.error ? <Txt color={t.red}>{recognition.error} · 직접 입력할 수도 있어요.</Txt> : null}
          {correct && <Button title={saving ? '저장 중…' : index === 4 ? '대화 완료·저장' : '다음 대화'} onPress={() => void advance()} disabled={saving}/>} 
        </>}
      </Card>
      {phase === 'memorize' && <Button title={index === 4 ? '문장을 가리고 대화 시작' : '다음 문장 익히기'} onPress={() => { resetTurn(); if (index === 4) { setIndex(0); setPhase('chat'); } else setIndex(i => i + 1); }}/>} 
    </>}
  </Page>;
}
