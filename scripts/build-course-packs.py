"""Build reproducible 5,000-headword study packs from attributed open data.

Inputs: dictionary JSON, CEFR-J CSV, Octanove CSV. See THIRD_PARTY_NOTICES.md.
These are app-authored learning selections, not official exam frequency lists.
No example sentences are manufactured for entries whose sources have none.
"""
import csv, hashlib, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
dictionary = json.loads(Path(sys.argv[1]).read_text())
profiles = {}
for path in sys.argv[2:4]:
    for row in csv.DictReader(Path(path).open(encoding='utf-8-sig', newline='')):
        for head in row['headword'].split('/'):
            word = head.strip().lower()
            if not re.fullmatch(r'[a-z][a-z-]+', word) or head[0].isupper():
                continue
            p = profiles.setdefault(word, {'pos': set(), 'levels': set()})
            p['pos'].add(row['pos']); p['levels'].add(row['CEFR'])

business = set('''account accountant accounting acquire acquisition advertise advertisement advertising agenda agreement airline airport allocate allocation allowance annual applicant application appointment approval approve asset audit authorize available balance bank benefit bid bill board bonus book booking brand budget business cancel cancellation candidate capacity cargo cash certificate charge client colleague commerce commercial commission committee communicate communication company compensate compensation competitive competitor complaint comply compliance conference confirm confirmation contract contractor corporate corporation cost coupon credit customer customs deadline debt decision deliver delivery demand department deposit destination distribute distribution dividend document efficiency employee employer employment enterprise equipment estimate executive expenditure expense export factory fee finance financial freight fund guarantee headquarters hire hotel import income industry inflation insurance interview inventory invest investment invoice lease license loan logistics luggage maintain maintenance manage management manager manufacture manufacturing market marketing meeting merchandise merger negotiate negotiation notify obligation occupation office operate operation order organization overtime partner partnership passenger payment payroll pension permit personnel policy portfolio position premium presentation price profit promotion proposal purchase qualification recruit recruitment refund register registration regulation reimburse reimbursement rent rental repair replace replacement report reservation reserve resign resignation resume retail revenue review salary sales schedule secretary shipment shipping signature staff stakeholder stock store strategy subscribe subscription supplier supply tariff tax ticket trade train training transaction transfer transport transportation travel vacancy warehouse warranty wholesale withdraw workplace'''.split())
academic = set('''abstract absorb absorption accelerate acceleration accumulate accumulation acid adapt adaptation adjacent analyze analysis anthropology apparent archaeology architecture atmosphere atom attribute bacteria biological biology carbon catalyst cell chemical chemistry chromosome climate cognitive coherent coincide combustion complement complex component composition compound comprehensive comprise compute conception concept conclude conclusion concrete conduct conduction consequence conserve conservation constitute constraint construct construction contemporary contrast contribute conventional convert coordinate correlate correlation criterion crucial crystal cycle data deduce deduction define demonstrate density derive detect dimension distinct diverse diversity document dynamic ecology ecosystem element emission empirical energy enhance enzyme environment equation equivalent erode erosion evaluate evolve evolution evidence excavate exhibit expand experiment explicit external extract factor feature finite fluctuate formula fossil framework frequency fundamental gene generate generation genetic geology gravity habitat hypothesis identify illustrate impact imply incentive incorporate indicate infer inference initial innovation insight institute integrate integration interaction internal interpret interval investigate ion isotope justify laboratory layer lecture liberal link logic magnitude mammal mechanism membrane method methodology microscopic mineral molecule momentum monitor mutual negate neuron nitrogen nuclear objective observe obtain obvious occur organism origin outcome oxygen parameter particle perceive phenomenon philosophy photosynthesis physical physics physiology planet plausible polymer population potential precise predict preliminary presume principle probability procedure process proportion propose protein psychology publication qualitative quantitative radiation random range ratio rational reaction recover reference reflect region reinforce relate relevant reliable replicate research reside resolution resource respond restrict retain reveal reverse revise revolution rigid role sample science scientific sediment selective sequence significant similar simulate solar solution source spatial species specific spectrum stable statistic statistics stimulate structure substance substitute successive sufficient summary supplement sustain symbol synthesize synthesis systematic technology temperature theory thesis tissue transfer transform transition transmit trend underlying uniform unique universe valid variable vary velocity verify virtual visible volume yield'''.split())
reading = set('''author awareness attitude behavior belief challenge character circumstance citizen civilization community compassion confidence conflict conscience conscious consequence context creative creativity critical culture debate democracy describe desire determine dialogue dignity discipline discrimination distinguish emotion emphasize encounter encourage ethical ethics expectation experience expression freedom generation habit historical humanity imagination independent individual influence intention interpretation justice knowledge language literature logical moral motivation narrative opinion opportunity perspective persuade prejudice priority purpose reader reading reason reasonable recognize relationship respect responsibility reveal society social traditional tradition understanding value virtue volunteer welfare wisdom'''.split())

