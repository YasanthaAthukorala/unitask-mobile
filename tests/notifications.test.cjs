const {test}=require('node:test'),assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
function database(){
 const connection=new DatabaseSync(':memory:');connection.exec('PRAGMA foreign_keys=ON');
 const db={
  execAsync:async sql=>connection.exec(sql),
  getFirstAsync:async(sql,params=[])=>connection.prepare(sql).get(...params),
  getAllAsync:async(sql,params=[])=>connection.prepare(sql).all(...params),
  runAsync:async(sql,params=[])=>connection.prepare(sql).run(...params),
  withTransactionAsync:async work=>{connection.exec('BEGIN');try{await work();connection.exec('COMMIT');}catch(e){connection.exec('ROLLBACK');throw e;}},
 };
 return {connection,db};
}
async function setup(){
 const {migrateDatabase}=await import('../src/database/migrations.js'),{connection,db}=database();
 await migrateDatabase(db);
 await db.runAsync("INSERT INTO tasks(title,description,category,budget,student_name,owner_profile_id,is_mine) VALUES ('Java course','Learn Java','Education',1500,'Me','me',1)");
 return {connection,db};
}
test('an explicit request notifies only the owner, preserves availability and deduplicates retries',async()=>{
 const {sendLocalInterest,readLocalInbox,localInterestState,markLocalRead}=await import('../src/database/localProfiles.js');
 const {connection,db}=await setup();
 try{
  const first=await sendLocalInterest(db,'student',1,'I want to learn Java.');
  assert.equal(first.alreadySent,false);
  assert.equal((await sendLocalInterest(db,'student',1,'duplicate')).alreadySent,true);
  assert.equal((await localInterestState(db,'student',1)).sent,true);
  const owner=await readLocalInbox(db,'me'),sender=await readLocalInbox(db,'student');
  assert.equal(owner.unreadCount,1);assert.equal(owner.notifications.length,1);assert.equal(sender.unreadCount,0);
  assert.equal(owner.notifications[0].relatedUser.email,'student@example.com');
  assert.equal(owner.notifications[0].note,'I want to learn Java.');
  assert.equal(connection.prepare('SELECT status FROM tasks').get().status,'Available');
  await assert.rejects(markLocalRead(db,'student',owner.notifications[0]._id),/not found/);
  assert.equal((await readLocalInbox(db,'me')).unreadCount,1);
  await markLocalRead(db,'me',owner.notifications[0]._id);
  await sendLocalInterest(db,'student',1,'retry');
  assert.equal((await readLocalInbox(db,'me')).unreadCount,0,'a retry must not resurrect a read notification');
 }finally{connection.close();}
});
test('owners cannot self-request; unavailable/missing services and overlong messages create no notifications',async()=>{
 const {sendLocalInterest}=await import('../src/database/localProfiles.js');
 const {connection,db}=await setup();
 try{
  await assert.rejects(sendLocalInterest(db,'me',1,''),/own service/);
  await assert.rejects(sendLocalInterest(db,'student',999,''),/not found/);
  await assert.rejects(sendLocalInterest(db,'student',1,'x'.repeat(501)),/500/);
  connection.exec("UPDATE tasks SET status='Completed'");
  await assert.rejects(sendLocalInterest(db,'student',1,''),/not accepting/);
  assert.equal(connection.prepare('SELECT COUNT(*) AS n FROM interest_notifications').get().n,0);
 }finally{connection.close();}
});
test('notifications retain the sender and title after a listing is removed',async()=>{
 const {sendLocalInterest,readLocalInbox}=await import('../src/database/localProfiles.js');
 const {connection,db}=await setup();
 try{
  await sendLocalInterest(db,'student',1,'Please contact me.');
  connection.exec('DELETE FROM tasks WHERE id=1');
  const item=(await readLocalInbox(db,'me')).notifications[0];
  assert.equal(item.task,null);assert.match(item.message,/Java course/);assert.equal(item.relatedUser.name,'Student');
 }finally{connection.close();}
});
test('local profiles persist selection and remain distinct from ownership and favorites',async()=>{
 const {createLocalProfile,selectLocalProfile,readLocalProfile}=await import('../src/database/localProfiles.js');
 const {connection,db}=await setup();
 try{
  const profile=await createLocalProfile(db,{name:'Learner',email:'learner@example.com',phone:'0771234567'});
  await selectLocalProfile(db,profile.id);
  assert.equal((await readLocalProfile(db)).id,profile.id);
  assert.equal(profile.phone,'+94771234567');
  assert.equal(connection.prepare('SELECT owner_profile_id FROM tasks').get().owner_profile_id,'me');
  await db.runAsync('INSERT INTO local_favorites(profile_id,task_id) VALUES (?,?)',[profile.id,1]);
  assert.equal(connection.prepare("SELECT COUNT(*) AS n FROM local_favorites WHERE profile_id='me'").get().n,0);
  await assert.rejects(createLocalProfile(db,{name:'Bad',email:'invalid'}),/email/);
  await assert.rejects(selectLocalProfile(db,'missing'),/not found/);
 }finally{connection.close();}
});
