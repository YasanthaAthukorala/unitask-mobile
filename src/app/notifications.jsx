import { useCallback,useState } from 'react';
import { ScrollView,View,Text,Pressable,StyleSheet } from 'react-native';
import { useFocusEffect,router,Link } from 'expo-router';
import { useInbox } from '../context/InboxProvider';
import { useSession } from '../services/useSession';
import { useLocalProfile } from '../context/LocalProfileProvider';
import { useThemeStyles } from '../theme/ThemeProvider';
import { isValidEmail,normalizeSriLankanPhone } from '../utils/serviceDetails';
export default function Notifications(){
  const {notifications,unreadCount,refresh,markRead,error,loaded}=useInbox(),session=useSession(),{profile}=useLocalProfile();
  const s=useThemeStyles(createStyles),[busy,setBusy]=useState(false),[actionError,setActionError]=useState('');
  useFocusEffect(useCallback(()=>{refresh();},[refresh]));
  async function read(id=undefined){
    if(busy)return;setBusy(true);setActionError('');
    try{await markRead(id);}catch(e){setActionError(e.message);}finally{setBusy(false);}
  }
  async function open(item){
    await read(item._id);
    if(item.task?._id)router.push({pathname:'/task/[id]',params:{id:String(item.task._id)}});
  }
  return <ScrollView style={s.page} contentContainerStyle={s.content}>
    <Text style={s.heading}>Notifications</Text>
    <Text style={s.help}>For {session?.user?.name || profile.name} / {unreadCount} unread</Text>
    {!session&&<Text style={s.help}>Local inbox on this device.</Text>}
    {!!(error||actionError)&&<Text accessibilityRole="alert" style={s.error}>{actionError||error}</Text>}
    <View style={s.actions}>
      <Pressable accessibilityRole="button" disabled={busy} onPress={()=>refresh()}><Text style={s.link}>Refresh notifications</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={busy||!unreadCount} onPress={()=>read()}><Text style={s.link}>Mark all as read</Text></Pressable>
    </View>
    {!loaded?<Text style={s.text}>Loading notifications...</Text>:!notifications.length&&<Text style={s.text}>No notifications yet.</Text>}
    {notifications.map(item=>{
      const sender=item.relatedUser,email=sender?.email || '',phone=normalizeSriLankanPhone(sender?.phone);
      return <View key={item._id} style={[s.item,!item.read&&s.unread]}>
        <Text style={s.message}>{item.message}</Text>
        {!!item.note&&<Text style={s.text}>{item.note}</Text>}
        {!!sender?.name&&<Text style={s.meta}>From {sender.name}</Text>}
        {isValidEmail(email)&&<Link href={`mailto:${encodeURIComponent(email)}`} style={s.link} accessibilityLabel={'Email '+sender.name}>{email}</Link>}
        {!!phone&&<Link href={`tel:${phone}`} style={s.link} accessibilityLabel={'Call '+sender.name}>{phone}</Link>}
        <Text style={s.meta}>{new Date(item.createdAt).toLocaleString()} / {item.read?'Read':'Unread'}</Text>
        <View style={s.actions}>
          {!item.read&&<Pressable accessibilityRole="button" disabled={busy} onPress={()=>read(item._id)}><Text style={s.link}>Mark as read</Text></Pressable>}
          {item.task?._id?<Pressable accessibilityRole="button" disabled={busy} onPress={()=>open(item)}><Text style={s.link}>View service</Text></Pressable>:<Text style={s.meta}>Listing removed</Text>}
        </View>
      </View>;
    })}
  </ScrollView>;
}
const createStyles=colors=>StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},content:{padding:20,maxWidth:760,width:'100%',alignSelf:'center',paddingBottom:40},
  heading:{fontSize:28,fontWeight:'800',color:colors.text,marginBottom:14},help:{color:colors.muted,lineHeight:22,marginBottom:12},
  text:{color:colors.text,lineHeight:23},message:{fontWeight:'700',color:colors.text,lineHeight:24,marginBottom:10},
  error:{color:colors.danger,lineHeight:22},link:{color:colors.primary,paddingVertical:14,fontWeight:'700'},
  actions:{flexDirection:'row',flexWrap:'wrap',gap:20},item:{padding:18,backgroundColor:colors.surface,borderRadius:14,marginBottom:14,borderWidth:1,borderColor:colors.border},
  unread:{backgroundColor:colors.primarySurface},meta:{marginTop:8,color:colors.muted,lineHeight:21},
});
