# Course expansion and resumable daily study

## Vocabulary

- 수능 영어: 5,000 distinct headwords.
- TOEIC: 5,000 distinct headwords.
- TOEFL: 5,000 distinct headwords.
- Combined database: 5,790 unique headwords, including the original 108.
- Overlapping headwords use one ID and one learning record.
- The original 108 IDs and examples are retained. Expanded records use `lex:<headword>`.
- New entries support meaning choices, spelling, dictation, TTS, flashcards and speech practice. Only the 108 entries with examples support sentence modes. Mixed sessions substitute spelling recall for an unavailable sentence exercise.
- Course selections combine topic vocabulary, CEFR levels and an upstream general-frequency ranking. They are app-authored learning selections, not official exam-essential or verified exam-frequency lists.
- Korean gloss corrections are preserved in `src/data/meaning-corrections*.txt`; source and adaptation licenses are in `THIRD_PARTY_NOTICES.md` and accessible in MY.

`scripts/build-course-packs.py DICTIONARY.json CEFRJ.csv OCTANOVE.csv` rebuilds the packs. The dictionary may be the complete JSON from the attributed source or its subset with `meaning_ko`, `ipa` and `freq_rank` for matching profile headwords. Source Git blob identities are in the notices; hashes of the build inputs are in `course-report.json`. No external source is fetched at app runtime.

## Resume behavior

The existing AsyncStorage snapshot now includes `savedSession`, retaining the exact word-ID order, session ID, question index, learning stage, typed answer, failed attempts, feedback, results and response time. Changes are saved after UI updates, on backgrounding and when leaving a session. Home displays “학습 이어하기”. A restarted app opens Home; that button restores the session.

An active session is kept until completed or explicitly replaced by a new one. Course/goal changes do not reorder a saved session. Unsupported or out-of-range checkpoints are ignored safely. Scramble tile order is deterministic for a session/word, so saved letter selections retain their meaning. Automatic next-question timers stop in the background. Deterministic event IDs prevent replaying a completed question from duplicating its stored event.

The app keeps the existing `com.vocaquest.app` application ID, signing setup and `vocaquest:v1:guest` storage key. Do not uninstall the old app when upgrading.

Scope: this checkpoint applies to quiz/daily-learning sessions. Flashcards and the separate conversation screen are not process-death resumable in this release. Local saving errors are displayed; clearing device data or uninstalling removes local records.

## Verification

- TypeScript and 32 unit tests pass locally, including 5,000-per-course counts, shared identities, unsupported-mode exclusion, checkpoint round-trip, invalid checkpoint rejection, and stable scramble order.
- `scripts/android-resume-test.py` is a release gate: complete onboarding, reach question 3, type an answer, force-stop Android, relaunch and restore it. Then force-stop again on a graded question and confirm its graded state is preserved.
- Inspect the workflow's `Android-launch-diagnostics` artifact for the gate result and screenshot. A successful emulator gate is not physical Galaxy S25 Edge microphone validation.
