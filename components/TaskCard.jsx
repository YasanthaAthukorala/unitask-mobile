import { Pressable, Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../constants/theme';
export default function TaskCard({ task }) { return <Pressable style={styles.card} onPress={()=>router.push({pathname:'/task/[id]',params:{id:String(task.id)}})}>
  <Text style={styles.title}>{task.title}</Text>
  <Text style={styles.meta}>{task.category}  •  {task.status}</Text>
  <Text style={styles.description} numberOfLines={2}>{task.description}</Text>
  <View style={styles.row}><Text style={styles.price}>Rs. {task.budget.toLocaleString()}</Text><Text>{task.is_favorite ? '★' : '☆'}</Text></View>
</Pressable>; }
const styles=StyleSheet.create({card:{backgroundColor:colors.surface,padding:16,borderRadius:14,marginBottom:12,borderWidth:1,borderColor:colors.border},title:{fontSize:17,fontWeight:'700',color:colors.text},meta:{color:colors.muted,marginTop:5},description:{marginVertical:10,color:colors.text},row:{flexDirection:'row',justifyContent:'space-between'},price:{fontWeight:'700',color:colors.primary}});
