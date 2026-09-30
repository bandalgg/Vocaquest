# Vocabulary data attribution

The expanded dictionary (`src/data/expanded-words.json`), Korean meaning corrections,
and course selections are distributed under **Creative Commons Attribution-ShareAlike 4.0 International**:
https://creativecommons.org/licenses/by-sa/4.0/ . Retain attribution and license information when redistributing adaptations.

1. **Open English-Korean Dictionary**, LexiSnap project team and community contributors.
   https://github.com/jhseo1211/open-english-korean-dict — CC BY-SA 4.0.
   Source: `dict/words.json`, Git blob `a85a6be6fcba3e84eee7dd838febb73da78eb6b2`.
   Supplies Korean glosses and IPA; VOCA QUEST filters headwords and corrects many Korean glosses.
2. **The CEFR-J Wordlist Version 1.5**, compiled by Yukio Tono, Tokyo University of Foreign Studies.
   Copyright Tono Laboratory at TUFS. Source project's retrieval date: January 20, 2020.
   http://www.cefr-j.org/download.html
   Distributed by https://github.com/openlanguageprofiles/olp-en-cefrj .
   Its terms permit research and commercial use at no charge with proper citation.
   Source: `cefrj-vocabulary-profile-1.5.csv`, blob `e89799a7f91a8ae5540e722874edf9158ef8685b`.
   Supplies headwords, parts of speech and learning levels. Neither CEFR-J nor Open Language Profiles endorses this app or its course selections.
3. **Octanove Vocabulary Profile C1/C2 Version 1.0**, Octanove Labs.
   https://github.com/openlanguageprofiles/olp-en-cefrj — CC BY-SA 4.0.
   Source blob `3a0505e98c9a6ef92be32466e43de4b7f14683d0`.

Upstream sources credited by Open English-Korean Dictionary:

- kengdic, https://github.com/garfieldnate/kengdic — CC BY-SA 3.0.
- cc-kedict, https://github.com/mhagiwara/cc-kedict — CC BY-SA 3.0.
- ipa-dict, https://github.com/open-dict-data/ipa-dict — MIT.
- CMU Pronouncing Dictionary, http://www.speech.cs.cmu.edu/cgi-bin/cmudict — BSD.
- New General Service List, http://www.newgeneralservicelist.org — CC BY-SA (as identified upstream).
- New Academic Word List, http://www.newacademicwordlist.org — CC BY-SA (as identified upstream).
- Wiktionary via https://kaikki.org — CC BY-SA (as identified upstream).

The source repository's complete credits are at:
https://github.com/jhseo1211/open-english-korean-dict/blob/main/CREDITS.md .
VOCA QUEST changes include selection, Korean gloss corrections, merged parts of speech,
course assignment, stable IDs and conversion to the app schema. These changes are not
endorsed by source authors. The original 108 examples and the Lumi conversations were
authored for this app; no examples from commercial exam books are included.

## Scope and limits

Each of the three study courses contains 5,000 distinct normalized English headwords.
Courses overlap and share progress. They are independently weighted learning selections
from general English and topic-focused vocabulary, **not official exam-essential lists**
and not a claim of verified exam occurrence frequency. `frequency` is an upstream ranking,
not an occurrence count in an examination corpus.

New entries have pronunciation, Korean meaning, POS and difficulty. They do not contain
invented filler examples. Entries without examples use spelling recall in the mixed loop;
sentence-only modes filter to entries that actually have an example. Coverage is displayed
in the learning screen and recorded in `src/data/course-report.json`.
