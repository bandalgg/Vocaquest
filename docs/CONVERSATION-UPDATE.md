# Conversation and next-day review update

## Included

- Learn → 회화학습 시작 opens Lumi, an original character drawn with SVG.
- Three original situations: café, campus directions, arranging a meeting.
- Each situation has five learner sentences. Learners study the sentences before entering a five-turn conversation.
- The target English reply is hidden during recall. Typing and OS speech recognition are supported; recognized text must be submitted explicitly.
- English TTS reads prompts and model replies using existing voice settings.
- Authored alternative replies are accepted after punctuation/case normalization. This is rehearsed phrase practice, not free-form AI conversation or semantic grading.
- Hints, retries and a completion summary are implemented. Latest completion and assisted-answer count are stored per scenario under `vocaquest:conversation:v1`.
- Conversation completion does not inflate vocabulary XP or word totals.

## Review behavior

An unsuccessful attempt schedules a review after 10 minutes. Successful review intervals are 1, 3, 7, 14 and 30 days, shortened for difficult or slow answers. Ordinary daily learning now respects the scheduled review time; explicitly choosing weak-word practice remains unrestricted.

Words answered incorrectly yesterday are prioritized if they remain weak and have not been studied today. When enough words are available, the daily queue reserves about 70% for reviews and the remainder for new words. For example, a goal of 10 with a review backlog gives 7 reviews and 3 new words. Excess reviews remain due; they are not silently marked learned. A goal of one prioritizes review.

Word progress remains keyed by word ID across courses. Existing word IDs, the application ID, storage key `vocaquest:v1:guest` and signing configuration are unchanged. Install over the existing app to retain records; uninstalling clears device data.

## Validation

TypeScript and 26 unit tests pass, including next-day error mixing, no early ordinary review, authored conversation variants, and all five turns in each scenario. The release workflow also installs and launches the APK in an Android 16 emulator. That launch check is not an end-to-end test of microphone recognition or conversation completion on a physical phone.

Manual device acceptance: complete all five café turns by typing; repeat using microphone and hints; restart and confirm the latest completion date; update over an existing installation and confirm word history remains.

## Outstanding: 5,000 words in each exam course

This update still contains the original 108 word records. It is **not** the requested 5,000-per-course release.

Candidate reviewed: https://github.com/jhseo1211/open-english-korean-dict, `dict/words.json`, blob `a85a6be6fcba3e84eee7dd838febb73da78eb6b2`. Its repository declares CC BY-SA 4.0 and documents upstream sources. Inspection found 48,037 entries, 28,395 with IPA, 32,462 without a POS field, and 15,375 with POS `other`. It has no example-sentence pairs or exam-course assignments. It has not been bundled because it is not sufficient for the requested complete learning loop without substantial enrichment and editorial review.

The expanded release needs licensed or original Korean meanings, accurate POS/pronunciation, original or reusable bilingual sentence pairs, and independently reviewed course membership. Overlapping words must share stable IDs. Course counts must count distinct normalized headwords rather than duplicated records or inflections used to fill a quota.
