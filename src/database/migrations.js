import { sampleTasks } from '../data/sampleTasks.js';

const providerId = name => 'provider:' + name;
async function ensureProfile(db,id,name,email='',phone='') {
  await db.runAsync('INSERT OR IGNORE INTO local_profiles (id,name,email,phone) VALUES (?,?,?,?)',[id,name,email,phone]);
}
export async function migrateDatabase(db) {
  await db.withTransactionAsync(async () => {
    await db.execAsync(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT NOT NULL,
      category TEXT NOT NULL, budget REAL NOT NULL, deadline TEXT, student_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Available', is_favorite INTEGER NOT NULL DEFAULT 0, is_mine INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT);`);
    const version = (await db.getFirstAsync('PRAGMA user_version')).user_version;
    const columns = new Set((await db.getAllAsync('PRAGMA table_info(tasks)')).map(c=>c.name));
    if (version < 1) {
      for (const [name,definition] of [
        ['contactEmail',"TEXT NOT NULL DEFAULT ''"],['contactPhone',"TEXT NOT NULL DEFAULT ''"],
        ['listingType',"TEXT NOT NULL DEFAULT 'Service'"],['priceUnit',"TEXT NOT NULL DEFAULT 'Per project'"],
        ['availability',"TEXT NOT NULL DEFAULT ''"],
      ]) if(!columns.has(name)) await db.execAsync(`ALTER TABLE tasks ADD COLUMN ${name} ${definition}`);
    }
    if (version < 2) {
      await db.execAsync(`CREATE TABLE IF NOT EXISTS local_profiles (
        id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '');
        CREATE TABLE IF NOT EXISTS local_favorites (
        profile_id TEXT NOT NULL REFERENCES local_profiles(id),task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        PRIMARY KEY(profile_id,task_id));
        CREATE TABLE IF NOT EXISTS interest_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
        task_title TEXT NOT NULL,recipient_id TEXT NOT NULL REFERENCES local_profiles(id),
        requester_id TEXT NOT NULL REFERENCES local_profiles(id),requester_name TEXT NOT NULL,
        requester_email TEXT NOT NULL,requester_phone TEXT NOT NULL DEFAULT '',note TEXT NOT NULL DEFAULT '',
        read INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        UNIQUE(task_id,requester_id));
        CREATE INDEX IF NOT EXISTS interest_recipient ON interest_notifications(recipient_id,read);`);
      await ensureProfile(db,'me','Me');
      await ensureProfile(db,'student','Student','student@example.com');
      if(!columns.has('owner_profile_id')) await db.execAsync('ALTER TABLE tasks ADD COLUMN owner_profile_id TEXT REFERENCES local_profiles(id)');
      for(const task of await db.getAllAsync('SELECT * FROM tasks')) {
        const owner=task.is_mine ? 'me' : providerId(task.student_name);
        await ensureProfile(db,owner,task.student_name,task.contactEmail,task.contactPhone);
        await db.runAsync('UPDATE tasks SET owner_profile_id=? WHERE id=?',[owner,task.id]);
        if(task.is_favorite) await db.runAsync('INSERT OR IGNORE INTO local_favorites(profile_id,task_id) VALUES (?,?)',['me',task.id]);
      }
      await db.execAsync('PRAGMA user_version = 2');
    }
  });
}
export async function seedDatabase(db) {
  await db.withTransactionAsync(async () => {
    const seeded=await db.getFirstAsync("SELECT value FROM metadata WHERE key='seeded'");
    const count=await db.getFirstAsync('SELECT COUNT(*) AS total FROM tasks');
    if(!seeded && count.total===0) {
      for(const t of sampleTasks) {
        const owner=providerId(t.student_name);
        await ensureProfile(db,owner,t.student_name);
        await db.runAsync(`INSERT INTO tasks
          (title,description,category,budget,student_name,listingType,priceUnit,availability,contactEmail,contactPhone,owner_profile_id)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          [t.title,t.description,t.category,t.budget,t.student_name,t.listingType,t.priceUnit,t.availability,'','',owner]);
      }
    }
    await db.runAsync("INSERT OR IGNORE INTO metadata (key,value) VALUES ('seeded','1')");
  });
}
