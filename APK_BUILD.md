# Android APK Build

This project is prepared to be wrapped as an Android app with Capacitor.

## Prerequisites

- Node.js and npm
- Android Studio
- Android SDK configured in Android Studio
- Java JDK installed and `JAVA_HOME` configured
- A public backend URL for mobile builds

## Important

The mobile app cannot call `http://localhost:5000/api` once installed on a phone.
Before generating a production APK, set `REACT_APP_API_URL` to a reachable HTTPS backend.

Example:

```env
REACT_APP_API_URL=https://api.mokine.com/api
```

## Commands

Install/generate Android project:

```bash
npm run android:add
```

Build web assets and sync Android:

```bash
npm run android:build
```

Generate a debug APK from the command line on Windows:

```bash
npm run android:apk:debug
```

Open Android Studio:

```bash
npm run android:open
```

## APK generation

Inside Android Studio:

1. Open the `android` project
2. Wait for Gradle sync
3. Use `Build > Build Bundle(s) / APK(s) > Build APK(s)`
4. For store distribution, use signed release build

## APK output

After a successful debug build, the APK is typically generated here:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Notes

- Development on a real device requires a reachable backend URL or live-reload config.
- If you need camera, notifications, or file access later, Capacitor plugins can be added.