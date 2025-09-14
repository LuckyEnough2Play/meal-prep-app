# Marble Meal Planner — Product Requirements Document (PRD)

---

## 1. Overview

- **Goal:** A mobile-only, local-first meal planning app that helps individuals and groups pick meals that respect food profiles and budgets, prioritize savings at selected grocers, and generate a collaborative, checkable shopping list.
- **Platforms:** React Native (iOS, Android).
- **Principles:** Local-first, privacy-first, offline-first; cloud is optional and used only as a relay for end-to-end encrypted (E2EE) group sync and for optional encrypted backups.

---

## 2. Core User Value

- **Food compatibility:** Respect allergies, diet types, and dislikes across individuals and groups.
- **Savings visibility:** Highlight estimated costs and savings per meal/plan using prices fetched directly from grocer websites.
- **Simple flow:** Profile → Stores → Meals → Savings → Shopping List.
- **Group coordination:** Named static or event groups; shared check-off list; no item assignment.

---

## 3. Personas & Use Cases

- **Individual Planner:** Plans weekly dinners within a budget; prefers one-store shopping.
- **Event Organizer:** Creates a weekend event group; aggregates food profiles; plans a 2-day menu; shares a single list.
- **Household:** Static group for recurring weekly plans; wants visibility into weekly spend vs target.

---

## 4. Key Flows

1) **Onboarding**
   - Create profile: name, diet types, allergies, dislikes, budget (weekly), home location (optional).
   - Location permission prompt to suggest nearby stores (manual add available).
   - Optional sign-in to major grocers to access member pricing; credentials stored E2EE on-device.

2) **Stores**
   - Pick one or more preferred grocers (Aldi, Publix, Walmart, Kroger, Trader Joe’s, etc.).
   - Default “one-store only”; toggle to allow multi-store.

3) **Meal Discovery & Selection**
   - Browse suggestions filtered by profile/group compatibility and store availability.
   - See estimated total and savings badges; choose meals; scale servings.

4) **Planning**
   - Support both weekly plans and event-based plans.
   - Budgets: weekly target and per-plan target; show progress and variance.

5) **Groups**
   - Create named static or event groups; invite via QR/link; E2EE.
   - Event groups require an expiry; allow extending within group options.
   - Combined profile drives meal filtering; conflicting constraints are surfaced.

6) **Shopping List**
   - Consolidated ingredient list; grouped by store (and aisle where known).
   - Check-off syncs to all members; no per-member assignment.
   - Servings default to total group members; adjustable per meal/plan.

7) **Backups**
   - Optional encrypted backup/restore to iCloud/Google Drive. Off by default.

---

## 5. Features & Requirements

### 5.1 Profile & Preferences
- **Diet Types:** e.g., vegetarian, vegan, keto, gluten-free; multi-select.
- **Allergies & Intolerances:** Common allergens; extensible custom list.
- **Dislikes:** Freeform and common tags; used to de-rank or exclude.
- **Budget:** Weekly target; can also set per-plan target.
- **Share Card:** QR/link to export just profile constraints to a group.

### 5.2 Stores & Pricing
- **Store Selection:** Nearby suggestion via location; manual add/edit supported.
- **Accounts:** Optional per-store login to access member pricing; stored E2EE.
- **Price Fetching:**
  - Primary: direct fetch from grocer websites (official APIs when available; respectful automated fetching otherwise, opt-in per store).
  - Controls: manual Refresh Prices; optional background refresh when on Wi‑Fi + charging.
  - Region: US-only; USD; imperial units.
  - Freshness: per-item timestamp and store-level “last updated” badge.

### 5.3 Recipes & Meals
- **Sources:** Bundled local starter set + user-created recipes.
- **Import:** URL/import later (post-MVP).
- **Fields:** name, ingredients (canonical), quantities/units, instructions, tags (diet/allergens), estimated prep/cook time.
- **Compatibility:** Per-recipe compatibility score against profile/group; hard excludes for allergens.
- **Servings:** Adjustable; scales ingredient quantities and list.

### 5.4 Meal Planning
- **Types:** Weekly plan (calendar week) and event plan (date range + name).
- **Budgets:** Weekly and per-plan targets; show estimated total and variance.
- **Store Mode:** One-store default; user can enable multi-store optimization.

### 5.5 Savings & Costing
- **Comparison:** Normalize per-unit prices; surface “on sale” flags; show substitutions when equivalent items cheaper.
- **Optimization Modes:**
  - One Store: minimize total cost within a single selected store.
  - Multi-Store: minimize total cost across selected stores (optional; can increase trip count).
- **Transparency:** Show price source and timestamp; tap to view price details.

### 5.6 Groups & Sync
- **Group Types:** Static and event groups; name, optional description.
- **Invites:** QR/link invites; join requests include profile share (optional).
- **Combined Profile:** Intersection of hard constraints (allergens) and union-aware soft prefs (dislikes) with clear conflict resolution.
- **Expiry:** Event groups require expiry; extendable by admins.
- **Check-off Sync:** List item status (checked/unchecked) syncs to all members.
- **No Assignments:** Intentionally no per-member item assignment.

### 5.7 Shopping List
- **Structure:** Group by store; optional aisle ordering when data is available.
- **Behavior:** Consolidate duplicate ingredients; unit conversion where needed; haptic feedback on check-off.
- **Sharing:** View-only link/QR for non-members (no edits).

