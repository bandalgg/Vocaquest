import test from 'node:test';
import assert from 'node:assert/strict';
import original from '../src/data/words.json';
import expanded from '../src/data/expanded-words.json';
import membership from '../src/data/course-membership.json';
import { restoreSession, seededRandom } from '../src/utils/checkpoint';
import { stagesFor, supportsMode, shuffle } from '../src/utils/engine';
import { SessionCheckpoint } from '../src/types';
const map: Record<string,string[]> = membership;
const words = [...original,...expanded].map(w => ({...w,categories:[...new Set([...w.categories,...(map[w.id]??[])])]}));
test('each exam course has 5000 distinct headwords and overlap shares IDs',()=>{
  assert.equal(new Set(words.map(w=>w.id)).size,words.length);
  assert.equal(new Set(words.map(w=>w.word.toLowerCase())).size,words.length);
  for(const course of ['수능 영어','TOEIC','TOEFL']) {
    const selected=words.filter(w=>w.categories.includes(course));
    assert.equal(selected.length,5000,course);
    assert.equal(new Set(selected.map(w=>w.word)).size,5000);
  }
  assert.ok(words.every(w=>w.ipa && w.partOfSpeech && /[가-힣]/.test(w.meanings[0])));
});
test('expanded records never enter unsupported sentence or relation modes',()=>{
  for(const w of expanded) {
    assert.equal(supportsMode(w,'blank'),false);
    assert.equal(supportsMode(w,'sentenceAudio'),false);
    assert.equal(supportsMode(w,'context'),false);
    assert.deepEqual(stagesFor(w,'loop'),['loop','choice','typing','listening','speaking']);
  }
  assert.ok(original.every(w=>supportsMode(w,'blank')));
});
const saved: SessionCheckpoint={version:1,sessionId:'resume-session',mode:'loop',wordIds:[words[3].id,words[1].id,words[0].id],index:1,stage:2,input:'acquir',tries:1,resolved:false,correct:false,message:'다시 생각해 보세요.',results:{good:2,total:3},usedLetters:[],responseMs:0,elapsedMs:7200};
test('serialized checkpoint restores exact shuffled queue, stage, input and results',()=>{
  const r=restoreSession(JSON.parse(JSON.stringify(saved)),[...words].reverse());
  assert.ok(r);assert.deepEqual(r.words.map(w=>w.id),saved.wordIds);assert.deepEqual(r.checkpoint,saved);
});
test('incompatible checkpoints cannot start at an invalid question',()=>{
  assert.equal(restoreSession({...saved,index:1000},words),null);
  assert.equal(restoreSession({...saved,stage:5},words),null);
  assert.equal(restoreSession({...saved,wordIds:['deleted-word']},words),null);
  assert.equal(restoreSession(undefined,words),null);
});
test('scrambled letter positions remain stable across process restart',()=>{
  assert.deepEqual(shuffle('acquire'.split(''),seededRandom('session:w1')),shuffle('acquire'.split(''),seededRandom('session:w1')));
});
test('known corrupt imported meanings are replaced',()=>{
  for(const [word,meaning] of [['apple','사과'],['billion','10억'],['pancake','팬케이크'],['signature','서명'],['emotionally','감정적으로']])
    assert.equal(words.find(w=>w.word===word)?.meanings[0],meaning);
});
