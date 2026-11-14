import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
const icons = {home:'home-outline',explore:'search-outline',create:'add-circle-outline','my-tasks':'list-outline',profile:'person-outline'};
export default function TabsLayout() { return <Tabs screenOptions={({route})=>({tabBarActiveTintColor:colors.primary,headerStyle:{backgroundColor:colors.surface},tabBarIcon:({color,size})=><Ionicons name={icons[route.name]} color={color} size={size}/>})}>
  <Tabs.Screen name="home" options={{title:'Home'}} />
  <Tabs.Screen name="explore" options={{title:'Explore'}} />
  <Tabs.Screen name="create" options={{title:'Create'}} />
  <Tabs.Screen name="my-tasks" options={{title:'My Tasks'}} />
  <Tabs.Screen name="profile" options={{title:'Profile'}} />
</Tabs>; }
