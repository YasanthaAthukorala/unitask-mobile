import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
const icons = {home:'home-outline',explore:'search-outline',create:'add-circle-outline','my-tasks':'list-outline',profile:'person-outline'};
export default function TabsLayout() {
  const {colors} = useTheme();
  return <Tabs id={undefined} screenOptions={({route}) => ({
    tabBarActiveTintColor:colors.primary,tabBarInactiveTintColor:colors.muted,headerShown:route.name!=='home',
    tabBarStyle:{backgroundColor:colors.surface,height:72,paddingBottom:10,paddingTop:8,borderTopColor:colors.border},
    headerStyle:{backgroundColor:colors.surface},headerTintColor:colors.text,
    sceneStyle:{backgroundColor:colors.background},
    tabBarIcon:({color,size}) => <Ionicons name={icons[route.name]} color={String(color)} size={size}/>,
  })}>
    <Tabs.Screen name="home" options={{title:'Home'}}/>
    <Tabs.Screen name="explore" options={{title:'Browse'}}/>
    <Tabs.Screen name="create" options={{title:'Offer',headerTitle:'Offer a service'}}/>
    <Tabs.Screen name="my-tasks" options={{title:'My Services'}}/>
    <Tabs.Screen name="profile" options={{title:'Profile'}}/>
  </Tabs>;
}
