import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getDb } from '../database/database';
import { readLocalProfile, listLocalProfiles, selectLocalProfile, createLocalProfile } from '../database/localProfiles';
function useProfileState(){
  const [profile,setProfile]=useState(null),[profiles,setProfiles]=useState([]),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  useEffect(()=>{
    let active=true;
    getDb().then(async db=>Promise.all([readLocalProfile(db),listLocalProfiles(db)])).then(([current,all])=>{
      if(active){setProfile(current);setProfiles(all);}
    }).catch(()=>{if(active)setError('Could not load local profiles. Please retry.');});
    return()=>{active=false;};
  },[attempt]);
  const retry=useCallback(()=>{setError('');setAttempt(v=>v+1);},[]);
  const selectProfile=useCallback(async id=>{
    const selected=await selectLocalProfile(await getDb(),id);
    setProfile(selected);
  },[]);
  const addProfile=useCallback(async values=>{
    const db=await getDb(),created=await createLocalProfile(db,values);
    await selectLocalProfile(db,created.id);
    setProfiles(await listLocalProfiles(db));setProfile(created);
    return created;
  },[]);
  return useMemo(()=>({profile,profiles,error,retry,selectProfile,addProfile}),[profile,profiles,error,retry,selectProfile,addProfile]);
}
const Context=createContext(/** @type {ReturnType<typeof useProfileState>|null} */(null));
export function LocalProfileProvider({children}){
  const state=useProfileState();
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export function useLocalProfile(){
  const state=useContext(Context);
  if(!state)throw new Error('LocalProfileProvider is required.');
  return state;
}
