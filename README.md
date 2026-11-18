# BrainSpark

**BrainSpark** is an offline-first cognitive training application combining a Duolingo-style daily XP progression path and streak system with fast-paced *Brain Age*-inspired memory and reaction-time drills.

## Cognitive Drills

1. **Quick Math** — Rapid-fire arithmetic prompts measuring mental calculation speed (`ms`) and accuracy.
2. **Stroop Focus** — Ink-color vs. printed-word conflict trials testing selective attention and executive control.
3. **Sequence Memory** — Progressive 3×3 illuminated grid recall testing working memory span.
4. **Speed Reflex** — Millisecond-accurate Go/No-Go stimulus response drills.

## Architecture & Offline Support

- **Local-First Persistence**: Primary storage in `IndexedDB` (`brainspark_db`) with automatic synchronous fallback and mirroring in `localStorage`.
- **Local-Timezone Streaks**: Calendar day keys (`YYYY-MM-DD`) computed strictly from local device time to prevent UTC midnight drift.
- **Data Portability**: Export/import full backups in `.json` (with *Merge* or *Replace All* options), export session logs as `.csv`, or copy/paste raw JSON in restricted WebViews. On native Android, exports open the native Android Share Sheet via Capacitor Filesystem & Share.

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Type Checking & Production Build

```bash
npm run lint
npm run build
```

For Android APK instructions, see [`BUILD_APK.md`](./BUILD_APK.md).
