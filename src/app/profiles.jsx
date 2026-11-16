import { useState } from 'react';
import { ScrollView,View,Text,TextInput,Pressable,StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useLocalProfile } from '../context/LocalProfileProvider';
import { useTheme,useThemeStyles } from '../theme/ThemeProvider';
import { useSession } from '../services/useSession';
export default function Profiles(){
  const {profile,profiles,selectProfile,addProfile}=useLocalProfile(),session=useSession();
  const {colors,scheme}=useTheme(),s=useThemeStyles(createStyles);
  const [name,setName]=useState(''),[email,setEmail]=useState(''),[phone,setPhone]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function choose(id){
    if(busy)return;setBusy(true);setError('');
    try{await selectProfile(id);router.replace('/profile');}catch(e){setError(e.message);}finally{setBusy(false);}
  }
  async function create(){
    if(busy)return;setBusy(true);setError('');
    try{await addProfile({name,email,phone});router.replace('/profile');}catch(e){setError(e.message);}finally{setBusy(false);}
  }
  if(session)return <View style={s.content}><Text style={s.text}>Sign out of your online account to use local demo profiles.</Text></View>;
  return <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <Text style={s.title}>Local profiles</Text>
    <Text style={s.help}>Use Me and Student profiles on this device to try sending and receiving requests offline. These profiles are for this device, not online sign-in accounts.</Text>
    <Text style={s.section}>Create a local profile</Text>
    <TextInput accessibilityLabel="Profile name" placeholder="Name" value={name} onChangeText={setName} maxLength={80} editable={!busy} style={s.input} placeholderTextColor={colors.muted} selectionColor={colors.primary} keyboardAppearance={scheme}/>
    <TextInput accessibilityLabel="Profile email" placeholder="Email" value={email} onChangeText={setEmail} maxLength={254} autoCapitalize="none" keyboardType="email-address" editable={!busy} style={s.input} placeholderTextColor={colors.muted} selectionColor={colors.primary} keyboardAppearance={scheme}/>
    <TextInput accessibilityLabel="Profile phone" placeholder="Sri Lankan phone (optional)" value={phone} onChangeText={setPhone} maxLength={30} keyboardType="phone-pad" editable={!busy} style={s.input} placeholderTextColor={colors.muted} selectionColor={colors.primary} keyboardAppearance={scheme}/>
    <Pressable accessibilityRole="button" disabled={busy} onPress={create} style={s.button}><Text style={s.onButton}>{busy?'Please wait...':'Create local profile'}</Text></Pressable>
    {!!error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Text style={s.section}>Switch profile</Text>
    {profiles.map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityLabel={'Use '+item.name}
      disabled={busy||profile?.id===item.id} onPress={()=>choose(item.id)} style={s.profile}>
      <Text style={s.name}>{item.name}{profile?.id===item.id?' (active)':''}</Text>
      {!!item.email&&<Text style={s.help}>{item.email}</Text>}
    </Pressable>)}
  </ScrollView>;
}
const createStyles=colors=>StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},content:{padding:20,width:'100%',maxWidth:760,alignSelf:'center',paddingBottom:40},
  title:{fontSize:26,fontWeight:'800',color:colors.text,marginBottom:12},text:{color:colors.text},
  help:{color:colors.muted,lineHeight:22,marginBottom:12},section:{fontSize:20,fontWeight:'700',color:colors.text,marginTop:20,marginBottom:14},
  input:{backgroundColor:colors.surface,color:colors.text,padding:14,borderRadius:12,borderWidth:1,borderColor:colors.border,marginBottom:12,minHeight:48},
  button:{backgroundColor:colors.primary,borderRadius:12,padding:16,alignItems:'center'},onButton:{color:colors.onPrimary,fontWeight:'700'},
  profile:{padding:16,borderRadius:12,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,marginBottom:10},
  name:{color:colors.text,fontWeight:'700',marginBottom:6},error:{color:colors.danger,lineHeight:22,marginTop:12},
});
