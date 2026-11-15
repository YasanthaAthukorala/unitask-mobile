import { useCallback, useState } from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getTasks } from '../../database/taskRepository';
import TaskCard from '../../components/TaskCard';
import { colors } from '../../constants/theme';
export default function Profile(){const [all,setAll]=useState([]),[saved,setSaved]=useState([]);useFocusEffect(useCallback(()=>{getTasks().then(setAll).catch(console.error);getTasks({favorites:true}).then(setSaved).catch(console.error)},[]));return <ScrollView style={s.page} contentContainerStyle={{padding:18}}><Text style={s.heading}>Student Profile</Text><Text style={s.info}>Local demo user: Me</Text><Text style={s.info}>My tasks: {all.filter(t=>t.is_mine).length}</Text><Text style={s.info}>Saved tasks: {saved.length}</Text><Text style={s.heading}>Favorites</Text>{saved.map(t=><TaskCard key={t.id} task={t}/>)}{!saved.length&&<Text>Tap the star on a task detail page to save it.</Text>}</ScrollView>}
const s=StyleSheet.create({page:{backgroundColor:colors.background},heading:{fontSize:22,fontWeight:'800',marginBottom:14},info:{padding:12,backgroundColor:'white',marginBottom:8,borderRadius:10}});
