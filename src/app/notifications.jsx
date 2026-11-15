import { useCallback, useState } from 'react';
import { ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { getSession, request } from '../services/api';
import { useThemeStyles } from '../theme/ThemeProvider';
export default function Notifications() {
  const s=useThemeStyles(createStyles);
  const [items,setItems]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  useFocusEffect(useCallback(() => {
    let active=true;
    async function load() {
      try {const data=await request('/api/notifications');if(active){setItems(data.notifications);setError('');}}
      catch(e){if(active)setError(e.message);}
    }
    if(getSession())load();
    const timer=setInterval(() => {if(getSession())load();},30000);
    return () => {active=false;clearInterval(timer);};
  },[]));
  async function mark(path) {
    if(busy)return;
    setBusy(true);
    try{await request(path,{method:'PATCH'});setItems((await request('/api/notifications')).notifications);setError('');}
    catch(e){setError(e.message);}
    finally{setBusy(false);}
  }
  return <ScrollView style={s.page} contentContainerStyle={s.content}>
    <Pressable accessibilityRole="button" onPress={() => router.replace('/profile')}><Text style={s.link}>Back to profile</Text></Pressable>
    <Text style={s.heading}>Notifications</Text>
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    {!items.length && <Text style={s.text}>No notifications yet.</Text>}
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => mark('/api/notifications/read-all')}>
      <Text style={s.link}>Mark all as read</Text>
    </Pressable>
    {items.map(n => <Pressable accessibilityRole="button" key={n._id} disabled={busy}
      onPress={() => mark(`/api/notifications/${n._id}/read`)} style={[s.item,!n.read && s.unread]}>
      <Text style={s.text}>{n.message}</Text>
      <Text style={s.meta}>{new Date(n.createdAt).toLocaleString()} / {n.read ? 'Read' : 'Tap to mark read'}</Text>
    </Pressable>)}
  </ScrollView>;
}
const createStyles=colors=>StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},content:{padding:24,maxWidth:760,width:'100%',alignSelf:'center'},
  heading:{fontSize:28,fontWeight:'800',marginVertical:24,color:colors.text},text:{color:colors.text,lineHeight:22},
  error:{color:colors.danger,lineHeight:22},link:{color:colors.primary,paddingVertical:18},
  item:{padding:18,backgroundColor:colors.surface,borderRadius:14,marginBottom:12,borderWidth:1,borderColor:colors.border},
  unread:{backgroundColor:colors.primarySurface},meta:{marginTop:8,color:colors.muted},
});
