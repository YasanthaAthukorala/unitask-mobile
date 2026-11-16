import { createContext,useCallback,useContext,useEffect,useMemo,useRef,useState } from 'react';
import { AppState } from 'react-native';
import { useSession } from '../services/useSession';
import { useLocalProfile } from './LocalProfileProvider';
import { getInbox,markNotificationRead } from '../database/notificationRepository';
function useInboxState(){
  const session=useSession(),{profile}=useLocalProfile();
  const identity=session ? 'online:'+session.user._id : 'local:'+(profile?.id || '');
  const currentIdentity=useRef(identity);
  useEffect(()=>{currentIdentity.current=identity;},[identity]);
  const [state,setState]=useState({identity:'',notifications:[],unreadCount:0,error:'',loaded:false});
  const refresh=useCallback(async()=>{
    if(!profile)return;
    try{const data=await getInbox();if(currentIdentity.current!==identity)return;setState({identity,notifications:data.notifications,unreadCount:data.unreadCount,error:'',loaded:true});}
    catch(e){if(currentIdentity.current!==identity)return;setState(old=>({...old,identity,notifications:old.identity===identity ? old.notifications : [],unreadCount:old.identity===identity ? old.unreadCount : 0,error:e.message,loaded:true}));}
  },[identity,profile]);
  useEffect(()=>{
    let active=true,loading=false;
    const load=async()=>{
      if(!active || loading || (AppState.currentState && AppState.currentState!=='active'))return;
      loading=true;try{await refresh();}finally{loading=false;}
    };
    load();
    const interval=setInterval(load,10000);
    const listener=AppState.addEventListener('change',status=>{if(status==='active')load();});
    return()=>{active=false;clearInterval(interval);listener.remove();};
  },[refresh]);
  const markRead=useCallback(async(id=undefined)=>{await markNotificationRead(id);await refresh();},[refresh]);
  return useMemo(()=>({...(state.identity===identity ? state : {notifications:[],unreadCount:0,error:'',loaded:false}),refresh,markRead}),[state,identity,refresh,markRead]);
}
const Context=createContext(/** @type {ReturnType<typeof useInboxState>|null} */(null));
export function InboxProvider({children}){const value=useInboxState();return <Context.Provider value={value}>{children}</Context.Provider>;}
export function useInbox(){const value=useContext(Context);if(!value)throw new Error('InboxProvider is required.');return value;}
