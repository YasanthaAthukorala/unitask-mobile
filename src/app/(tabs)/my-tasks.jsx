import { useCallback, useState } from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { useFocusEffect, Link } from 'expo-router';
import { getTasks } from '../../database/taskRepository';
import TaskCard from '../../components/TaskCard';
import { colors } from '../../constants/theme';
export default function MyTasks() {
  const [tasks,setTasks]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  useFocusEffect(useCallback(() => {
    let active=true;setLoading(true);
    getTasks({mine:true}).then(result => {if(active){setTasks(result);setError('');}})
      .catch(() => {if(active)setError('Could not load your services. Reopen this tab to retry.');})
      .finally(() => {if(active)setLoading(false);});
    return () => {active=false;};
  },[]));
  return <ScrollView style={s.page} contentContainerStyle={s.content}>
    <Text style={s.heading}>My Services</Text>
    <Text style={s.help}>Manage the skills, courses and classes you offer.</Text>
    {!!error && <Text accessibilityRole="alert">{error}</Text>}
    {loading ? <Text>Loading your services...</Text> : tasks.length ? tasks.map(t => <TaskCard key={t.id} task={t}/>) :
      <><Text>No services yet. Share a skill using the Offer tab.</Text><Link href="/create" style={s.link}>Offer a service</Link></>}
  </ScrollView>;
}
const s=StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},
  content:{padding:20,width:'100%',maxWidth:820,alignSelf:'center',paddingBottom:40},
  heading:{fontSize:24,fontWeight:'800',marginBottom:12,color:colors.text},help:{color:colors.muted,lineHeight:22,marginBottom:20},
  link:{paddingVertical:18,color:colors.primary,fontWeight:'700'},
});
