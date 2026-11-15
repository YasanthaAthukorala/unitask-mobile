import { useCallback, useState } from 'react';
import { ScrollView, Text, Pressable } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { getSession, request } from '../services/api';
export default function Notifications(){
 const [items,setItems]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useFocusEffect(useCallback(()=>{let active=true;async function load(){try{const data=await request('/api/notifications');if(active){setItems(data.notifications);setError('')}}catch(e){if(active)setError(e.message)}}if(getSession())load();const timer=setInterval(()=>{if(getSession())load()},30000);return()=>{active=false;clearInterval(timer)}},[]));
 async function mark(path){if(busy)return;setBusy(true);try{await request(path,{method:'PATCH'});setItems((await request('/api/notifications')).notifications);setError('')}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <ScrollView contentContainerStyle={{padding:24,maxWidth:760,width:'100%',alignSelf:'center'}}><Pressable accessibilityRole="button" onPress={()=>router.replace('/profile')}><Text>Back to profile</Text></Pressable><Text style={{fontSize:28,fontWeight:'800',marginVertical:24}}>Notifications</Text>{!!error&&<Text accessibilityRole="alert">{error}</Text>}{!items.length&&<Text>No notifications yet.</Text>}<Pressable accessibilityRole="button" disabled={busy} onPress={()=>mark('/api/notifications/read-all')}><Text style={{color:'#5145CD',marginVertical:20}}>Mark all as read</Text></Pressable>{items.map(n=><Pressable accessibilityRole="button" key={n._id} disabled={busy} onPress={()=>mark(`/api/notifications/${n._id}/read`)} style={{padding:18,backgroundColor:n.read?'white':'#EEECFF',borderRadius:14,marginBottom:12}}><Text>{n.message}</Text><Text style={{marginTop:8,color:'#77778D'}}>{new Date(n.createdAt).toLocaleString()} · {n.read?'Read':'Tap to mark read'}</Text></Pressable>)}</ScrollView>;
}
