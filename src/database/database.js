import * as SQLite from 'expo-sqlite';
import { migrateDatabase, seedDatabase } from './migrations';
async function openAndInitialize() {
  const db = await SQLite.openDatabaseAsync('unitask.db');
  await migrateDatabase(db);
  await seedDatabase(db);
  return db;
}
let dbPromise = null;
export function getDb() {
  if (!dbPromise) dbPromise = openAndInitialize().catch(error => { dbPromise = null; throw error; });
  return dbPromise;
}
export function initializeDatabase() { return getDb(); }