### 5.8 Backups & Restore
- **Scope:** Entire local DB and keys; E2EE with user-held key material; iCloud/Google Drive targets.
- **Controls:** Manual backup/restore; scheduled backup (optional).

---

## 6. Architecture & Data

### 6.1 Local Storage
- **Engine:** On-device SQLite with encryption at rest (platform keystore–derived key). Schema is versioned and migratable.
- **Indexes:** Ingredient name, store item, tag lookups, and price timestamps.

### 6.2 Sync Model (Groups)
- **E2EE:** Group data is encrypted end-to-end with per-group keys. Creator’s device acts as anchor/seed; no central storage of plaintext.
- **Transport:** Prefer peer-to-peer (WebRTC) with minimal relay for NAT traversal; relay never sees plaintext.
- **Conflict Handling:** Last-writer-wins for list check states; merge-friendly structures for plans and recipes.
- **Offline:** All actions queue offline and sync when peers reachable.

### 6.3 Price Fetching
- **Adaptors:** Store-specific modules (e.g., `aldi`, `publix`, `walmart`, `kroger`, `traderjoes`).
- **Auth:** Optional per-store credentials stored E2EE; session tokens scoped and rotated.
- **Ethics & Load:** Opt-in per store; respectful rate limits; visible refresh controls.

### 6.4 Security & Privacy
- **Encryption:**
  - At Rest: Encrypted SQLite; keys in Secure Enclave/KeyStore.
  - In Transit: TLS + E2EE payloads for group sync and backups.
- **Data Scope:** No analytics/telemetry in MVP. Pricing and recipe data remain local; only encrypted blobs and minimal metadata traverse relays.

---

## 7. Data Model (Simplified)

- **UserProfile:** id, name, dietTypes[], allergies[], dislikes[], weeklyBudget, homeLocation?, preferredStores[]
- **Store:** id, name, location?, loginConfig?, isPreferred, lastPriceRefresh
- **StoreCredential:** id, storeId, username, secret (E2EE)
- **IngredientCanonical:** id, name, unit, tags[]
- **StoreItem:** id, storeId, ingredientId?, name, packageSize, unit, price, pricePerUnit, onSale, lastSeen
- **Recipe:** id, name, ingredients[{ingredientId | name, qty, unit}], instructions, tags[], dietTypes[], allergens[], timePrep, timeCook, createdBy
- **Plan:** id, type(weekly|event), name?, startDate, endDate, budgetTarget?, storeMode(one|multi), meals[{recipeId, servings}], createdBy
- **ShoppingList:** id, planId, items[{id, storeId?, ingredientId?, name, qty, unit, checkedBy[] }]
- **Group:** id, name, type(static|event), expiresAt?, memberIds[], adminIds[], profilePolicy, groupKey(E2EE)
- **CombinedProfile:** groupId, hardConstraints(allergens), softPrefs(dislikes), dietTypes[]
- **InviteToken:** id, groupId, expiresAt, capabilities(join)

---

## 8. Non-Functional Requirements

- **Performance:** Instant local interactions; list operations < 50 ms; cold start < 2.5 s on mid-tier devices.
- **Offline:** All core features (profile, recipes, plans, list) work offline; price freshness indicators remain visible.
- **Reliability:** Sync retries with backoff; resilient to app termination.
- **Accessibility:** Basic platform defaults; advanced accessibility (large text, high contrast, screen reader polish) deferred post-MVP.

---

## 9. MVP Scope

- React Native app shell; encrypted local DB; onboarding with profile (diet, allergies, dislikes, weekly budget).
- Store selection with location prompt; one-store default; manual multi-store toggle.
- Initial store adaptors: Aldi, Publix, Walmart, Kroger, Trader Joe’s (opt-in). Manual Refresh Prices; optional background refresh.
- Bundled recipe set; user-created recipes; compatibility filtering; serving scale.
- Weekly and event plans with budget targets; cost estimate and savings badges.
- Shopping list with consolidation, per-store grouping, check-off sync in groups.
- Groups: create/join via QR/link; E2EE; event expiry with extension; combined profile.
- Optional encrypted backup/restore to iCloud/Google Drive.
- No payments, no telemetry, no advanced accessibility.

---

## 10. Post-MVP

- Recipe import from URL; nutrition enrichment; aisle maps; substitution recommendations; richer multi-store optimization; accessibility enhancements; additional grocers; better price history and insights.

---

## 11. Milestones

1) Scope Lock & Design Assets
2) App Shell + Encrypted DB + Onboarding
3) Stores + Location + One-Store Flow
4) Recipe Library + Filters + Serving Scale
5) Plans (Weekly/Event) + Budgets + Costing
6) Shopping List + Sync Model
7) Groups (E2EE) + Invites + Expiry
8) Store Adaptors (Top 5) + Refresh Controls
9) Backups (iCloud/Google Drive)
10) Polish & MVP Release

---

## 12. Open Questions

- Legal/compliance review for automated fetching per grocer (terms vary). If needed, provide manual CSV input as a fallback for specific stores.
- Aisle data sources and coverage strategy.
- Exact encryption library choices per platform (SQLCipher vs platform-provided).

