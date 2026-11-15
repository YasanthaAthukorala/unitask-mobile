import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, Pressable } from 'react-native';
import { initializeDatabase } from '../database/database';
import { colors } from '../constants/theme';
export default function RootLayout() {
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;initializeDatabase().then(()=>{if(active)setReady(true)}).catch(()=>{if(active)setError('Local storage could not start. Please retry.')});return()=>{active=false};},[attempt]);
 if(!ready)return <View style={s.loading}>{error?<><Text>{error}</Text><Pressable accessibilityRole="button" onPress={()=>{setError('');setAttempt(a=>a+1)}} style={s.retry}><Text style={{color:'white'}}>Retry</Text></Pressable></>:<><ActivityIndicator size="large" color={colors.primary}/><Text style={{marginTop:16}}>Opening your campus...</Text></>}</View>;
 return <Stack id={undefined} screenOptions={{headerShown:false,contentStyle:{backgroundColor:colors.background}}}><Stack.Screen name="index"/><Stack.Screen name="(tabs)"/><Stack.Screen name="task/[id]" options={{headerShown:true,title:'Task details'}}/><Stack.Screen name="edit-task/[id]" options={{headerShown:true,title:'Edit task'}}/></Stack>;
}
const s=StyleSheet.create({loading:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:colors.background,padding:24},retry:{backgroundColor:colors.primary,padding:14,borderRadius:12,marginTop:16}});

