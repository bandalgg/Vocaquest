export interface DialogueTurn { prompt: string; promptKo: string; reply: string; replyKo: string; alternatives?: string[] }
export interface Dialogue { id: string; title: string; setting: string; turns: DialogueTurn[] }
export const dialogues: Dialogue[] = [
  { id: 'cafe-v1', title: '카페에서 주문하기', setting: '캐릭터 루미가 카페 직원이에요. 음료를 주문하고 자리를 골라 보세요.', turns: [
    { prompt: 'Hi! What can I get for you?', promptKo: '안녕하세요! 무엇을 드릴까요?', reply: "I'd like an iced latte, please.", replyKo: '아이스 라테 한 잔 주세요.', alternatives: ['I would like an iced latte, please.'] },
    { prompt: 'Sure. What size would you like?', promptKo: '네. 어떤 크기로 드릴까요?', reply: 'A medium would be great.', replyKo: '중간 크기로 주세요.' },
    { prompt: 'Would you like anything to eat?', promptKo: '드실 것도 필요하세요?', reply: "No, thank you. That's all.", replyKo: '아니요, 감사합니다. 그게 전부예요.', alternatives: ['No, thanks. That is all.', 'No, thank you. That is all.'] },
    { prompt: 'Is that for here or to go?', promptKo: '매장에서 드시나요, 가지고 가시나요?', reply: 'For here, please.', replyKo: '매장에서 마실게요.' },
    { prompt: 'You can take any open seat.', promptKo: '빈자리에 앉으시면 돼요.', reply: 'Thank you. Can I sit by the window?', replyKo: '감사합니다. 창가에 앉아도 될까요?' },
  ] },
  { id: 'campus-v1', title: '캠퍼스에서 길 묻기', setting: '루미와 도서관에 가는 길을 이야기해요.', turns: [
    { prompt: 'Hi! You look a little lost.', promptKo: '안녕! 길을 찾는 것 같네.', reply: "I'm looking for the library.", replyKo: '도서관을 찾고 있어요.', alternatives: ['I am looking for the library.'] },
    { prompt: 'The main library is across the courtyard.', promptKo: '중앙 도서관은 안뜰 건너편에 있어.', reply: 'How long does it take to walk there?', replyKo: '걸어서 얼마나 걸리나요?' },
    { prompt: 'About five minutes. Are you new here?', promptKo: '5분 정도야. 여기 처음 왔어?', reply: 'Yes, this is my first week here.', replyKo: '네, 여기 온 첫 주예요.' },
    { prompt: 'I can show you the way after class.', promptKo: '수업 끝나고 길을 안내해 줄 수 있어.', reply: 'That would be really helpful.', replyKo: '그러면 정말 도움이 되겠어요.' },
    { prompt: "Let's meet outside this building at two.", promptKo: '두 시에 이 건물 밖에서 만나자.', reply: "Sounds good. I'll see you then.", replyKo: '좋아요. 그때 봐요.', alternatives: ['Sounds good. I will see you then.'] },
  ] },
  { id: 'meeting-v1', title: '업무 일정 조율하기', setting: '동료 루미와 회의 시간을 정해요.', turns: [
    { prompt: 'Can we talk about the project tomorrow?', promptKo: '내일 프로젝트 이야기를 할 수 있을까요?', reply: "Of course. What time works for you?", replyKo: '물론이죠. 몇 시가 괜찮으세요?' },
    { prompt: 'How about ten in the morning?', promptKo: '오전 열 시는 어떠세요?', reply: "I'm afraid I have another meeting then.", replyKo: '죄송하지만 그때는 다른 회의가 있어요.', alternatives: ['I am afraid I have another meeting then.'] },
    { prompt: 'Would two in the afternoon be better?', promptKo: '오후 두 시가 더 나을까요?', reply: 'Yes, that works for me.', replyKo: '네, 저는 그 시간이 괜찮아요.' },
    { prompt: 'Great. Shall we meet in the small meeting room?', promptKo: '좋아요. 작은 회의실에서 만날까요?', reply: "Sure. I'll bring the latest report.", replyKo: '네. 최신 보고서를 가져갈게요.', alternatives: ['Sure. I will bring the latest report.'] },
    { prompt: "Perfect. I'll send you an invitation.", promptKo: '좋아요. 초대장을 보내드릴게요.', reply: 'Thank you. See you tomorrow.', replyKo: '감사합니다. 내일 뵙겠습니다.' },
  ] },
];
export const normalizeReply = (value: string) => value.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();
export const replyMatches = (turn: DialogueTurn, value: string) => [turn.reply, ...(turn.alternatives ?? [])].some(a => normalizeReply(a) === normalizeReply(value));
