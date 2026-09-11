# Android startup crash fix

The Android 16 emulator reproduced the reported immediate exit with `NoClassDefFoundError: expo.modules.kotlin.types.AnyTypeCache` from AssetModule during Expo module registration.

Root-level expo-asset 57.0.16, expo-font 57.0.3 and expo-constants 57.0.17 had been selected by broad transitive peer requirements alongside Expo SDK 54 and expo-modules-core 3.0.30. Direct SDK 54-compatible dependencies now resolve to asset 12.0.13, font 14.0.12 and constants 18.0.14. The regenerated lockfile from the successful build is committed; subsequent builds use npm ci. The native version check prevents the observed mismatch from recurring.

GitHub run 34478878151 successfully built the release APK, installed it on an API 36 x86_64 emulator, launched it, found the onboarding UI, and passed the crash-log check. The APK also includes arm64-v8a for the user's phone. Artifact checksum was verified after download. This is startup verification, not a complete learning flow or physical Galaxy S25 Edge test.

Package com.vocaquest.app, the existing development signing key and the local storage namespace are unchanged. Version code increments with the build run. Install as an update without uninstalling or clearing app data. The release is still the 108-word test version; the 4,000-word expansion remains pending.
