const {test}=require('node:test'),assert=require('node:assert/strict');
const {createApi}=require('../backend/server.cjs');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
async function start(databasePath=':memory:'){
 const {server}=await createApi({databasePath});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const call=async(route,{token,method='GET',body}={})=>{
  const response=await fetch(origin+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});
  return {status:response.status,data:await response.json()};
 };
 return {call,close:()=>new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()))};
}
const listing={title:'Java course',description:'Learn Java through practical classes.',category:'Education',budget:1500,contactEmail:'tutor@example.com',contactPhone:'0771234567'};
async function register(call,name){
 const result=await call('/api/auth/register',{method:'POST',body:{name,email:name.toLowerCase()+'@unitask.test',password:'test-password-123'}});
 assert.equal(result.status,201);return result.data;
}
test('real HTTP requests reach only the owner inbox, with authentication and idempotent retries',async()=>{
 const api=await start(),{call}=api;
 try{
  assert.equal((await call('/api/tasks')).status,401);
  const owner=await register(call,'Owner'),student=await register(call,'Student'),other=await register(call,'Other');
  const created=await call('/api/tasks',{token:owner.token,method:'POST',body:listing});
  assert.equal(created.status,201);const id=created.data._id;
  assert.equal((await call('/api/tasks/'+id+'/interests/me',{token:student.token})).data.sent,false);
  assert.equal((await call('/api/notifications',{token:owner.token})).data.unreadCount,0,'viewing a listing must not notify');
  const requests=await Promise.all([1,2].map(()=>call('/api/tasks/'+id+'/interests',{token:student.token,method:'POST',body:{message:'\u0db8\u0da7 Java \u0d89\u0d9c\u0dd9\u0db1 \u0d9c\u0db1\u0dca\u0db1 \u0d95\u0db1'}})));
  assert.ok(requests.every(r=>r.status===200));
  assert.deepEqual(requests.map(r=>r.data.alreadySent).sort(),[false,true]);
  const inbox=(await call('/api/notifications',{token:owner.token})).data;
  assert.equal(inbox.unreadCount,1);assert.equal(inbox.notifications.length,1);
  const item=inbox.notifications[0];
  assert.equal(item.note,'\u0db8\u0da7 Java \u0d89\u0d9c\u0dd9\u0db1 \u0d9c\u0db1\u0dca\u0db1 \u0d95\u0db1');assert.equal(item.relatedUser.email,'student@unitask.test');
  assert.equal((await call('/api/notifications',{token:student.token})).data.unreadCount,0);
  assert.equal((await call('/api/notifications/'+item._id+'/read',{token:other.token,method:'PATCH'})).status,404);
  assert.equal((await call('/api/tasks/'+id+'/interests',{token:owner.token,method:'POST',body:{}})).status,403);
  assert.equal((await call('/api/tasks/'+id,{token:owner.token})).data.status,'Available');
  assert.equal((await call('/api/notifications/'+item._id+'/read',{token:owner.token,method:'PATCH'})).status,200);
  await call('/api/tasks/'+id+'/interests',{token:student.token,method:'POST',body:{}});
  assert.equal((await call('/api/notifications',{token:owner.token})).data.unreadCount,0);
  assert.equal((await call('/api/tasks/'+id+'/interests/me',{token:student.token})).data.sent,true);
  assert.equal((await call('/api/tasks/'+id,{token:owner.token,method:'DELETE'})).status,200);
  const retained=(await call('/api/notifications',{token:owner.token})).data.notifications[0];
  assert.equal(retained.task,null);assert.match(retained.message,/Java course/);
 }finally{await api.close();}
});
test('private SQLite accounts, sessions and notifications survive a server restart without plaintext secrets',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'unitask-api-')),file=path.join(directory,'data.sqlite');
 let api=await start(file);
 try{
  const owner=await register(api.call,'Owner'),student=await register(api.call,'Student');
  const created=await api.call('/api/tasks',{token:owner.token,method:'POST',body:listing}),id=created.data._id;
  await api.call('/api/tasks/'+id+'/interests',{token:student.token,method:'POST',body:{message:'Weekend classes?'}});
  await api.close();api=null;
  const stored=new DatabaseSync(file);
  try{
   const user=stored.prepare("SELECT password_hash FROM users WHERE email='owner@unitask.test'").get();
   assert.notEqual(user.password_hash,'test-password-123');assert.match(user.password_hash,/^[0-9a-f]{128}$/);
   const sessions=stored.prepare('SELECT token_hash FROM sessions').all();
   assert.ok(sessions.every(row=>row.token_hash!==owner.token&&row.token_hash!==student.token));
  }finally{stored.close();}
  api=await start(file);
  const inbox=await api.call('/api/notifications',{token:owner.token});
  assert.equal(inbox.status,200);assert.equal(inbox.data.unreadCount,1);assert.equal(inbox.data.notifications[0].note,'Weekend classes?');
  assert.equal((await api.call('/api/auth/login',{method:'POST',body:{email:'owner@unitask.test',password:'wrong-password'}})).status,401);
 }finally{
  if(api)await api.close();
  fs.unlinkSync(file);fs.rmdirSync(directory);
 }
});
