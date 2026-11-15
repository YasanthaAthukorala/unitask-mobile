import AppearanceSelector from '../../components/AppearanceSelector';
import { useThemeStyles } from '../../theme/ThemeProvider';
import { router, useFocusEffect } from 'expo-router';
import { getSession, signOut } from '../../services/api';
import { Pressable, ScrollView, Text, StyleSheet } from 'react-native';
import { useCallback, useState } from 'react';
import { getTasks } from '../../database/taskRepository';
import TaskCard from '../../components/TaskCard';
export default function Profile() {
  const s=useThemeStyles(createStyles);
  const [all,setAll]=useState([]),[saved,setSaved]=useState([]),[error,setError]=useState('');
  useFocusEffect(useCallback(() => {
    let active=true;
    Promise.all([getTasks(),getTasks({favorites:true})]).then(([list,favorites]) => {
      if(active){setAll(list);setSaved(favorites);setError('');}
    }).catch(() => {if(active)setError('Could not load your profile listings. Reopen this tab to retry.');});
    return () => {active=false;};
  },[]));
  return <ScrollView style={s.page} contentContainerStyle={s.content}>
    <Text style={s.heading}>Student Profile</Text>
    <Text style={s.info}>{getSession()?.user?.name || 'Local demo user'}</Text>
    <Text style={s.help}>Offer your skills and hire other students with the same account.</Text>
    <AppearanceSelector/>
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Text style={s.info}>My services: {all.filter(t => t.is_mine).length}</Text>
    {!getSession() && <Text style={s.info}>Saved services: {saved.length}</Text>}
    <Pressable accessibilityRole="button" onPress={() => {
      if(getSession()){signOut();router.replace('/home');}else router.push('/auth');
    }}><Text style={s.info}>{getSession() ? 'Sign out' : 'Sign in / Register'}</Text></Pressable>
    {getSession() ? <Pressable accessibilityRole="button" onPress={() => router.push('/notifications')}><Text style={s.info}>Notifications</Text></Pressable> : <>
      <Text style={s.heading}>Saved services</Text>
      {saved.map(t => <TaskCard key={t.id} task={t}/>)}
      {!saved.length && <Text style={s.bodyText}>Save a service from its details page to find it here.</Text>}
    </>}
  </ScrollView>;
}
const createStyles=colors=>StyleSheet.create({
  bodyText:{color:colors.text},error:{color:colors.danger,lineHeight:22},
  page:{flex:1,backgroundColor:colors.background},
  content:{padding:20,width:'100%',maxWidth:820,alignSelf:'center',paddingBottom:40},
  heading:{fontSize:22,fontWeight:'800',marginBottom:14,color:colors.text},
  help:{color:colors.muted,lineHeight:22,marginBottom:18},
  info:{padding:14,backgroundColor:colors.surface,marginBottom:10,borderRadius:10,color:colors.text},
});
