import { useCallback, useState } from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getTasks } from '../../database/taskRepository';
import TaskCard from '../../components/TaskCard';
import { colors } from '../../constants/theme';
export default function MyTasks(){const [tasks,setTasks]=useState([]);useFocusEffect(useCallback(()=>{getTasks({mine:true}).then(setTasks).catch(console.error)},[]));return <ScrollView style={s.page} contentContainerStyle={{padding:18}}><Text style={s.heading}>My Tasks</Text>{tasks.length?tasks.map(t=><TaskCard key={t.id} task={t}/>):<Text>No tasks yet. Create one using the Create tab.</Text>}</ScrollView>}
const s=StyleSheet.create({page:{backgroundColor:colors.background},heading:{fontSize:22,fontWeight:'800',marginBottom:16}});
