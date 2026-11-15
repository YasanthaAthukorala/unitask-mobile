import { useCallback, useState } from 'react';
import { ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import { getTask, toggleFavorite, changeStatus, deleteTask } from '../../database/taskRepository';
import { colors } from '../../constants/theme';
import { notify, confirmAction } from '../../utils/dialog';
export default function TaskDetails(){const {id}=useLocalSearchParams();const [task,setTask]=useState(undefined); // undefined = loading, null = not found
 const load=useCallback(()=>{getTask(id).then(t=>setTask(t??null)).catch(e=>notify('Error',String(e)))},[id]);useFocusEffect(load);
 if(task===undefined)return <Text style={{padding:20}}>Loading task...</Text>;
 if(task===null)return <Text style={{padding:20}}>Task not found.</Text>;
 async function favorite(){await toggleFavorite(id,task.is_favorite);load();}
 async function status(value){await changeStatus(id,value);load();}
 function remove(){confirmAction('Delete task','Are you sure?','Delete',async()=>{await deleteTask(id);router.back()});}
 return <ScrollView style={s.page} contentContainerStyle={{padding:20}}><Text style={s.title}>{task.title}</Text><Text style={s.meta}>{task.category} • {task.status}</Text><Text style={s.price}>Rs. {task.budget.toLocaleString()}</Text><Text style={s.body}>{task.description}</Text><Text style={s.meta}>Student: {task.student_name}</Text><Text style={s.meta}>Deadline: {task.deadline||'Not specified'}</Text>
 <Pressable style={s.button} onPress={favorite}><Text style={s.buttonText}>{task.is_favorite?'★ Remove Favorite':'☆ Add to Favorites'}</Text></Pressable>
 {task.is_mine===1&&<><Pressable style={s.button} onPress={()=>router.push({pathname:'/edit-task/[id]',params:{id:String(task.id)}})}><Text style={s.buttonText}>✎ Edit Task</Text></Pressable><Text style={s.label}>Change Task Status</Text>{['Available','Hired','In Progress','Completed'].map(st=><Pressable key={st} style={[s.button,{backgroundColor:task.status===st?'#21835B':colors.primary}]} onPress={()=>status(st)}><Text style={s.buttonText}>{st}</Text></Pressable>)}<Pressable style={[s.button,{backgroundColor:colors.danger}]} onPress={remove}><Text style={s.buttonText}>Delete My Task</Text></Pressable></>}
 </ScrollView>;
}
const s=StyleSheet.create({page:{backgroundColor:colors.background},title:{fontSize:26,fontWeight:'800',color:colors.text},meta:{color:colors.muted,marginTop:10},price:{fontSize:22,color:colors.primary,fontWeight:'800',marginVertical:18},body:{fontSize:16,lineHeight:24},button:{backgroundColor:colors.primary,padding:14,borderRadius:12,marginTop:12,alignItems:'center'},buttonText:{color:'white',fontWeight:'700'},label:{fontWeight:'700',marginTop:22}});
