import json,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
words=[]
for i,line in enumerate((root/'src/data/seed.txt').read_text().splitlines()):
 w,m,p,ipa,d,s,t,a,syn,ant=line.split('|')
 if i<40: cats=['수능 영어','고등학교 영어', '수능 고난도' if int(d)>=4 else '수능 필수', ['고1','고2','고3'][min(int(d)-1,2)]]
 elif i<70: cats=['TOEIC','비즈니스 영어','Part 5','Part 7','비즈니스 어휘',f'TOEIC {500+max(0,int(d)-1)*100}' if int(d)<5 else 'TOEIC 900+']
 elif i<96: cats=['TOEFL','IELTS','Academic Vocabulary', ['기초','중급','고급'][min(max(int(d)-3,0),2)]]
 else: cats=['중학교 영어','일상 영어','OPIC']
 words.append(dict(id=f'w{i+1:03}',word=w,pronunciation=f'/{ipa}/',ipa=ipa,partOfSpeech=p,meanings=m.split(';'),examples=[dict(sentence=s,translation=t,answer=a)],synonyms=list(filter(None,syn.split(','))),antonyms=list(filter(None,ant.split(','))),difficulty=int(d),categories=cats,frequency=6-int(d),audioUrl=None))
(root/'src/data/words.json').write_text(json.dumps(words,ensure_ascii=False,indent=2)+'\n')
print(f'{len(words)} original words generated')
