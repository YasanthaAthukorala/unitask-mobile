const {test}=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
function database(){
  const connection=new DatabaseSync(':memory:');
  const adapter={
    execAsync:async sql=>connection.exec(sql),
    getFirstAsync:async(sql,params=[])=>connection.prepare(sql).get(...params),
    getAllAsync:async(sql,params=[])=>connection.prepare(sql).all(...params),
    runAsync:async(sql,params=[])=>connection.prepare(sql).run(...params),
    withTransactionAsync:async work=>{
      connection.exec('BEGIN');
      try{await work();connection.exec('COMMIT');}
      catch(error){connection.exec('ROLLBACK');throw error;}
    },
  };
  return {connection,adapter};
}
test('upgrading an existing database preserves owner listings, favorites and deadlines',async()=>{
  const {migrateDatabase,seedDatabase}=await import('../src/database/migrations.js');
  const {connection,adapter}=database();
  try{
    connection.exec(`CREATE TABLE tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,description TEXT NOT NULL,
      category TEXT NOT NULL,budget REAL NOT NULL,deadline TEXT,student_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Available',is_favorite INTEGER NOT NULL DEFAULT 0,is_mine INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE metadata (key TEXT PRIMARY KEY,value TEXT);
      INSERT INTO metadata VALUES ('seeded','1');
      INSERT INTO tasks (title,description,category,budget,deadline,student_name,is_favorite,is_mine)
      VALUES ('My existing listing','Keep my content','Education',1234,'2026-12-01','Me',1,1);`);
    const before=connection.prepare('SELECT * FROM tasks').get();
    await migrateDatabase(adapter);await seedDatabase(adapter);await migrateDatabase(adapter);
    const after=connection.prepare('SELECT * FROM tasks').get();
    for(const [key,value] of Object.entries(before))assert.equal(after[key],value,key);
    assert.equal(after.listingType,'Service');
    assert.equal(after.priceUnit,'Per project');
    assert.equal(after.contactEmail,'');assert.equal(after.contactPhone,'');
    assert.equal(connection.prepare('SELECT COUNT(*) AS n FROM tasks').get().n,1);
    assert.equal(connection.prepare('PRAGMA user_version').get().user_version,1);
    // The migrated contact fields are writable without rebuilding or deleting the row.
    await adapter.runAsync('UPDATE tasks SET contactEmail=?,contactPhone=?,listingType=?,priceUnit=? WHERE id=?',
      ['tutor@example.com','+94112345678','Class','Per hour',before.id]);
    await migrateDatabase(adapter);
    const updated=connection.prepare('SELECT * FROM tasks').get();
    assert.equal(updated.contactPhone,'+94112345678');assert.equal(updated.is_favorite,1);
  }finally{connection.close();}
});
test('fresh installations seed provider-led listings once and never resurrect deleted listings',async()=>{
  const {migrateDatabase,seedDatabase}=await import('../src/database/migrations.js');
  const {connection,adapter}=database();
  try{
    await migrateDatabase(adapter);await seedDatabase(adapter);await seedDatabase(adapter);
    assert.equal(connection.prepare('SELECT COUNT(*) AS n FROM tasks').get().n,10);
    assert.ok(connection.prepare("SELECT * FROM tasks WHERE title='Java Individual Classes' AND listingType='Class'").get());
    assert.ok(connection.prepare("SELECT * FROM tasks WHERE category='Photography'").get());
    connection.exec('DELETE FROM tasks');
    await migrateDatabase(adapter);await seedDatabase(adapter);
    assert.equal(connection.prepare('SELECT COUNT(*) AS n FROM tasks').get().n,0);
  }finally{connection.close();}
});
