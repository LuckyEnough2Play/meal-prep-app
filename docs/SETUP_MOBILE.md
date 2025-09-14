Marble Mobile App — Setup (Expo)

Prerequisites
- Node.js LTS (v18+)
- iOS: Xcode; Android: Android Studio + SDKs
- Expo CLI (npx will install as needed)

Install and Run
- cd `mobile`
- Install: `npm install`
- Start: `npx expo start`
- Android: `npm run android`  iOS: `npm run ios`

Notes
- Local DB: uses `expo-sqlite` (unencrypted). We will integrate SQLCipher in a Bare build for encryption at rest; sensitive keys are stored in the OS keystore via `expo-secure-store`.
- E2EE sync & backups: stubs exist under `src/sync/`; relay selection and backup providers will be wired post-MVP stub.
- Routing: Expo Router with `(onboarding)` and `(main)` segments.

Project Layout
- `mobile/app/` screens (Expo Router)
- `mobile/src/db/` SQLite init (schema stubs)
- `mobile/src/storage/secure.ts` key management
- `mobile/src/models/` data types aligned to PRD
- `mobile/src/constants/stores.ts` initial grocer list

Next Steps
- Add encrypted SQLite (SQLCipher) via prebuild (Bare) and key derivation using `expo-secure-store`.
- Implement pricing adaptors with opt-in per store; add background refresh (Wi‑Fi + charging).
- Build onboarding persistence to DB; implement plans and list consolidation; group E2EE.

