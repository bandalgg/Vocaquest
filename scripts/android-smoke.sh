#!/usr/bin/env bash
set -euo pipefail
mkdir -p diagnostics
adb install -r android/app/build/outputs/apk/release/app-release.apk
adb logcat -c
adb shell am start -W -n com.vocaquest.app/.MainActivity > diagnostics/launch.txt
sleep 20
adb logcat -d > diagnostics/logcat.txt
adb shell dumpsys activity activities > diagnostics/activities.txt
adb exec-out screencap -p > diagnostics/screen.png
adb shell uiautomator dump /sdcard/window.xml || true
adb pull /sdcard/window.xml diagnostics/window.xml || true
adb shell pidof com.vocaquest.app > diagnostics/pid.txt
python3 - <<'PY'
from pathlib import Path
logs = Path('diagnostics/logcat.txt').read_text(errors='replace')
errors = [line for line in logs.splitlines() if 'ReactNativeJS' in line and (' E ' in line or 'Error:' in line)]
assert 'FATAL EXCEPTION' not in logs, '\n'.join(logs.splitlines()[-150:])
assert not errors, '\n'.join(errors)
screen = Path('diagnostics/window.xml').read_text()
assert 'YOUR FIRST QUEST' in screen, 'Onboarding did not render; inspect diagnostics'
PY
