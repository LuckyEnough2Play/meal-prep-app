# 📘 Meal Prep App – PRD

## 🛍️ 1. Purpose  
To develop a user-friendly meal planning app that intelligently recommends meals based on dietary preferences, allergy concerns, and budget—while optimizing for real-time grocery store deals using scraped vendor data.

---

## 👤 2. User Flow Overview  
1. Profile Setup  
2. Vendor Selection (Location-based)  
3. Meal Selection (Swipe-based UI)  
4. Cart Summary (with live deals + total cost)  
5. Meal Instructions & History  

---

## 🛠️ 3. Core Features & Requirements

### A. User Profile Setup  
**Inputs:**  
- Dietary preferences (e.g., Keto, Vegan, High-Protein)  
- Allergies  
- Weekly budget  
- Meal portion sizes  

**Storage:**  
- User auth + cloud storage  
- Profile preferences tied to filtering engine  

---

### B. Vendor & Location Services  
**Location Input:**  
- ZIP or GPS coordinates  

**Vendor Selection:**  
- User can select one or multiple grocers (Walmart, Publix, Kroger, Trader Joe’s, etc.)  

**Live Data Integration:**  
- Custom scraper layer to:  
  - Pull sales, promotions, and markdowns  
  - Track coupon codes and store deals  

**Normalized Data:**  
- `offers` table linking ingredients to:  
  - Vendor  
  - Sale price  
  - Expiry date  
  - Coupon link (if applicable)  

---

### C. Recipe Engine  
**Source:** Gravity Transformation Recipe Book  

**Enrichment:**  
- Tagging:  
  - Meal Type (breakfast, lunch, dinner)  
  - Macro Classifications (protein, fat, carb, veggie)  
  - Dietary compatibility (Keto, GF, etc.)  
  - Allergen flags  

**Customization:**  
- Users can add new meals:  
  - Title  
  - Ingredients (auto-categorized)  
  - Instructions  
  - Tags  

**Filtering Logic:**  
- Filters by:  
  - Budget per meal  
  - Allergens  
  - Diet  
  - Available vendor deals  
- Priority sorting based on markdowns and compatibility  

---

### D. Meal Selection & Cart  
**UI:**  
- Tinder-style swipe cards:  
  - Swipe right → Add to cart  
  - Swipe left → Dismiss  

**Cart Logic:**  
- Combines ingredients by quantity  
- Fetches best available prices via scraper data  

**Outputs:**  
- Store breakdown  
- Coupon links  
- Total estimated cost  

---

### E. Meal Bank & Management  
**Browse View:**  
- Full catalog view  
- Filter by tags, time, cost, ingredients  

**Meal Status:**  
- Preferred → boosts ranking  
- Neutral → appears in suggestions  
- Removed → never shown again  

**Recipe Save:**  
- Meals saved to user bank  

---

### F. Cart History & Meal Instructions  
**History:**  
- Previous carts with timestamps  
- Meal list, total cost, store selections  

**Instructions:**  
- Meal card includes prep steps  
- Linked from history or swipe UI  

---

## 🧱 4. Technical Stack  
- **Frontend:** React Native + Expo  
- **Backend:** Supabase Edge Functions (Deno)  
- **Supabase Services:**  
  - Auth: Email/Password  
  - Database: `users`, `profiles`, `vendor_selections` tables  
  - Edge Functions: TypeScript scrapers in `/supabase/functions`  
  - **Table Schema Examples:**  
    ```sql
    -- profiles
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    diet TEXT,
    allergies TEXT[],
    budget INT,
    portion_size INT

    -- vendor_selections
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    vendor_name TEXT
    ```  
- **Client SDK:** `@supabase/supabase-js`  
- **Session Storage:** React Native `AsyncStorage`  
- **Scraping Tools:** Deno + Cheerio  

---

## 🗒️ 5. Scraper Response & Strategy  
- **Response Format (Edge Function Output):**  
  ```json
  [
    {
      "item": "chicken breast",
      "vendor": "walmart",
      "price": 2.99,
      "unit": "lb",
      "expires": "2025-07-01",
      "coupon": "BOGO"
    }
  ]
  ```  