# Corrections to misleading or overly narrow source glosses observed in review.
overrides = {
 'clinic':'의원, 진료소', 'company':'회사; 동료들과 함께 있음', 'climb':'오르다, 등반하다',
 'clog':'막다; 나막신', 'abandon':'버리다, 포기하다', 'abandonment':'포기, 유기',
 'abdicate':'퇴위하다, 책임을 포기하다', 'aberration':'일탈, 이상', 'ablaze':'불타는',
 'account':'계좌; 설명; 설명하다', 'address':'주소; 다루다; 연설하다', 'article':'기사; 물품; 관사',
 'board':'판자; 이사회; 탑승하다', 'book':'책; 예약하다', 'capital':'수도; 자본; 대문자',
 'charge':'요금; 청구하다; 책임을 맡기다', 'commission':'수수료; 위원회; 의뢰하다',
 'conduct':'수행하다; 행동; 전도하다', 'contract':'계약; 계약하다; 수축하다',
 'current':'현재의; 흐름; 전류', 'customs':'세관, 관세', 'decline':'감소하다; 거절하다; 감소',
 'demand':'수요; 요구하다', 'draft':'초안; 초안을 작성하다', 'engage':'참여하다; 고용하다',
 'figure':'수치; 인물; 생각하다', 'fine':'좋은; 미세한; 벌금', 'firm':'회사; 단단한',
 'interest':'관심; 이자; 흥미를 끌다', 'issue':'문제; 발행하다', 'leave':'떠나다; 남기다; 휴가',
 'maintain':'유지하다, 관리하다', 'matter':'문제; 물질; 중요하다', 'minute':'분; 아주 작은',
 'note':'메모; 주목하다; 지폐', 'object':'물체; 목적; 반대하다', 'order':'주문; 순서; 명령하다',
 'party':'파티; 정당; 당사자', 'plant':'식물; 공장; 심다', 'present':'현재의; 선물; 제시하다',
 'principal':'주요한; 교장; 원금', 'process':'과정; 처리하다', 'produce':'생산하다; 농산물',
 'project':'프로젝트; 예상하다; 투사하다', 'property':'재산; 특성', 'purchase':'구매하다; 구매',
 'quarter':'4분의 1; 분기; 지역', 'range':'범위; 다양하게 걸치다', 'rate':'비율; 요금; 평가하다',
 'receipt':'영수증; 수령', 'record':'기록; 기록하다', 'reference':'참고; 언급; 추천서',
 'regard':'여기다; 관심; 존중', 'reserve':'예약하다; 비축하다; 비축량', 'resume':'재개하다; 이력서',
 'return':'돌아오다; 반납하다; 수익', 'review':'검토하다; 복습하다; 평가',
 'sample':'표본, 견본; 시식하다', 'scale':'규모; 척도; 저울', 'security':'보안; 안전; 담보',
 'settle':'해결하다; 정착하다; 지불하다', 'share':'공유하다; 몫; 주식',
 'solution':'해결책; 용액', 'sound':'소리; 건전한; 들리다', 'stock':'재고; 주식; 비축하다',
 'subject':'주제; 과목; 대상', 'term':'용어; 기간; 조건', 'train':'기차; 훈련하다',
 'volume':'부피; 음량; 권', 'yield':'산출하다; 양보하다; 수확량',
 'cell':'세포; 전지; 작은 방', 'compound':'화합물; 복합의; 혼합하다',
 'membrane':'막', 'ion':'이온', 'polymer':'고분자, 중합체', 'catalyst':'촉매',
}
pos_ko = {'noun':'명사','verb':'동사','adjective':'형용사','adverb':'부사','pronoun':'대명사','preposition':'전치사','conjunction':'접속사','determiner':'한정사','interjection':'감탄사','modal auxiliary':'조동사','auxiliary':'조동사','number':'수사'}
levels = {'A1':1,'A2':2,'B1':3,'B2':4,'C1':5,'C2':5}
for correction_file in sorted((ROOT/'src/data').glob('meaning-corrections*.txt')):
    for item in correction_file.read_text().strip().split('|'):
        word, meaning = item.strip().split('=',1)
        overrides[word] = meaning.strip()
