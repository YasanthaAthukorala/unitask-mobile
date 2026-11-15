import { useTheme, useThemeStyles } from '../../theme/ThemeProvider';
import { useCallback, useState } from 'react';
import { ScrollView, Text, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useFocusEffect, router, Link } from 'expo-router';
import { getTask, toggleFavorite, changeStatus, deleteTask } from '../../database/taskRepository';
import { getSession, request } from '../../services/api';
import { formatPrice } from '../../constants/services';
import { normalizeSriLankanPhone, isValidEmail } from '../../utils/serviceDetails';
import { confirmAction } from '../../utils/dialog';

export default function TaskDetails() {
  const {colors,scheme}=useTheme();
  const s=useThemeStyles(createStyles);
  const {id}=useLocalSearchParams();
  const [task,setTask]=useState(undefined), [error,setError]=useState(''), [busy,setBusy]=useState(false);
  const [stars,setStars]=useState('5'), [comment,setComment]=useState('');
  const load=useCallback(() => {
    let active=true;
    setTask(undefined);
    getTask(id).then(t => {if(active){setTask(t ?? null);setError('');}})
      .catch(e => {if(active){setError(e.message);setTask(null);}});
    return () => {active=false;};
  },[id]);
  useFocusEffect(load);
  async function action(work) {
    if(busy) return;
    setBusy(true);setError('');
    try {await work();setTask(await getTask(id));}
    catch(e){setError(e.message);}
    finally{setBusy(false);}
  }
  const button=(label,onPress,danger=false) => <Pressable accessibilityRole="button" disabled={busy}
    style={[s.button,danger && {backgroundColor:colors.dangerButton},busy && {opacity:0.5}]} onPress={onPress}>
    <Text style={[s.white,danger && {color:colors.onDanger}]}>{label}</Text>
  </Pressable>;
  const phone=normalizeSriLankanPhone(task?.contactPhone);
  const email=task?.contactEmail?.trim() || '';
  return <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    {!!error && <Text accessibilityRole="alert" style={{color:colors.danger}}>{error}</Text>}
    {task===undefined ? <Text style={s.bodyText}>Loading service...</Text> : !task ? <>
      <Text style={s.bodyText}>Service unavailable.</Text>{button('Retry',load)}
      {button('Back to campus',() => router.replace('/home'))}
    </> : <>
      <Text style={s.meta}>{task.category} / {task.listingType || 'Service'} / {task.status}</Text>
      <Text style={s.title}>{task.title}</Text>
      <Text style={s.price}>{formatPrice(task)}</Text>
      <Text style={s.body}>{task.description}</Text>
      <Text style={s.section}>Availability</Text>
      <Text style={s.body}>{task.availability || 'Contact the provider to agree on a schedule.'}</Text>
      <View style={s.contact}>
        <Text style={s.section}>Meet your provider</Text>
        <Text style={s.provider}>{task.student_name}</Text>
        <Text style={s.hint}>Discuss the class, course or service and confirm availability before booking.</Text>
        {!!phone && <><Text selectable style={s.body}>{phone}</Text>
          <Link href={`tel:${phone}`} accessibilityLabel="Call provider" style={s.contactLink}>Call provider</Link></>}
        {isValidEmail(email) && <><Text selectable style={s.body}>{email}</Text>
          <Link href={`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Enquiry: ' + task.title)}`}
            accessibilityLabel="Email provider" style={s.contactLink}>Email provider</Link></>}
        {!phone && !isValidEmail(email) && <Text style={s.hint}>Contact details have not been added to this listing yet.</Text>}
      </View>
      {!getSession() && button(task.is_favorite ? 'Remove favorite' : 'Save to favorites',() => action(() => toggleFavorite(id,task.is_favorite)))}
      {getSession() && !task.is_mine && task.status==='Available' && button('Hire this service',() =>
        confirmAction('Hire service','Confirm booking this campus service?','Hire',() => action(() => request(`/api/tasks/${id}/hire`,{method:'POST'}))))}
      {getSession() && <>
        <Text style={s.meta}>Rating: {task.averageRating || 0} / 5 ({task.ratingCount || 0} reviews)</Text>
        {(task.ratings || []).map(r => <Text key={r._id} style={s.body}>{r.user?.name || 'Student'}: {r.stars}/5 - {r.comment}</Text>)}
      </>}
      {getSession() && !task.is_mine && task.status==='Completed' && <>
        <Text style={s.section}>Your review (1-5 stars)</Text>
        <TextInput placeholderTextColor={colors.muted} selectionColor={colors.primary} keyboardAppearance={scheme} accessibilityLabel="Stars" style={s.input} keyboardType="numeric" value={stars} onChangeText={setStars}/>
        <TextInput placeholderTextColor={colors.muted} selectionColor={colors.primary} keyboardAppearance={scheme} accessibilityLabel="Review comment" style={s.input} placeholder="Optional comment" maxLength={300} value={comment} onChangeText={setComment}/>
        {button('Submit review',() => {
          if(!/^[1-5]$/.test(stars)){setError('Choose a whole number from 1 to 5.');return;}
          action(() => request(`/api/tasks/${id}/rate`,{method:'POST',body:JSON.stringify({stars:Number(stars),comment})}));
        })}
      </>}
      {!!task.is_mine && <>
        <Text style={s.section}>Manage your service</Text>
        {button('Edit service',() => router.push({pathname:'/edit-task/[id]',params:{id:String(task.id)}}))}
        <Text style={s.meta}>Booking status</Text>
        {['Available','Hired','In Progress','Completed'].map(status => <Pressable accessibilityRole="button"
          key={status} disabled={busy || task.status===status}
          style={[s.button,task.status===status && {backgroundColor:colors.successButton}]}
          onPress={() => action(() => changeStatus(id,status))}><Text style={[s.white,task.status===status && {color:colors.onSuccess}]}>{status}</Text></Pressable>)}
        {button('Delete my service',() => confirmAction('Delete service','This permanently removes your listing.','Delete',() =>
          action(async () => {await deleteTask(id);router.replace('/my-tasks');})),true)}
      </>}
    </>}
  </ScrollView>;
}
const createStyles=colors=>StyleSheet.create({
  bodyText:{color:colors.text},error:{color:colors.danger,lineHeight:22},
  page:{flex:1,backgroundColor:colors.background},content:{padding:24,width:'100%',maxWidth:760,alignSelf:'center',paddingBottom:48},
  title:{fontSize:28,fontWeight:'800',color:colors.text,marginTop:12},
  meta:{color:colors.muted,marginTop:16,lineHeight:22},
  price:{fontSize:24,color:colors.primary,fontWeight:'800',marginVertical:22},
  body:{fontSize:16,lineHeight:25,marginVertical:8,color:colors.text},
  section:{fontSize:20,fontWeight:'700',color:colors.text,marginTop:20,marginBottom:8},
  contact:{backgroundColor:colors.surface,padding:20,borderRadius:18,borderWidth:1,borderColor:colors.border,marginVertical:16},
  provider:{fontSize:20,fontWeight:'700',color:colors.primary,marginVertical:8},
  hint:{color:colors.muted,lineHeight:22,marginVertical:8},
  contactLink:{color:colors.primary,fontWeight:'700',fontSize:16,paddingVertical:14},
  button:{backgroundColor:colors.primary,padding:16,borderRadius:12,marginTop:12,alignItems:'center',minHeight:48},
  white:{color:colors.onPrimary,fontWeight:'700'},
  input:{color:colors.text,padding:14,borderWidth:1,borderColor:colors.border,borderRadius:12,marginTop:12,backgroundColor:colors.surface},
});
