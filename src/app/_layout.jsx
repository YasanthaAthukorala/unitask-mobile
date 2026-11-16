import { LocalProfileProvider,useLocalProfile } from '../context/LocalProfileProvider';
import { InboxProvider } from '../context/InboxProvider';
import { Stack } from 'expo-router';
import { ActivityIndicator, View, Text, StyleSheet, Pressable } from 'react-native';
import { AppThemeProvider, useTheme, useThemeStyles } from '../theme/ThemeProvider';

export default function RootLayout() {
  return <AppThemeProvider><LocalProfileProvider><InboxProvider><AppLayout/></InboxProvider></LocalProfileProvider></AppThemeProvider>;
}
function AppLayout() {
  const {colors,ready,error,retry} = useTheme();
  const {profile,error:profileError,retry:retryProfiles}=useLocalProfile();
  const s = useThemeStyles(createStyles);
  if (!ready || !profile) return <View style={s.loading}>
    {(error || profileError) ? <><Text style={s.text}>{error || profileError}</Text>
      <Pressable accessibilityRole="button" onPress={()=>{retry();retryProfiles();}} style={s.retry}><Text style={{color:colors.onPrimary}}>Retry</Text></Pressable>
    </> : <><ActivityIndicator size="large" color={colors.primary}/><Text style={[s.text,{marginTop:16}]}>Opening your campus...</Text></>}
  </View>;
  return <Stack id={undefined} screenOptions={{headerShown:false,contentStyle:{backgroundColor:colors.background},
    headerStyle:{backgroundColor:colors.surface},headerTintColor:colors.text}}>
    <Stack.Screen name="profiles" options={{headerShown:true,title:'Local profiles'}}/>
    <Stack.Screen name="auth" options={{headerShown:true,title:'Account'}}/>
    <Stack.Screen name="notifications" options={{headerShown:true,title:'Notifications'}}/>
    <Stack.Screen name="index"/><Stack.Screen name="(tabs)"/>
    <Stack.Screen name="task/[id]" options={{headerShown:true,title:'Service details'}}/>
    <Stack.Screen name="edit-task/[id]" options={{headerShown:true,title:'Edit service'}}/>
  </Stack>;
}
const createStyles = colors => StyleSheet.create({
  loading:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:colors.background,padding:24},
  text:{color:colors.text},retry:{backgroundColor:colors.primary,padding:14,borderRadius:12,marginTop:16},
});
