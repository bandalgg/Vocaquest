"""Exercise process-death recovery against the actual Android release APK."""
import re
import subprocess
import time
import xml.etree.ElementTree as ET
from pathlib import Path

def adb(*args):
    return subprocess.check_output(['adb', *args], text=True)

def tree():
    adb('shell','uiautomator','dump','/sdcard/voca-resume.xml')
    raw=adb('shell','cat','/sdcard/voca-resume.xml')
    Path('diagnostics/resume-window.xml').write_text(raw)
    return ET.fromstring(raw)

def find(label):
    for direction in [0,0,0,1,1,1,1,1,1,0,0,0]:
        root=tree()
        for n in root.iter('node'):
            if label in (n.get('content-desc',''), n.get('text','')):
                a=list(map(int,re.findall(r'\d+',n.get('bounds',''))))
                if len(a)==4 and a[3]>a[1] and n.get('enabled')=='true': return a
        bounds=list(map(int,re.findall(r'\d+',list(root)[0].get('bounds'))))
        width,height=bounds[2],bounds[3]
        start,end=(int(height*.8),int(height*.3)) if direction==0 else (int(height*.3),int(height*.8))
        adb('shell','input','swipe',str(width//2),str(start),str(width//2),str(end),'250')
    raise AssertionError('Not found: '+label)

def tap(label):
    a=find(label);adb('shell','input','tap',str((a[0]+a[2])//2),str((a[1]+a[3])//2));time.sleep(.4)

def restart():
    time.sleep(2)
    adb('shell','am','force-stop','com.vocaquest.app')
    adb('shell','am','start','-W','-n','com.vocaquest.app/.MainActivity')
    time.sleep(4)
    tap('학습 이어하기  →')

try:
    tap('다음');tap('18문항 레벨 테스트 시작')
    for _ in range(18): tap('모르겠어요')
    tap('나의 퀘스트 열기');tap('오늘의 학습 시작  →')
    tap('기억했어요 · 문제 풀기');tap('모르겠어요 · 정답 보기');tap('다음 문제')
    tap('영어 정답 입력')
    adb('shell','input','text','resumecheck')
    adb('shell','input','keyevent','4')
    before=tree()
    texts=[n.get('text','') for n in before.iter('node')]
    progress=next(t for t in texts if re.fullmatch(r'3 / \d+',t))
    assert 'resumecheck' in texts
    restart()
    find('영어 정답 입력')
    after=tree()
    texts=[n.get('text','') for n in after.iter('node')]
    assert 'resumecheck' in texts, 'Typed answer was lost after force-stop'
    # Scroll up to the progress counter and verify the same problem, not question one.
    find(progress)
    tap('모르겠어요 · 정답 보기')
    find('다음 문제')
    restart()
    find('다음 문제')
    assert not any(n.get('content-desc')=='정답 확인' for n in tree().iter('node')), 'Graded question reverted to unanswered'
    Path('diagnostics/resume-result.txt').write_text('PASS: question 3, typed input, and graded state survive Android force-stop and relaunch.\n')
finally:
    with open('diagnostics/resume-screen.png','wb') as f: subprocess.run(['adb','exec-out','screencap','-p'],stdout=f)
    with open('diagnostics/resume-logcat.txt','w') as f: subprocess.run(['adb','logcat','-d'],stdout=f)
