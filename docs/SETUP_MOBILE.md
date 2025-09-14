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
- Groups & Invites: Create groups and share invites via QR/link. Invites use `marble://invite?...` deep links containing an E2EE group key; the key is stored locally via SecureStore when joining or creating.
 - Backup & Restore: Encrypted backups via password. Creates a `.mmbak` file you can share. Restore prompts for the password.

Project Layout
- `mobile/app/` screens (Expo Router)
- `mobile/src/db/` SQLite init (schema stubs)
- `mobile/src/storage/secure.ts` key management
- `mobile/src/models/` data types aligned to PRD
- `mobile/src/constants/stores.ts` initial grocer list
- `mobile/src/sync/invite.ts` invite URL builder/parser
 - `mobile/src/backup/` encrypted backup/restore helpers

Next Steps
- Add encrypted SQLite (SQLCipher) via prebuild (Bare) and key derivation using `expo-secure-store`.
- Implement pricing adaptors with opt-in per store; add background refresh (Wi‑Fi + charging).
- Build onboarding persistence to DB; implement plans and list consolidation; group E2EE.
 - Replace invite link transport with short-lived tokens and relay-brokered peer discovery for E2EE sync.
