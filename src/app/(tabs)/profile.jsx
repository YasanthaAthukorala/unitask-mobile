import AppearanceSelector from '../../components/AppearanceSelector';
import { useThemeStyles } from '../../theme/ThemeProvider';
import { router,useFocusEffect } from 'expo-router';
import { signOut } from '../../services/api';
import { useSession } from '../../services/useSession';
import { useLocalProfile } from '../../context/LocalProfileProvider';
import { useInbox } from '../../context/InboxProvider';
import { Pressable,ScrollView,Text,StyleSheet } from 'react-native';
import { useCallback,useState } from 'react';
import { getTasks } from '../../database/taskRepository';
import TaskCard from '../../components/TaskCard';
export default function Profile(){
  const s=useThemeStyles(createStyles),session=useSession(),{profile}=useLocalProfile(),{unreadCount}=useInbox();
  const [all,setAll]=useState([]),[saved,setSaved]=useState([]),[error,setError]=useState('');
  useFocusEffect(useCallback(()=>{
    if(!profile.id&&!session?.user?._id)return;
    let active=true;
    Promise.all([getTasks(),getTasks({favorites:true})]).then(([list,favorites])=>{if(active){setAll(list);setSaved(favorites);setError('');}})
      .catch(()=>{if(active)setError('Could not load your profile listings. Reopen this tab to retry.');});
    return()=>{active=false;};
  },[profile.id,session?.user?._id]));
  return <ScrollView style={s.page} contentContainerStyle={s.content}>
    <Text style={s.heading}>Student Profile</Text>
    <Text style={s.info}>{session?.user?.name || profile.name}</Text>
    {!session&&<><Text style={s.help}>Local profile on this device. Switch profiles to try the student/provider request flow offline.</Text>
      <Pressable accessibilityRole="button" onPress={()=>router.push('/profiles')}><Text style={s.info}>Switch local profile</Text></Pressable></>}
    <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={()=>router.push('/notifications')}>
      <Text style={s.info}>Notifications / {unreadCount} unread</Text>
    </Pressable>
    <Text style={s.help}>Offer your skills and hire other students with the same account.</Text>
    <AppearanceSelector/>
    {!!error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Text style={s.info}>My services: {all.filter(t=>t.is_mine).length}</Text>
    {!session&&<Text style={s.info}>Saved services: {saved.length}</Text>}
    <Pressable accessibilityRole="button" onPress={()=>{if(session){signOut();router.replace('/home');}else router.push('/auth');}}>
      <Text style={s.info}>{session?'Sign out':'Sign in / Register'}</Text>
    </Pressable>
    {!session&&<><Text style={s.heading}>Saved services</Text>{saved.map(t=><TaskCard key={t.id} task={t}/>)}
      {!saved.length&&<Text style={s.text}>Save a service from its details page to find it here.</Text>}</>}
  </ScrollView>;
}
const createStyles=colors=>StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},content:{padding:20,width:'100%',maxWidth:820,alignSelf:'center',paddingBottom:40},
  heading:{fontSize:22,fontWeight:'800',marginBottom:14,color:colors.text},help:{color:colors.muted,lineHeight:22,marginBottom:18},
  info:{padding:14,backgroundColor:colors.surface,marginBottom:10,borderRadius:10,color:colors.text},
  text:{color:colors.text},error:{color:colors.danger,lineHeight:22},
});
