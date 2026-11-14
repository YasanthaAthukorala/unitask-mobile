import * as SQLite from 'expo-sqlite';
import { sampleTasks } from '../data/sampleTasks';

async function openAndInitialize() {
  const db = await SQLite.openDatabaseAsync('unitask.db');
  await db.execAsync(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL, description TEXT NOT NULL,
    category TEXT NOT NULL, budget REAL NOT NULL,
    deadline TEXT, student_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Available',
    is_favorite INTEGER NOT NULL DEFAULT 0,
    is_mine INTEGER NOT NULL DEFAULT 0
  );`);
  const count = await db.getFirstAsync('SELECT COUNT(*) AS total FROM tasks');
  if (count.total === 0) {
    await db.withTransactionAsync(async () => {
      for (const t of sampleTasks) {
        await db.runAsync(
          'INSERT INTO tasks (title, description, category, budget, deadline, student_name) VALUES (?, ?, ?, ?, ?, ?)',
          t
        );
      }
    });
  }
  return db;
}

// Lazy + cached: nothing touches SQLite at import time (avoids crashes during
// web/SSR bundling), and a failed init can be retried on the next call.
let dbPromise = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openAndInitialize().catch((e) => {
      dbPromise = null;
      throw e;
    });
  }
  return dbPromise;
}

export function initializeDatabase() {
  return getDb();
}
