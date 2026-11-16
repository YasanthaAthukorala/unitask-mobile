import { getSession, request, normalizeTask } from '../services/api';
import { validateService, toApiService } from '../utils/serviceDetails';
import { getDb } from './database';
import { readLocalProfile } from './localProfiles';

const selectListing=`SELECT t.id,t.title,t.description,t.category,t.budget,t.deadline,t.student_name,t.status,
  t.contactEmail,t.contactPhone,t.listingType,t.priceUnit,t.availability,t.owner_profile_id,
  CASE WHEN t.owner_profile_id=? THEN 1 ELSE 0 END AS is_mine,
  CASE WHEN f.task_id IS NULL THEN 0 ELSE 1 END AS is_favorite
  FROM tasks t LEFT JOIN local_favorites f ON f.task_id=t.id AND f.profile_id=?`;
export async function getTasks({search='',category='All',mine=false,favorites=false,listingType='All'}={}){
  if(getSession()){
    const query=new URLSearchParams({search,category});
    let tasks=(await request('/api/tasks?'+query)).map(normalizeTask);
    if(mine)tasks=tasks.filter(t=>t.is_mine);
    if(favorites)tasks=[];
    if(listingType!=='All')tasks=tasks.filter(t=>t.listingType===listingType);
    return tasks;
  }
  const db=await getDb(),profile=await readLocalProfile(db),clauses=[],params=[profile.id,profile.id];
  if(search.trim()){
    const q=search.trim().replace(/[\\%_]/g,'\\$&');
    clauses.push("(t.title LIKE ? ESCAPE '\\' OR t.description LIKE ? ESCAPE '\\')");
    params.push(`%${q}%`,`%${q}%`);
  }
  if(category!=='All'){clauses.push('t.category=?');params.push(category);}
  if(listingType!=='All'){clauses.push('t.listingType=?');params.push(listingType);}
  if(mine){clauses.push('t.owner_profile_id=?');params.push(profile.id);}
  if(favorites)clauses.push('f.task_id IS NOT NULL');
  return db.getAllAsync(selectListing+(clauses.length ? ' WHERE '+clauses.join(' AND ') : '')+' ORDER BY t.id DESC',params);
}
export async function getTask(id){
  if(getSession())return (await getTasks()).find(t=>String(t.id)===String(id)) || null;
  const db=await getDb(),profile=await readLocalProfile(db);
  return db.getFirstAsync(selectListing+' WHERE t.id=?',[profile.id,profile.id,Number(id)]);
}
const values=t=>[t.title,t.description,t.category,t.budget,t.student_name,t.listingType,t.priceUnit,t.availability,t.contactEmail,t.contactPhone];
export async function addTask(input){
  const t=validateService(input);
  if(getSession())return request('/api/tasks',{method:'POST',body:JSON.stringify(toApiService(t))});
  const db=await getDb(),profile=await readLocalProfile(db);
  return db.runAsync(`INSERT INTO tasks (title,description,category,budget,student_name,listingType,priceUnit,availability,contactEmail,contactPhone,is_mine,owner_profile_id)
    VALUES (?,?,?,?,?,?,?,?,?,?,1,?)`,[...values(t),profile.id]);
}
export async function updateTask(id,input){
  const t=validateService(input);
  if(getSession())return request('/api/tasks/'+id,{method:'PUT',body:JSON.stringify(toApiService(t))});
  const db=await getDb(),profile=await readLocalProfile(db);
  return db.runAsync(`UPDATE tasks SET title=?,description=?,category=?,budget=?,student_name=?,listingType=?,priceUnit=?,availability=?,contactEmail=?,contactPhone=?
    WHERE id=? AND owner_profile_id=?`,[...values(t),Number(id),profile.id]);
}
export async function deleteTask(id){
  if(getSession())return request('/api/tasks/'+id,{method:'DELETE'});
  const db=await getDb(),profile=await readLocalProfile(db);
  return db.runAsync('DELETE FROM tasks WHERE id=? AND owner_profile_id=?',[Number(id),profile.id]);
}
export async function toggleFavorite(id,current){
  const db=await getDb(),profile=await readLocalProfile(db);
  return current ? db.runAsync('DELETE FROM local_favorites WHERE profile_id=? AND task_id=?',[profile.id,Number(id)])
    : db.runAsync('INSERT OR IGNORE INTO local_favorites(profile_id,task_id) VALUES (?,?)',[profile.id,Number(id)]);
}
export async function changeStatus(id,status){
  if(!['Available','Hired','In Progress','Completed'].includes(status))throw new Error('Invalid status');
  if(getSession())return request('/api/tasks/'+id,{method:'PUT',body:JSON.stringify({status})});
  const db=await getDb(),profile=await readLocalProfile(db);
  return db.runAsync('UPDATE tasks SET status=? WHERE id=? AND owner_profile_id=?',[status,Number(id),profile.id]);
}
