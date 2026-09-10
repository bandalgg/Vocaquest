# VOCA QUEST — 로그인 없는 모바일 앱

Expo SDK 54 / React Native / TypeScript. 설치 후 코스·목표 설정과 레벨 테스트로 바로 시작합니다. Supabase, 회원가입, Google/Apple 로그인과 서버 동기화를 제거했습니다. 환경변수/API 키 설정이 필요 없습니다.

## 데이터
108개 자체 작성 단어/예문이 포함됩니다. 진도, 개인 단어장과 설정은 기기의 AsyncStorage에 저장됩니다. 기존 게스트 저장 키를 유지합니다. 과거 로그인 계정 데이터는 자동 병합하지 않습니다. 앱 삭제/데이터 초기화 시 기록이 사라질 수 있으며 다른 기기로 동기화되지 않습니다.

APK를 직접 전달하며 웹/스토어 공개는 필요 없습니다. 다만 받은 사람이 APK를 재전달하면 다른 사람도 설치할 수 있습니다.

## 개발 실행
Node.js 22 LTS, JDK 17, Android Studio 및 Android SDK를 설치합니다.

```sh
npm ci
npm run typecheck
npm test
npx expo install --check
npm run android
```

USB 디버깅 기기 또는 에뮬레이터가 필요합니다. 음성 인식 네이티브 모듈 때문에 Expo Go 대신 development build를 사용합니다. 이후 Metro는 npm start로 실행합니다.

iOS는 macOS/Xcode에서 npm ci 후 npm run ios로 실행합니다. 실기기 실행에는 서명이 필요합니다.

## 설치용 APK 빌드
이 폴더 내용(.github 포함)을 GitHub 저장소 루트에 올린 뒤 Actions → Build installable Android APK → Run workflow를 실행합니다. 성공한 실행의 VOCA-QUEST-Android-APK artifact를 내려받고 압축을 풀면 arm64 Android용 APK가 있습니다. 서버 키는 필요 없습니다.

로컬 Android SDK가 있는 환경에서는:

```sh
npx expo prebuild --platform android --no-install
cd android
./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a
```

Windows에서는 gradlew.bat 사용. 결과 경로는 android/app/build/outputs/apk/release/app-release.apk 입니다. 기기에서 APK를 연 파일 앱에 '알 수 없는 앱 설치'를 허용해야 할 수 있습니다.

현재 로컬/Actions 방식은 Expo 생성 프로젝트의 기본 debug 서명을 사용하는 테스트 배포용입니다. 장기 배포 전에는 고정 release keystore를 소유자가 보관하고 버전 코드를 증가시켜야 업데이트 서명이 유지됩니다.

대안으로 npx eas-cli login → npx eas-cli build:configure → npx eas-cli build --platform android --profile preview를 사용할 수 있습니다. 빌드 운영자의 Expo 계정이 필요하지만 앱 사용자는 로그인하지 않습니다.

## 구조
- components: 공통 테마와 UI
- screens: 온보딩, 홈, 학습, 세션, 깜빡이, 단어장, 통계, MY
- hooks/services: 활성 시간, TTS/STT, 효과음·진동, 로컬 알림, AI 확장 계약
- store/types: 로컬 기록과 데이터 타입
- utils/data/tests: 반복 학습 엔진, 108단어, 단위 테스트

노출 → 뜻 퀴즈 → 빈칸 입력 → 받아쓰기 → 발음 → 반복 학습을 지원합니다. 목표, 오답, XP, 미션, 통계, 개인 단어장, 다크모드와 알림 설정을 포함합니다.

TTS는 설치된 음성을 사용하며 OS 음성 인식은 기기에 따라 네트워크가 필요합니다. STT 점수는 텍스트 유사도로 음소 정확도가 아닙니다.

APK 컴파일/서명/휴대전화 설치는 아직 완료되지 않았습니다. VERIFICATION.md의 검증 범위를 확인하세요.
