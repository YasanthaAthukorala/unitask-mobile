import * as SQLite from 'expo-sqlite';
import { sampleTasks } from '../data/sampleTasks';
async function openAndInitialize(){
 const db=await SQLite.openDatabaseAsync('unitask.db');
 await db.execAsync(`CREATE TABLE IF NOT EXISTS tasks (
 id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT NOT NULL,
 category TEXT NOT NULL, budget REAL NOT NULL, deadline TEXT, student_name TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'Available', is_favorite INTEGER NOT NULL DEFAULT 0, is_mine INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT);`);
 await db.withTransactionAsync(async()=>{
  const seeded=await db.getFirstAsync("SELECT value FROM metadata WHERE key='seeded'");
  const count=await db.getFirstAsync('SELECT COUNT(*) AS total FROM tasks');
  if(!seeded && count.total===0){for(const t of sampleTasks){await db.runAsync('INSERT INTO tasks (title,description,category,budget,deadline,student_name) VALUES (?,?,?,?,?,?)',t)}}
  await db.runAsync("INSERT OR IGNORE INTO metadata (key,value) VALUES ('seeded','1')");
 });
 return db;
}
let dbPromise=null;
export function getDb(){if(!dbPromise){dbPromise=openAndInitialize().catch(e=>{dbPromise=null;throw e})}return dbPromise}
export function initializeDatabase(){return getDb()}