- **Unified Edge Function:**  
  Accepts input:  
  ```ts
  { zip: "30303", vendors: ["walmart", "trader_joes"] }
  ```  
  for flexible routing, caching, and secure deployment.  

---

## ✅ 6. MVP Scope (with scrapers)  
**Included:**  
- User profile creation via Supabase  
- Vendor selection via Supabase table  
- Recipe filtering using preferences  
- Real grocery sale scraping via Edge Functions  
- Swipe UI for meal selection  
- Cart builder with pricing and deals  
- Meal instructions view + history  

**Deferred for Post-MVP:**  
- Barcode scanning  
- Smart pantry tracking  
- Nutrition report per meal  
- In-app checkout integrations  

---

## 🧩 7. Deployment & Integration

### Phase 0: Repository & CI/CD Configuration  
**Goal:** Establish source control, automated checks, and deployments via GitHub.  
- **GitHub Repository**  
  - Default branch: `main` (or `meal-prep-app`)  
  - Branch protection: require passing CI statuses  
- **GitHub Actions (CI/CD)**  
  - **Triggers:**  
    - `pull_request` → run lint, type-check, tests, build  
    - `push` to `main` → run same checks + deploy  
  - **Steps (on both events):**  
    1. Checkout code  
    2. Install deps (`npm ci`)  
    3. Lint (`npm run lint`), type-check (`npm run typecheck`), tests  
    4. Build (`npm run build` or `expo build:web`)  
  - **On push to `main`:**  
    5. Deploy to Vercel via GitHub integration  
    6. Deploy Supabase Edge Functions (`supabase functions deploy all`)  
- **Commit Strategy:**  
  - Feature merges use clear, relative commit messages (e.g., `feat: profile screen and basic meal plan fetch`)  
- **Environment Variables:**  
  - Managed as GitHub Secrets and synced to Vercel/Supabase:  
    ```env
    NEXT_PUBLIC_SUPABASE_URL=…
    NEXT_PUBLIC_SUPABASE_ANON_KEY=…
    SUPABASE_SERVICE_ROLE_KEY=…
    ```  

---

## 🔒 8. Security Considerations  
- Row-Level Security (RLS) on `profiles`, `vendor_selections`, `history`, etc., scoped via `auth.uid()`  
- Supabase RLS policies for SELECT, INSERT, UPDATE enforcing user-based access  
- Edge Functions use service-role keys securely; scraping logic never exposed to clients  

---

## 🛠️ 9. Tooling & Developer Experience  
- **Linting & Formatting:** ESLint (`eslint.config.js`) and Prettier configured  
- **Suggested Folder Structure:**  
  ```
  app/                     # Frontend pages & components  
  supabase/functions/      # Edge Function scrapers  
  components/ui/           # Shared UI elements  
  utils/                   # Helper modules & types  
  ```  
- **Dev Startup Scripts:**  
  - `npm run dev` → Start frontend dev server  
  - `supabase start` → Local Supabase emulation  
  - `npm run build` → Production build  
- **Testing:**  
  - Unit tests with Jest  
  - Integration tests for API routes  

---

## 📅 10. Phased Roadmap

**Phase 0: Repository & CI/CD Configuration**  
• Source control, branch protection, GitHub Actions → build & deploy

**Phase 1: Profile Setup & Basic Meal-Plan Fetch**  
• Profile inputs, Supabase persistence, `fetchMealPlan` call & display

**Phase 2: Vendor Selection & Live Deals Integration**  
• Vendor UI, scrapers, `offers` table, price-based filtering

**Phase 3: Swipe-Based Meal Selection & Cart Builder**  
• Swipe UI, cart consolidation, summary screen

**Phase 4: Meal Bank, History & Instructions**  
• Browse view, status flags, history, detailed instructions

**Phase 5: Post-MVP Enhancements**  
• Barcode scanning, pantry tracking, nutrition reports, checkout  

---

*End of PRD.*
