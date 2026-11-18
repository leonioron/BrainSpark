# Building & Downloading the BrainSpark Android APK

BrainSpark is configured with **Capacitor** (`capacitor.config.ts`) and an automated **GitHub Actions** pipeline to produce an installable Android APK (`app-debug.apk`).

---

## Option 1: Build & Download via GitHub Actions (Recommended)

The workflow `.github/workflows/build-apk.yml` automatically builds the APK on every push to `main` or `master`, or when triggered manually.

1. Push this repository to GitHub (`main` or `master` branch).
2. Open your repository on GitHub and go to the **Actions** tab.
3. Select **Build Android Debug APK**.
4. Click **Run workflow** (or open the latest completed run triggered by your push).
5. Once the workflow succeeds, scroll down to **Artifacts** and download **`brainspark-debug-apk`**.
6. Extract the `.zip` archive to get `app-debug.apk`, transfer it to your Android phone, and install it (allow "Install unknown apps" when prompted).

---

## Option 2: Sync & Build Locally with Android Studio

Prerequisites: **Node.js 22+**, **Java 21 (Temurin)**, and **Android Studio / Android SDK**.

1. Install dependencies and build the web bundle:
   ```bash
   npm install --legacy-peer-deps
   npm run android:sync
   ```
2. Open the native project in Android Studio:
   ```bash
   npm run android:open
   ```
   Or build directly via Gradle from the terminal:
   ```bash
   cd android
   ./gradlew assembleDebug --no-daemon --max-workers=2
   ```
3. The generated APK will be located at:
   `android/app/build/outputs/apk/debug/app-debug.apk`
