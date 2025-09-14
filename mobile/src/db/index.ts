import * as SQLite from 'expo-sqlite';

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

