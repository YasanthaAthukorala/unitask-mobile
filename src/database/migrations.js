import { sampleTasks } from '../data/sampleTasks.js';

export async function migrateDatabase(db) {
  await db.withTransactionAsync(async () => {
    await db.execAsync(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT NOT NULL,
      category TEXT NOT NULL, budget REAL NOT NULL, deadline TEXT, student_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Available', is_favorite INTEGER NOT NULL DEFAULT 0, is_mine INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT);`);
    const version = await db.getFirstAsync('PRAGMA user_version');
    if (version.user_version >= 1) return;
    const columns = new Set((await db.getAllAsync('PRAGMA table_info(tasks)')).map(c => c.name));
    const additions = [
      ['contactEmail', "TEXT NOT NULL DEFAULT ''"], ['contactPhone', "TEXT NOT NULL DEFAULT ''"],
      ['listingType', "TEXT NOT NULL DEFAULT 'Service'"], ['priceUnit', "TEXT NOT NULL DEFAULT 'Per project'"],
      ['availability', "TEXT NOT NULL DEFAULT ''"],
    ];
    for (const [name, definition] of additions) {
      if (!columns.has(name)) await db.execAsync(`ALTER TABLE tasks ADD COLUMN ${name} ${definition}`);
    }
    await db.execAsync('PRAGMA user_version = 1');
  });
}
export async function seedDatabase(db) {
  await db.withTransactionAsync(async () => {
    const seeded = await db.getFirstAsync("SELECT value FROM metadata WHERE key='seeded'");
    const count = await db.getFirstAsync('SELECT COUNT(*) AS total FROM tasks');
    if (!seeded && count.total === 0) {
      for (const t of sampleTasks) {
        await db.runAsync(`INSERT INTO tasks
          (title,description,category,budget,student_name,listingType,priceUnit,availability,contactEmail,contactPhone)
          VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [t.title,t.description,t.category,t.budget,t.student_name,t.listingType,t.priceUnit,t.availability,'','']);
      }
    }
    await db.runAsync("INSERT OR IGNORE INTO metadata (key,value) VALUES ('seeded','1')");
  });
}