original = json.loads((ROOT/'src/data/words.json').read_text())
original_by_word = {w['word'].lower():w for w in original}
entries = {}
for word,p in profiles.items():
    d = dictionary.get(word, {})
    meaning = overrides.get(word, d.get('meaning_ko',''))
    ipa = d.get('ipa','').strip('/')
    if not ipa or not re.search('[가-힣]',meaning) or len(meaning)>100: continue
    pos = sorted(p['pos'])
    if not all(x in pos_ko for x in pos): continue
    entries[word] = original_by_word.get(word) or {
        'id':'lex:'+word, 'word':word, 'pronunciation':ipa, 'ipa':ipa,
        'partOfSpeech':' · '.join(pos_ko[x] for x in pos), 'meanings':[meaning],
        'examples':[], 'synonyms':[], 'antonyms':[],
        'difficulty':min(levels.get(l,5) for l in p['levels']),
        'categories':[], 'frequency':int(d.get('freq_rank') or 50000), 'audioUrl':None,
    }
entries.update(original_by_word)
courses = {}; membership = {}; selected = set()
for course, focus, center in [('수능 영어',reading|academic,3),('TOEIC',business,2),('TOEFL',academic,4)]:
    reserved = [w['word'].lower() for w in original if course in w['categories']]
    def rank(head):
        w=entries[head]
        # Explicit subject vocabulary first, then an independently weighted CEFR/frequency curriculum.
        return (0 if head in focus else 1, abs(w['difficulty']-center)*6000 + min(w['frequency'],30000),head)
    ordered = reserved + [h for h in sorted(entries,key=rank) if h not in reserved]
    heads = ordered[:5000]
    assert len(set(heads))==5000, (course,len(heads))
    courses[course]=[entries[h]['id'] for h in heads]
    for h in heads:
        selected.add(h); membership.setdefault(entries[h]['id'],[]).append(course)
expanded=[]
for head in sorted(selected):
    if head in original_by_word: continue
    w=entries[head];w['categories']=membership[w['id']];expanded.append(w)
out=ROOT/'src/data'
(out/'expanded-words.json').write_text(json.dumps(expanded,ensure_ascii=False,separators=(',',':'))+'\n')
(out/'course-membership.json').write_text(json.dumps(membership,ensure_ascii=False,separators=(',',':'))+'\n')
report={'courseCounts':{c:len(v) for c,v in courses.items()},'uniqueCombined':len(set(w['id'] for w in original)|set(w['id'] for w in expanded)), 'expanded':len(expanded),'withExamples':sum(bool(w['examples']) for w in original+expanded), 'sourceHashes':{Path(p).name:hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in sys.argv[1:4]}, 'overlap':{a+' / '+b:len(set(courses[a])&set(courses[b])) for a,b in [('수능 영어','TOEIC'),('수능 영어','TOEFL'),('TOEIC','TOEFL')]}}
(out/'course-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
