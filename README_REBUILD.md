# E.D.I.T.H. — Android rebuild (preview)

This branch contains a React + Vite interface packaged with Capacitor. It is an independent rebuild, not a byte-for-byte modification of the original APK.

## Current preview scope
- Responsive dark-purple E.D.I.T.H. interface.
- Local conversation history (device browser/WebView storage).
- Foreground speech dictation when the Android WebView supports Web Speech API.
- Optional text-to-speech.
- Settings panel and discreet “Technology by Dawncore Enterprises” credit.
- No embedded provider API keys and no fake “always listening” status.

## Important limitations
The phrase “Ok EDITH” is **not implemented as a background hotword service** in this preview. Reliable wake-word activation while the app is in the background requires a native Android foreground service or a dedicated wake-word engine, explicit microphone permission, notification/OS-policy handling, and testing on the target phone. The chat reply is a local placeholder until a secure backend is configured.

## Build
GitHub Actions builds a debug APK using the Android SDK/Gradle environment provided by the hosted runner. Debug APKs are for testing and are not signed as a production release. Do not store API keys in the frontend or repository; connect to an authenticated server-side proxy later.
