import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { getTasks } from '../../database/taskRepository';
import TaskCard from '../../components/TaskCard';
import { colors } from '../../constants/theme';
export default function Home() {
 const [tasks,setTasks]=useState([]);
 useFocusEffect(useCallback(()=>{getTasks().then(setTasks).catch(console.error);},[]));
 const completed=tasks.filter(t=>t.status==='Completed').length;
 return <ScrollView style={s.page} contentContainerStyle={{padding:18}}>
  <Text style={s.heading}>Welcome to UniTask 👋</Text><Text style={s.sub}>Your offline campus task marketplace</Text>
  <View style={s.stats}><Text style={s.stat}>Total Tasks: {tasks.length}</Text><Text style={s.stat}>Completed: {completed}</Text></View>
  <Pressable style={s.button} onPress={()=>router.push('/(tabs)/explore')}><Text style={s.buttonText}>Explore All Tasks</Text></Pressable>
  <Text style={s.heading}>Recent Tasks</Text>{tasks.slice(0,5).map(t=><TaskCard key={t.id} task={t}/>)}
 </ScrollView>;
}
const s=StyleSheet.create({page:{backgroundColor:colors.background},heading:{fontSize:22,fontWeight:'800',color:colors.text,marginBottom:10},sub:{color:colors.muted,marginBottom:18},stats:{backgroundColor:'#EAE8FF',padding:20,borderRadius:14,marginBottom:16},stat:{fontSize:17,marginBottom:5},button:{backgroundColor:colors.primary,padding:15,borderRadius:12,alignItems:'center',marginBottom:24},buttonText:{color:'white',fontWeight:'700'}});
