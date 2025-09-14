import * as SQLite from 'expo-sqlite';
import type { Plan, Recipe, ShoppingListItem, UserProfile } from '@/models/types';

let db: SQLite.SQLiteDatabase | null = null;

export function getDb() {
  if (!db) db = SQLite.openDatabase('marble.db');
  return db;
}

export function initDb() {
  const dbi = getDb();
  dbi.exec([
    { sql: 'PRAGMA foreign_keys = ON;', args: [] },
    {
      sql: `CREATE TABLE IF NOT EXISTS user_profile (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        diet_types TEXT,
        allergies TEXT,
        dislikes TEXT,
        weekly_budget REAL,
        preferred_stores TEXT
      );`,
      args: []
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS store (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        last_price_refresh INTEGER
      );`,
      args: []
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS store_item (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        name TEXT NOT NULL,
        package_size REAL,
        unit TEXT,
        price REAL NOT NULL,
        on_sale INTEGER DEFAULT 0,
        last_seen INTEGER,
        UNIQUE(store_id, name),
        FOREIGN KEY (store_id) REFERENCES store(id) ON DELETE CASCADE
      );`,
      args: []
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_store_item_store ON store_item(store_id)`, args: [] },
    {
      sql: `CREATE TABLE IF NOT EXISTS recipe (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        ingredients_json TEXT NOT NULL,
        instructions TEXT,
        tags TEXT,
        diet_types TEXT,
        allergens TEXT,
        time_prep INTEGER,
        time_cook INTEGER,
        created_by TEXT
      );`,
      args: []
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS plan (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        budget_target REAL,
        store_mode TEXT NOT NULL,
        meals_json TEXT NOT NULL,
        created_by TEXT,
        is_active INTEGER DEFAULT 0
      );`,
      args: []
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS shopping_list_item (
        id TEXT PRIMARY KEY,
        plan_id TEXT NOT NULL,
        store_id TEXT,
        ingredient_id TEXT,
        name TEXT NOT NULL,
        qty REAL NOT NULL,
        unit TEXT,
        checked_by TEXT NOT NULL,
        FOREIGN KEY (plan_id) REFERENCES plan(id) ON DELETE CASCADE
      );`,
      args: []
    }
  ], false, () => {});

  // Best-effort: add is_active if missing (for upgrades)
  tableEnsureColumn('plan', 'is_active', 'INTEGER DEFAULT 0').catch(() => {});
}

function run<T = void>(sql: string, args: any[] = []): Promise<T> {
  const dbi = getDb();
  return new Promise((resolve, reject) => {
    dbi.transaction(
      (tx) => {
        tx.executeSql(
          sql,
          args,
          (_tx, result) => resolve((result as unknown) as T),
          (_tx, err) => {
            reject(err);
            return true;
          }
        );
      },
      (err) => reject(err)
    );
  });
}

export async function saveUserProfile(p: UserProfile): Promise<void> {
  const diet = JSON.stringify(p.dietTypes || []);
  const allergies = JSON.stringify(p.allergies || []);
  const dislikes = JSON.stringify(p.dislikes || []);
  const stores = JSON.stringify(p.preferredStores || []);
  await run(
    `INSERT INTO user_profile (id, name, diet_types, allergies, dislikes, weekly_budget, preferred_stores)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name,
       diet_types=excluded.diet_types,
       allergies=excluded.allergies,
       dislikes=excluded.dislikes,
       weekly_budget=excluded.weekly_budget,
       preferred_stores=excluded.preferred_stores`,
    [p.id, p.name, diet, allergies, dislikes, p.weeklyBudget ?? 0, stores]
  );
}

export async function loadUserProfile(): Promise<UserProfile | null> {
  const res = await run<SQLite.SQLResultSet>(`SELECT * FROM user_profile LIMIT 1`, []);
  const row = (res.rows as any)._array?.[0];
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    dietTypes: safeParseArray(row.diet_types),
    allergies: safeParseArray(row.allergies),
    dislikes: safeParseArray(row.dislikes),
    weeklyBudget: Number(row.weekly_budget || 0),
    preferredStores: safeParseArray(row.preferred_stores)
  } as UserProfile;
}

function safeParseArray(v: any): string[] {
  try {
    const parsed = JSON.parse(String(v ?? '[]'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function tableEnsureColumn(table: string, column: string, def: string) {
  const res = await run<SQLite.SQLResultSet>(`PRAGMA table_info(${table})`);
  const cols = (res.rows as any)._array as Array<{ name: string }>;
  if (!cols.find((c) => c.name === column)) {
    await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
  }
}

// Plans
export async function upsertPlan(p: Plan): Promise<void> {
  const mealsJson = JSON.stringify(p.meals || []);
  await run(
    `INSERT INTO plan (id, type, name, start_date, end_date, budget_target, store_mode, meals_json, created_by, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       type=excluded.type,
       name=excluded.name,
       start_date=excluded.start_date,
       end_date=excluded.end_date,
       budget_target=excluded.budget_target,
       store_mode=excluded.store_mode,
       meals_json=excluded.meals_json,
       created_by=excluded.created_by,
       is_active=excluded.is_active`,
    [
      p.id,
      p.type,
      p.name ?? null,
      p.startDate,
      p.endDate,
      p.budgetTarget ?? null,
      p.storeMode,
      mealsJson,
      p.createdBy,
      p.isActive ? 1 : 0
    ]
  );
}

// Store & Items
export async function ensureStore(storeId: string, name: string): Promise<void> {
  await run(`INSERT INTO store (id, name) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name`, [storeId, name]);
}

export interface StoreItemInput { name: string; packageSize?: number | null; unit?: string | null; price: number; onSale?: boolean }

export async function upsertStoreItem(storeId: string, input: StoreItemInput): Promise<void> {
  const now = Date.now();
  await run(
    `INSERT INTO store_item (id, store_id, name, package_size, unit, price, on_sale, last_seen)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(store_id, name) DO UPDATE SET
       package_size=excluded.package_size,
       unit=excluded.unit,
       price=excluded.price,
       on_sale=excluded.on_sale,
       last_seen=excluded.last_seen`,
    [
      `${storeId}:${input.name.toLowerCase()}`,
      storeId,
      input.name,
      input.packageSize ?? null,
      input.unit ?? null,
      input.price,
      input.onSale ? 1 : 0,
      now
    ]
  );
}

export type StoreItemRow = { id: string; storeId: string; name: string; packageSize?: number; unit?: string; price: number; onSale: boolean; lastSeen?: number };

export async function listStoreItems(storeId: string): Promise<StoreItemRow[]> {
  const rs = await run<SQLite.SQLResultSet>(`SELECT * FROM store_item WHERE store_id = ? ORDER BY name COLLATE NOCASE`, [storeId]);
  return ((rs.rows as any)._array as any[]).map((r) => ({
    id: r.id,
    storeId: r.store_id,
    name: r.name,
    packageSize: r.package_size ?? undefined,
    unit: r.unit ?? undefined,
    price: Number(r.price),
    onSale: !!r.on_sale,
    lastSeen: r.last_seen ?? undefined
  }));
}

export async function seedSamplePrices(): Promise<void> {
  // Minimal seed for demo across stores
  const seeds: Array<{ storeId: string; storeName: string; items: StoreItemInput[] }> = [
    {
      storeId: 'aldi',
      storeName: 'Aldi',
      items: [
        { name: 'Chicken breast', packageSize: 1, unit: 'lb', price: 3.49 },
        { name: 'Broccoli', packageSize: 1, unit: 'head', price: 1.29 },
        { name: 'Rice', packageSize: 1, unit: 'lb', price: 1.19 },
        { name: 'Olive oil', packageSize: 16, unit: 'oz', price: 6.99, onSale: true }
      ]
    },
    {
      storeId: 'walmart',
      storeName: 'Walmart',
      items: [
        { name: 'Chicken breast', packageSize: 1, unit: 'lb', price: 3.99 },
        { name: 'Broccoli', packageSize: 1, unit: 'head', price: 1.49, onSale: true },
        { name: 'Rice', packageSize: 2, unit: 'lb', price: 2.28 },
        { name: 'Tofu', packageSize: 14, unit: 'oz', price: 2.49 }
      ]
    },
    {
      storeId: 'publix',
      storeName: 'Publix',
      items: [
        { name: 'Ground beef', packageSize: 1, unit: 'lb', price: 5.49 },
        { name: 'Lettuce', packageSize: 1, unit: 'head', price: 2.19 },
        { name: 'Tomato', packageSize: 1, unit: 'pc', price: 0.79 },
        { name: 'Cheddar cheese', packageSize: 8, unit: 'oz', price: 3.99 }
      ]
    },
    { storeId: 'kroger', storeName: 'Kroger', items: [{ name: 'Soy sauce (gluten-free optional)', packageSize: 10, unit: 'oz', price: 2.99 }] },
    { storeId: 'traderjoes', storeName: "Trader Joe's", items: [{ name: 'Mixed vegetables', packageSize: 16, unit: 'oz', price: 2.49 }] }
  ];
  for (const s of seeds) {
    await ensureStore(s.storeId, s.storeName);
    for (const it of s.items) await upsertStoreItem(s.storeId, it);
  }
}

export type EstimateResult = {
  perStore: Array<{ storeId: string; storeName: string; cost: number; unknown: string[] }>;
  oneStoreBest?: { storeId: string; storeName: string; cost: number; unknown: string[] };
  multiStore?: { cost: number; unknown: string[] };
};

export async function estimateRecipeCost(recipe: Recipe, servings: number, storeIds: string[], storeMode: 'one' | 'multi'): Promise<EstimateResult> {
  // Load store names
  const storeNames: Record<string, string> = {};
  const rsStores = await run<SQLite.SQLResultSet>(`SELECT id, name FROM store`);
  for (const r of (rsStores.rows as any)._array as any[]) storeNames[r.id] = r.name;

  // Load items for selected stores
  const itemsByStore: Record<string, StoreItemRow[]> = {};
  for (const sid of storeIds) itemsByStore[sid] = await listStoreItems(sid);

  const scaled = (recipe.ingredients || []).map((i) => ({ name: String(i.name || ''), qty: Number(i.qty || 0) * servings, unit: i.unit || null }));

  const perStore = storeIds.map((sid) => {
    const items = itemsByStore[sid] || [];
    let cost = 0;
    const unknown: string[] = [];
    for (const need of scaled) {
      const match = items.find((it) => it.name.toLowerCase().includes(need.name.toLowerCase()));
      if (!match) {
        unknown.push(need.name);
        continue;
      }
      const pack = match.packageSize || 1;
      const packsNeeded = Math.ceil((need.qty || 0) / pack);
      cost += packsNeeded * (match.price || 0);
    }
    return { storeId: sid, storeName: storeNames[sid] || sid, cost, unknown };
  });

  let oneStoreBest = undefined as EstimateResult['oneStoreBest'];
  if (perStore.length) {
    oneStoreBest = perStore.slice().sort((a, b) => a.cost - b.cost)[0];
  }

  let multiStore = undefined as EstimateResult['multiStore'];
  if (storeMode === 'multi' && storeIds.length > 1) {
    let cost = 0;
    const unknown: string[] = [];
    for (const need of scaled) {
      let best = Infinity;
      let found = false;
      for (const sid of storeIds) {
        const items = itemsByStore[sid] || [];
        const match = items.find((it) => it.name.toLowerCase().includes(need.name.toLowerCase()));
        if (match) {
          const pack = match.packageSize || 1;
          const packsNeeded = Math.ceil((need.qty || 0) / pack);
          const c = packsNeeded * (match.price || 0);
          if (c < best) best = c;
          found = true;
        }
      }
      if (found) cost += best; else unknown.push(need.name);
    }
    multiStore = { cost, unknown };
  }

  return { perStore, oneStoreBest, multiStore };
}

export async function setActivePlan(planId: string): Promise<void> {
  // deactivate all, then activate one
  await run(`UPDATE plan SET is_active = 0`);
  await run(`UPDATE plan SET is_active = 1 WHERE id = ?`, [planId]);
}

export async function getActivePlan(): Promise<Plan | null> {
  const rs = await run<SQLite.SQLResultSet>(`SELECT * FROM plan WHERE is_active = 1 LIMIT 1`);
  const row = (rs.rows as any)._array?.[0];
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    name: row.name ?? undefined,
    startDate: row.start_date,
    endDate: row.end_date,
    budgetTarget: row.budget_target ?? undefined,
    storeMode: row.store_mode,
    meals: safeParseArray(row.meals_json) as any,
    createdBy: row.created_by,
    isActive: !!row.is_active
  } as Plan;
}

// Shopping list
export async function addShoppingItems(planId: string, items: Omit<ShoppingListItem, 'id' | 'checkedBy'>[]): Promise<string[]> {
  const ids: string[] = [];
  for (const it of items) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    ids.push(id);
    await run(
      `INSERT INTO shopping_list_item (id, plan_id, store_id, ingredient_id, name, qty, unit, checked_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, planId, it.storeId ?? null, it.ingredientId ?? null, it.name, it.qty, it.unit ?? null, JSON.stringify([])]
    );
  }
  return ids;
}

export async function listShoppingItems(planId: string): Promise<ShoppingListItem[]> {
  const rs = await run<SQLite.SQLResultSet>(`SELECT * FROM shopping_list_item WHERE plan_id = ? ORDER BY name COLLATE NOCASE`, [planId]);
  const arr = (rs.rows as any)._array as any[];
  return arr.map((row) => ({
    id: row.id,
    planId: row.plan_id,
    storeId: row.store_id ?? undefined,
    ingredientId: row.ingredient_id ?? undefined,
    name: row.name,
    qty: Number(row.qty),
    unit: row.unit ?? undefined,
    checkedBy: safeParseArray(row.checked_by)
  }));
}

// Recipes
export async function seedRecipesIfEmpty(recipes: Recipe[]): Promise<void> {
  const rs = await run<SQLite.SQLResultSet>(`SELECT COUNT(1) as c FROM recipe`);
  const count = (rs.rows as any)._array?.[0]?.c ?? 0;
  if (count > 0) return;
  for (const r of recipes) {
    await run(
      `INSERT INTO recipe (id, name, ingredients_json, instructions, tags, diet_types, allergens, time_prep, time_cook, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        r.id,
        r.name,
        JSON.stringify(r.ingredients || []),
        r.instructions ?? null,
        JSON.stringify(r.tags || []),
        JSON.stringify(r.dietTypes || []),
        JSON.stringify(r.allergens || []),
        r.timePrep ?? null,
        r.timeCook ?? null,
        r.createdBy ?? 'starter'
      ]
    );
  }
}

export async function listRecipes(): Promise<Recipe[]> {
  const rs = await run<SQLite.SQLResultSet>(`SELECT * FROM recipe ORDER BY name COLLATE NOCASE`);
  const arr = (rs.rows as any)._array as any[];
  return arr.map((row) => ({
    id: row.id,
    name: row.name,
    ingredients: JSON.parse(row.ingredients_json || '[]'),
    instructions: row.instructions ?? undefined,
    tags: safeParseArray(row.tags),
    dietTypes: safeParseArray(row.diet_types),
    allergens: safeParseArray(row.allergens),
    timePrep: row.time_prep ?? undefined,
    timeCook: row.time_cook ?? undefined,
    createdBy: row.created_by ?? undefined
  }));
}

export async function appendMealToPlan(planId: string, meal: { recipeId: string; servings: number }) {
  const rs = await run<SQLite.SQLResultSet>(`SELECT meals_json FROM plan WHERE id = ?`, [planId]);
  const row = (rs.rows as any)._array?.[0];
  const meals = row ? (JSON.parse(row.meals_json || '[]') as any[]) : [];
  meals.push(meal);
  await run(`UPDATE plan SET meals_json = ? WHERE id = ?`, [JSON.stringify(meals), planId]);
}

export async function addOrMergeShoppingItems(planId: string, items: Omit<ShoppingListItem, 'id' | 'checkedBy'>[]) {
  const existing = await listShoppingItems(planId);
  for (const it of items) {
    const match = existing.find((e) => e.name.toLowerCase() === (it.name || '').toLowerCase() && (e.unit || '') === (it.unit || ''));
    if (match) {
      const newQty = (match.qty || 0) + (it.qty || 0);
      await run(`UPDATE shopping_list_item SET qty = ? WHERE id = ?`, [newQty, match.id]);
      match.qty = newQty;
    } else {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await run(
        `INSERT INTO shopping_list_item (id, plan_id, store_id, ingredient_id, name, qty, unit, checked_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, '[]')`,
        [id, planId, it.storeId ?? null, it.ingredientId ?? null, it.name, it.qty, it.unit ?? null]
      );
      existing.push({ ...(it as any), id, planId, checkedBy: [] });
    }
  }
}

export async function toggleShoppingItemChecked(itemId: string, userId: string): Promise<void> {
  const rs = await run<SQLite.SQLResultSet>(`SELECT checked_by FROM shopping_list_item WHERE id = ?`, [itemId]);
  const row = (rs.rows as any)._array?.[0];
  const current = row ? safeParseArray(row.checked_by) : [];
  const has = current.includes(userId);
  const next = has ? current.filter((x: string) => x !== userId) : [...current, userId];
  await run(`UPDATE shopping_list_item SET checked_by = ? WHERE id = ?`, [JSON.stringify(next), itemId]);
}
