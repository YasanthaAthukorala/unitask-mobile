import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { getTasks } from '../../database/taskRepository';
import TaskCard from '../../components/TaskCard';
import { categories, colors } from '../../constants/theme';
export default function Explore() {
 const params=useLocalSearchParams();
 const [search,setSearch]=useState(''); const [category,setCategory]=useState('All'); const [tasks,setTasks]=useState([]);
 useEffect(()=>{if(categories.includes(String(params.category)))setCategory(String(params.category));},[params.category]);
 // 'active' flag stops an older, slower query from overwriting newer results
 useFocusEffect(useCallback(()=>{let active=true;getTasks({search,category}).then(r=>{if(active)setTasks(r)}).catch(console.error);return()=>{active=false};},[search,category]));
 return <View style={s.page}><TextInput placeholder="Search tasks..." value={search} onChangeText={setSearch} style={s.input}/>
 <ScrollView horizontal style={{flexGrow:0}} showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingVertical:10}}>{categories.map(c=><Pressable key={c} onPress={()=>setCategory(c)} style={[s.chip,category===c&&s.selected]}><Text style={{color:category===c?'white':colors.text}}>{c}</Text></Pressable>)}</ScrollView>
 <Text style={s.count}>{tasks.length} tasks found</Text><ScrollView>{tasks.map(t=><TaskCard key={t.id} task={t}/>)}{tasks.length===0&&<Text>No matching tasks.</Text>}</ScrollView></View>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:colors.background,padding:16},input:{backgroundColor:'white',borderRadius:12,padding:14,borderWidth:1,borderColor:colors.border},chip:{paddingHorizontal:14,paddingVertical:9,borderRadius:20,backgroundColor:'#E8E8F0',marginRight:8},selected:{backgroundColor:colors.primary},count:{color:colors.muted,marginVertical:10}});

