import { useEffect,useRef,useState } from 'react';
import { View,Text,TextInput,Pressable,StyleSheet } from 'react-native';
import { getInterestState,sendInterest } from '../database/notificationRepository';
import { useLocalProfile } from '../context/LocalProfileProvider';
import { useInbox } from '../context/InboxProvider';
import { useSession } from '../services/useSession';
import { useTheme,useThemeStyles } from '../theme/ThemeProvider';
export default function InterestRequest({service}){
  const {profile}=useLocalProfile(),session=useSession(),{refresh}=useInbox();
  const {colors,scheme}=useTheme(),s=useThemeStyles(createStyles);
  const [message,setMessage]=useState(''),[state,setState]=useState({sent:false,loaded:false,error:''}),[sending,setSending]=useState(false);
  const inFlight=useRef(false),identity=session?.user?._id || profile.id;
  useEffect(()=>{
    let active=true;
    getInterestState(service.id).then(result=>{if(active)setState({sent:result.sent,loaded:true,error:''});})
      .catch(()=>{if(active)setState({sent:false,loaded:true,error:'Could not check earlier requests. You can try sending again.'});});
    return()=>{active=false;};
  },[service.id,identity]);
  async function send(){
    if(inFlight.current||state.sent)return;
    inFlight.current=true;setSending(true);
    try{
      await sendInterest(service.id,message);
      setState({sent:true,loaded:true,error:''});setMessage('');await refresh();
    }catch(e){setState(old=>({...old,error:e.message}));}
    finally{inFlight.current=false;setSending(false);}
  }
  const label=service.listingType==='Course'?'Request course':service.listingType==='Class'?'Request class':"I'm interested";
  return <View style={s.panel}>
    <Text style={s.title}>Interested in this {service.listingType==='Service'?'service':service.listingType?.toLowerCase() || 'service'}?</Text>
    {state.sent ? <Text accessibilityLiveRegion="polite" aria-live="polite" style={s.success}>Request sent to {service.student_name}. Wait for the provider to confirm the arrangements.</Text> : service.status!=='Available' ?
      <Text style={s.help}>This provider is not accepting requests for this listing right now.</Text> : <>
      <Text style={s.help}>Send the provider your name and saved contact details, with an optional message. Sending a request does not charge you or confirm a booking.</Text>
      {!session&&<Text style={s.help}>Offline demo: this request stays on this device. Switch to the provider&apos;s local profile to see it.</Text>}
      <TextInput accessibilityLabel="Interest message" placeholder="Tell the provider what you would like to learn or book (optional)"
        value={message} onChangeText={setMessage} maxLength={500} multiline editable={!sending}
        style={s.input} placeholderTextColor={colors.muted} selectionColor={colors.primary} keyboardAppearance={scheme}/>
      <Pressable accessibilityRole="button" disabled={sending||!state.loaded} onPress={send} style={[s.button,(sending||!state.loaded)&&{opacity:0.6}]}>
        <Text style={s.onButton}>{sending?'Sending request...':label}</Text>
      </Pressable>
    </>}
    {!!state.error&&<Text accessibilityRole="alert" style={s.error}>{state.error}</Text>}
  </View>;
}
const createStyles=colors=>StyleSheet.create({
  panel:{padding:20,borderRadius:16,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,marginBottom:16},
  title:{fontSize:20,fontWeight:'700',color:colors.text,marginBottom:12},help:{color:colors.muted,lineHeight:22,marginBottom:12},
  input:{color:colors.text,backgroundColor:colors.background,borderColor:colors.border,borderWidth:1,borderRadius:12,padding:14,minHeight:100,textAlignVertical:'top',marginBottom:12},
  button:{backgroundColor:colors.primary,padding:16,borderRadius:12,alignItems:'center',minHeight:48},onButton:{color:colors.onPrimary,fontWeight:'700'},
  error:{color:colors.danger,lineHeight:22,marginTop:10},success:{color:colors.success,lineHeight:24},
});
