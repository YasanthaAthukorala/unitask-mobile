import { isValidEmail, normalizeSriLankanPhone } from '../utils/serviceDetails.js';
export async function readLocalProfile(db) {
  const selected=await db.getFirstAsync("SELECT value FROM metadata WHERE key='active-local-profile'");
  return await db.getFirstAsync('SELECT * FROM local_profiles WHERE id=?',[selected?.value || 'me'])
    || await db.getFirstAsync("SELECT * FROM local_profiles WHERE id='me'");
}
export function listLocalProfiles(db) {return db.getAllAsync("SELECT * FROM local_profiles ORDER BY CASE WHEN id='me' THEN 0 WHEN id='student' THEN 1 ELSE 2 END,name");}
export async function selectLocalProfile(db,id) {
  const profile=await db.getFirstAsync('SELECT * FROM local_profiles WHERE id=?',[id]);
  if(!profile)throw new Error('Profile not found.');
  await db.runAsync("INSERT INTO metadata(key,value) VALUES ('active-local-profile',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",[id]);
  return profile;
}
export async function createLocalProfile(db,values) {
  const name=String(values.name || '').trim(),email=String(values.email || '').trim().toLowerCase();
  const phone=values.phone ? normalizeSriLankanPhone(values.phone) : '';
  if(!name || name.length>80)throw new Error('Enter a name of up to 80 characters.');
  if(!isValidEmail(email))throw new Error('Enter a valid email address.');
  if(values.phone && !phone)throw new Error('Enter a valid Sri Lankan phone number or leave it empty.');
  return db.getFirstAsync('INSERT INTO local_profiles(id,name,email,phone) VALUES (lower(hex(randomblob(16))),?,?,?) RETURNING *',[name,email,phone]);
}
export function validateInterestMessage(value) {
  if(typeof value!=='string' || value.trim().length>500)throw new Error('Keep your message to 500 characters.');
  return value.trim();
}
export async function sendLocalInterest(db,requesterId,taskId,message='') {
  const note=validateInterestMessage(message);
  let result;
  await db.withTransactionAsync(async()=>{
    const actor=await db.getFirstAsync('SELECT * FROM local_profiles WHERE id=?',[requesterId]);
    const task=await db.getFirstAsync('SELECT * FROM tasks WHERE id=?',[Number(taskId)]);
    if(!actor || !task)throw new Error('Profile or service not found.');
    if(task.owner_profile_id===actor.id)throw new Error('You cannot request your own service.');
    if(task.status!=='Available')throw new Error('This service is not accepting requests right now.');
    const inserted=await db.runAsync(`INSERT OR IGNORE INTO interest_notifications
      (task_id,task_title,recipient_id,requester_id,requester_name,requester_email,requester_phone,note)
      VALUES (?,?,?,?,?,?,?,?)`,[task.id,task.title,task.owner_profile_id,actor.id,actor.name,actor.email,actor.phone,note]);
    result={sent:true,alreadySent:inserted.changes===0};
  });
  return result;
}
export async function readLocalInbox(db,profileId) {
  const rows=await db.getAllAsync('SELECT * FROM interest_notifications WHERE recipient_id=? ORDER BY id DESC LIMIT 50',[profileId]);
  const count=await db.getFirstAsync('SELECT COUNT(*) AS total FROM interest_notifications WHERE recipient_id=? AND read=0',[profileId]);
  return {unreadCount:count.total,notifications:rows.map(row=>({
    _id:String(row.id),type:'service_interest',message:`${row.requester_name} is interested in "${row.task_title}".`,
    note:row.note,read:Boolean(row.read),createdAt:row.created_at,
    task:row.task_id===null ? null : {_id:String(row.task_id),title:row.task_title},
    relatedUser:{_id:row.requester_id,name:row.requester_name,email:row.requester_email,phone:row.requester_phone},
  }))};
}
export async function markLocalRead(db,profileId,id) {
  if(id===undefined)return db.runAsync('UPDATE interest_notifications SET read=1 WHERE recipient_id=?',[profileId]);
  const result=await db.runAsync('UPDATE interest_notifications SET read=1 WHERE id=? AND recipient_id=?',[Number(id),profileId]);
  if(!result.changes)throw new Error('Notification not found.');
}
export async function localInterestState(db,profileId,taskId) {
  const existing=await db.getFirstAsync('SELECT id FROM interest_notifications WHERE requester_id=? AND task_id=?',[profileId,Number(taskId)]);
  return {sent:Boolean(existing)};
}
