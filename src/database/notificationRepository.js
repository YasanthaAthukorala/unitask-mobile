import { getSession, request } from '../services/api';
import { getDb } from './database';
import { readLocalProfile,readLocalInbox,markLocalRead,sendLocalInterest,localInterestState,validateInterestMessage } from './localProfiles';

export async function getInbox(){
  if(getSession())return request('/api/notifications');
  const db=await getDb(),profile=await readLocalProfile(db);
  return readLocalInbox(db,profile.id);
}
export async function markNotificationRead(id=undefined){
  if(getSession())return request(id===undefined ? '/api/notifications/read-all' : `/api/notifications/${id}/read`,{method:'PATCH'});
  const db=await getDb(),profile=await readLocalProfile(db);
  return markLocalRead(db,profile.id,id);
}
export async function sendInterest(taskId,message=''){
  const note=validateInterestMessage(message);
  if(getSession())return request(`/api/tasks/${encodeURIComponent(String(taskId))}/interests`,{method:'POST',body:JSON.stringify({message:note})});
  const db=await getDb(),profile=await readLocalProfile(db);
  return sendLocalInterest(db,profile.id,taskId,note);
}
export async function getInterestState(taskId){
  if(getSession())return request(`/api/tasks/${encodeURIComponent(String(taskId))}/interests/me`);
  const db=await getDb(),profile=await readLocalProfile(db);
  return localInterestState(db,profile.id,taskId);
}
