import * as SQLite from 'expo-sqlite';
import type { UserProfile } from '@/models/types';

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
        created_by TEXT
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
