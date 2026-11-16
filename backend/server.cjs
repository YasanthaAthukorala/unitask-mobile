const http=require('node:http');
const crypto=require('node:crypto');
const {promisify}=require('node:util');
const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs'),path=require('node:path');
const scrypt=promisify(crypto.scrypt);
const tokenHash=value=>crypto.createHash('sha256').update(value).digest('hex');
const problem=(status,message)=>Object.assign(new Error(message),{status});
const now=()=>new Date().toISOString();

async function createApi({databasePath=':memory:'}={}){
  const {isValidEmail,normalizeSriLankanPhone}=await import('../src/utils/serviceDetails.js');
  if(databasePath!==':memory:')fs.mkdirSync(path.dirname(path.resolve(databasePath)),{recursive:true});
  const db=new DatabaseSync(databasePath);
  db.exec([
    'PRAGMA foreign_keys=ON;',
    'CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,salt TEXT NOT NULL);',
    'CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires_at INTEGER NOT NULL);',
    'CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL REFERENCES users(id),data TEXT NOT NULL,created_at TEXT NOT NULL);',
    'CREATE TABLE IF NOT EXISTS notifications(id TEXT PRIMARY KEY,recipient TEXT NOT NULL REFERENCES users(id),type TEXT NOT NULL,task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,related_user_id TEXT NOT NULL REFERENCES users(id),message TEXT NOT NULL,note TEXT NOT NULL DEFAULT \'\',read INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,UNIQUE(type,task_id,related_user_id));',
    'CREATE INDEX IF NOT EXISTS notifications_recipient ON notifications(recipient,read);',
  ].join('\n'));
  const all=(sql,...params)=>db.prepare(sql).all(...params);
  const one=(sql,...params)=>db.prepare(sql).get(...params);
  const run=(sql,...params)=>db.prepare(sql).run(...params);
  const publicUser=id=>{const row=one('SELECT id,name,email FROM users WHERE id=?',id);return row?{_id:row.id,name:row.name,email:row.email}:null;};
  const atomic=work=>{db.exec('BEGIN IMMEDIATE');try{const value=work();db.exec('COMMIT');return value;}catch(e){db.exec('ROLLBACK');throw e;}};
  const taskDoc=row=>{
    const data=JSON.parse(row.data);
    return {...data,_id:row.id,postedBy:publicUser(row.owner_id),createdAt:row.created_at,
      ratings:(data.ratings||[]).map(r=>({...r,user:publicUser(r.user)}))};
  };
  const notificationDoc=row=>({
    _id:row.id,type:row.type,message:row.message,note:row.note,read:Boolean(row.read),createdAt:row.created_at,
    task:row.task_id?{_id:row.task_id,title:JSON.parse(one('SELECT data FROM tasks WHERE id=?',row.task_id).data).title}:null,
    relatedUser:publicUser(row.related_user_id),
  });
  function authenticate(req){
    const value=req.headers.authorization;
    if(typeof value!=='string'||!value.startsWith('Bearer '))throw problem(401,'Please sign in.');
    const session=one('SELECT user_id FROM sessions WHERE token_hash=? AND expires_at>?',tokenHash(value.slice(7)),Date.now());
    if(!session)throw problem(401,'Session expired. Please sign in again.');
    return publicUser(session.user_id);
  }
  function loginSession(user){
    const token=crypto.randomBytes(32).toString('base64url');
    run('DELETE FROM sessions WHERE expires_at<=?',Date.now());
    run('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES (?,?,?)',tokenHash(token),user._id,Date.now()+7*86400000);
    return {token,user};
  }
  function listing(body){
    const title=typeof body.title==='string'?body.title.trim():'',description=typeof body.description==='string'?body.description.trim():'';
    const category=typeof body.category==='string'?body.category.trim():'';
    const budget=Number(body.budget),email=typeof body.contactEmail==='string'?body.contactEmail.trim().toLowerCase():'';
    const phone=normalizeSriLankanPhone(body.contactPhone);
    if(!title||title.length>120||!description||description.length>6000||!category||category.length>80)throw problem(400,'Enter a valid title, description and category.');
    if(!Number.isFinite(budget)||budget<1)throw problem(400,'Enter a price of at least Rs. 1.');
    if(!isValidEmail(email)||!phone)throw problem(400,'Enter a valid email and Sri Lankan phone number.');
    return {title,description,category,budget,contactEmail:email,contactPhone:phone};
  }
  async function readBody(req){
    let size=0;const chunks=[];
    for await(const chunk of req){size+=chunk.length;if(size>32768)throw problem(413,'Request too large.');chunks.push(chunk);}
    const text=Buffer.concat(chunks).toString('utf8');
    try{const value=text?JSON.parse(text):{};if(!value||typeof value!=='object'||Array.isArray(value))throw Error();return value;}
    catch{throw problem(400,'Send a valid JSON object.');}
  }
  const authAttempts=new Map();
  function limitAuth(req){
    const key=req.socket.remoteAddress,time=Date.now();
    let item=authAttempts.get(key);
    if(!item||time-item.start>60000){item={start:time,count:0};authAttempts.set(key,item);}
    if(++item.count>30)throw problem(429,'Too many sign-in attempts. Try again in a minute.');
    if(authAttempts.size>1000)for(const[k,v]of authAttempts)if(time-v.start>60000)authAttempts.delete(k);
  }
  const server=http.createServer(async(req,res)=>{
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Cache-Control','no-store');
    res.setHeader('Content-Type','application/json; charset=utf-8');
    const send=(status,data)=>{res.statusCode=status;res.end(JSON.stringify(data));};
    try{
      if(req.method==='OPTIONS'){res.statusCode=204;res.end();return;}
      const url=new URL(req.url,'http://localhost'),route=url.pathname,method=req.method;
      if(route==='/api/health'&&method==='GET'){send(200,{status:'ok',service:'UniTask private SQLite API'});return;}
      if(/^\/api\/auth\/(register|login)$/.test(route)&&method==='POST'){
        limitAuth(req);
        const body=await readBody(req),email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
        if(!isValidEmail(email)||typeof body.password!=='string'||body.password.length<6||body.password.length>128)throw problem(400,'Enter a valid email and a password of 6-128 characters.');
        let user=one('SELECT * FROM users WHERE email=?',email);
        if(route.endsWith('/register')){
          const name=typeof body.name==='string'?body.name.trim():'';
          if(!name||name.length>80)throw problem(400,'Enter a name of up to 80 characters.');
          if(user)throw problem(409,'Email already registered.');
          const salt=crypto.randomBytes(16).toString('hex'),hash=await scrypt(body.password,salt,64);
          const id=crypto.randomUUID();
          try{run('INSERT INTO users(id,name,email,password_hash,salt) VALUES (?,?,?,?,?)',id,name,email,hash.toString('hex'),salt);}
          catch(e){if(one('SELECT id FROM users WHERE email=?',email))throw problem(409,'Email already registered.');throw e;}
          send(201,loginSession(publicUser(id)));return;
        }
        const hash=await scrypt(body.password,user?.salt || 'unitask-nonexistent-account',64);
        if(!user||!crypto.timingSafeEqual(hash,Buffer.from(user.password_hash,'hex')))throw problem(401,'Invalid email or password.');
        send(200,loginSession(publicUser(user.id)));return;
      }
      const user=authenticate(req);
      if(route==='/api/auth/me'&&method==='GET'){send(200,{user});return;}
      if(route==='/api/tasks'){
        if(method==='GET'){
          let rows=all('SELECT * FROM tasks ORDER BY created_at DESC,rowid DESC').map(taskDoc);
          const term=(url.searchParams.get('search')||'').trim().toLowerCase(),category=url.searchParams.get('category');
          rows=rows.filter(t=>(!term||(t.title+' '+t.description).toLowerCase().includes(term))&&(!category||category==='All'||t.category===category));
          send(200,rows);return;
        }
        if(method==='POST'){
          const data={...listing(await readBody(req)),status:'Available',hiredBy:null,ratings:[],averageRating:0,ratingCount:0};
          const id=crypto.randomUUID();run('INSERT INTO tasks(id,owner_id,data,created_at) VALUES (?,?,?,?)',id,user._id,JSON.stringify(data),now());
          send(201,taskDoc(one('SELECT * FROM tasks WHERE id=?',id)));return;
        }
      }
      if(route==='/api/notifications'&&method==='GET'){
        const notifications=all('SELECT * FROM notifications WHERE recipient=? ORDER BY created_at DESC,rowid DESC LIMIT 50',user._id).map(notificationDoc);
        const unreadCount=one('SELECT COUNT(*) AS total FROM notifications WHERE recipient=? AND read=0',user._id).total;
        send(200,{notifications,unreadCount});return;
      }
      if(route==='/api/notifications/read-all'&&method==='PATCH'){
        run('UPDATE notifications SET read=1 WHERE recipient=?',user._id);send(200,{message:'Notifications marked as read.'});return;
      }
      const notificationMatch=route.match(/^\/api\/notifications\/([^/]+)\/read$/);
      if(notificationMatch&&method==='PATCH'){
        const id=decodeURIComponent(notificationMatch[1]);
        const result=run('UPDATE notifications SET read=1 WHERE id=? AND recipient=?',id,user._id);
        if(!result.changes)throw problem(404,'Notification not found.');
        send(200,notificationDoc(one('SELECT * FROM notifications WHERE id=? AND recipient=?',id,user._id)));return;
      }
      const match=route.match(/^\/api\/tasks\/([^/]+)(?:\/(interests\/me|interests|hire|rate))?$/);
      if(match){
        const id=decodeURIComponent(match[1]),action=match[2];
        const body=(method==='POST'||method==='PUT')?await readBody(req):{};
        const row=one('SELECT * FROM tasks WHERE id=?',id);
        if(!row)throw problem(404,'Service not found.');
        const data=JSON.parse(row.data);
        if(action==='interests/me'&&method==='GET'){
          send(200,{sent:Boolean(one("SELECT id FROM notifications WHERE type='service_interest' AND task_id=? AND related_user_id=?",id,user._id))});return;
        }
        if(action==='interests'&&method==='POST'){
          if(row.owner_id===user._id)throw problem(403,'You cannot request your own service.');
          if(data.status!=='Available')throw problem(409,'This service is not accepting requests right now.');
          const note=body.message===undefined?'':body.message;
          if(typeof note!=='string'||note.trim().length>500)throw problem(400,'Keep your message to 500 characters.');
          const result=atomic(()=>run("INSERT OR IGNORE INTO notifications(id,recipient,type,task_id,related_user_id,message,note,created_at) VALUES (?,?,'service_interest',?,?,?,?,?)",
            crypto.randomUUID(),row.owner_id,id,user._id,user.name+' is interested in "'+data.title+'".',note.trim(),now()));
          send(200,{sent:true,alreadySent:result.changes===0});return;
        }
        if(!action&&method==='GET'){send(200,taskDoc(row));return;}
        if(!action&&(method==='PUT'||method==='DELETE')){
          if(row.owner_id!==user._id)throw problem(403,'Only the provider can change this service.');
          if(method==='DELETE'){run('DELETE FROM tasks WHERE id=?',id);send(200,{message:'Service deleted.'});return;}
          const next={...data,...listing({...data,...body})};
          if(body.status!==undefined){
            if(!['Available','Hired','In Progress','Completed'].includes(body.status))throw problem(400,'Invalid status.');
            if(body.status==='Available'&&data.hiredBy)throw problem(409,'This service already has a booking.');
            next.status=body.status;
          }
          run('UPDATE tasks SET data=? WHERE id=?',JSON.stringify(next),id);send(200,taskDoc(one('SELECT * FROM tasks WHERE id=?',id)));return;
        }
        if(action==='hire'&&method==='POST'){
          if(row.owner_id===user._id)throw problem(403,'You cannot hire your own service.');
          if(data.status!=='Available')throw problem(409,'This service is no longer available.');
          atomic(()=>{
            run('UPDATE tasks SET data=? WHERE id=?',JSON.stringify({...data,status:'Hired',hiredBy:user._id}),id);
            run("INSERT INTO notifications(id,recipient,type,task_id,related_user_id,message,created_at) VALUES (?,?,'gig_hired',?,?,?,?)",
              crypto.randomUUID(),row.owner_id,id,user._id,user.name+' hired your service "'+data.title+'".',now());
          });
          send(200,taskDoc(one('SELECT * FROM tasks WHERE id=?',id)));return;
        }
        if(action==='rate'&&method==='POST'){
          if(row.owner_id===user._id||data.status!=='Completed')throw problem(403,'Only students reviewing a completed service can add a review.');
          const stars=Number(body.stars),comment=body.comment || '';
          if(!Number.isInteger(stars)||stars<1||stars>5||typeof comment!=='string'||comment.length>300)throw problem(400,'Choose 1-5 stars and a comment of up to 300 characters.');
          const ratings=(data.ratings||[]).filter(r=>r.user!==user._id);
          ratings.push({_id:crypto.randomUUID(),user:user._id,stars,comment:comment.trim()});
          const averageRating=Math.round(ratings.reduce((n,r)=>n+r.stars,0)/ratings.length*10)/10;
          run('UPDATE tasks SET data=? WHERE id=?',JSON.stringify({...data,ratings,averageRating,ratingCount:ratings.length}),id);
          send(200,taskDoc(one('SELECT * FROM tasks WHERE id=?',id)));return;
        }
      }
      throw problem(404,'Endpoint not found.');
    }catch(e){send(e.status||500,{message:e.status?e.message:'The server could not complete this request.'});}
  });
  server.requestTimeout=15000;
  server.on('close',()=>db.close());
  return {server};
}
module.exports={createApi};
if(require.main===module){
  const databasePath=process.env.UNITASK_API_DB || path.join(__dirname,'../.unitask-api/data.sqlite');
  createApi({databasePath}).then(({server})=>{
    const port=Number(process.env.PORT||8000),host=process.env.HOST||'127.0.0.1';
    server.listen(port,host,()=>console.log('UniTask SQLite API: http://'+host+':'+port));
    for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
  }).catch(error=>{console.error(error.message);process.exitCode=1;});
}
