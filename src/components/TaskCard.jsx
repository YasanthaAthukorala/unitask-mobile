import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, categoryIcons } from '../constants/theme';
export default function TaskCard({ task }) {
 return <Pressable accessibilityRole="button" accessibilityLabel={`View ${task.title}`} style={({pressed})=>[s.card, pressed && {opacity:0.7}]} onPress={()=>router.push({pathname:'/task/[id]',params:{id:String(task.id)}})}>
  <View style={s.row}><View style={s.icon}><Ionicons name={categoryIcons[task.category] || 'briefcase-outline'} size={22} color={colors.primary}/></View><Text style={s.category}>{task.category}</Text><Text style={s.status}>{task.status}</Text></View>
  <Text style={s.title}>{task.title}</Text>
  <Text style={s.description} numberOfLines={2}>{task.description}</Text>
  <View style={s.row}><Text style={s.price}>Rs. {task.budget.toLocaleString()}</Text><Text style={s.student}>{task.student_name}</Text><Ionicons name={task.is_favorite?'bookmark':'chevron-forward'} size={18} color={colors.primary}/></View>
 </Pressable>;
}
const s=StyleSheet.create({card:{backgroundColor:colors.surface,padding:20,borderRadius:18,marginBottom:14,borderWidth:1,borderColor:colors.border},icon:{padding:9,backgroundColor:'#EEECFF',borderRadius:12},category:{flex:1,marginLeft:10,fontSize:12,color:colors.muted},status:{fontSize:10,color:'#21835B',backgroundColor:'#E9F7EF',padding:6,borderRadius:6},title:{fontSize:18,fontWeight:'700',color:colors.text,marginTop:14},description:{marginVertical:10,color:colors.muted,lineHeight:21},row:{flexDirection:'row',alignItems:'center',gap:8},price:{flex:1,fontSize:17,fontWeight:'800',color:colors.primary},student:{color:colors.muted,fontSize:12}});
