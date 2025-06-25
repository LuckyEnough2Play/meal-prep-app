
# 📘 Meal Prep App – PRD (Process Requirements Document)

## 🧭 1. Purpose
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
- **Backend:** GoLang + REST APIs
- **Scraper Layer:**
  - Python (Scrapy or Playwright + BeautifulSoup)
  - Scheduled updates (cron or serverless)
  - Vendor modules:
    - `scraper/walmart.py`
    - `scraper/publix.py`
    - `scraper/trader_joes.py`

- **Database:** PostgreSQL or Firebase for:
  - Users
  - Recipes
  - Ingredient inventory
  - Sales data
  - Meal carts

---

## ✅ 5. MVP Scope (with scrapers)

**Included:**
- User profile creation
- Vendor selection by ZIP
- Recipe filtering using preferences
- Real grocery sale scraping
- Swipe UI for meal selection
- Cart builder with pricing and deals
- Meal instructions view + history

**Deferred for Post-MVP:**
- Barcode scanning
- Smart pantry tracking
- Nutrition report per meal
- In-app checkout integrations
