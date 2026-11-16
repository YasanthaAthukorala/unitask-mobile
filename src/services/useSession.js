import { useSyncExternalStore } from 'react';
import { getSession, subscribeSession } from './api';
const serverSnapshot=()=>null;
export function useSession(){return useSyncExternalStore(subscribeSession,getSession,serverSnapshot);}
