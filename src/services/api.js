import { readApiService } from '../utils/serviceDetails.js';
let session = null;
const listeners=new Set();
export function subscribeSession(listener){listeners.add(listener);return()=>listeners.delete(listener);}
function setSession(value){session=value;for(const listener of listeners)listener();}
export const apiUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
export function getSession() { return session; }
export function signOut() { setSession(null); }
export async function request(path, options = {}) {
  if (!apiUrl) throw new Error('Set EXPO_PUBLIC_API_URL to your UniTask API origin and restart Expo.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(),15000);
  try {
    const response = await fetch(`${apiUrl}${path}`, { ...options, signal:controller.signal,
      headers:{'Content-Type':'application/json',...(session ? {Authorization:`Bearer ${session.token}`} : {})} });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
    return data;
  } finally { clearTimeout(timer); }
}
export async function authenticate(mode, values) {
  const result = await request(`/api/auth/${mode}`, {method:'POST',body:JSON.stringify(values)});
  setSession(result);
  return result;
}
export function normalizeTask(t) {
  const ownerId=typeof t.postedBy === 'string' ? t.postedBy : t.postedBy?._id;
  return { listingType:'Service',priceUnit:'Per project',availability:'',...t,
    id:t._id,student_name:t.postedBy?.name || 'Student',...readApiService(t),
    is_mine:Number(Boolean(session?.user?._id) && ownerId === session.user._id),is_favorite:0 };
}
