import { useTheme, useThemeStyles } from '../../theme/ThemeProvider';
import { useCallback, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Pressable } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { getTasks } from '../../database/taskRepository';
import TaskCard from '../../components/TaskCard';
import { categories } from '../../constants/theme';
import { listingTypes } from '../../constants/services';

export default function Explore() {
  const {colors,scheme}=useTheme();
  const s=useThemeStyles(createStyles);
  const params=useLocalSearchParams();
  const [search,setSearch]=useState(''),[tasks,setTasks]=useState([]),[error,setError]=useState('');
  const [loading,setLoading]=useState(true),[sort,setSort]=useState('Newest');
  const category=categories.includes(String(params.category)) ? String(params.category) : 'All';
  const listingType=listingTypes.includes(String(params.type)) ? String(params.type) : 'All';
  useFocusEffect(useCallback(() => {
    let active=true;setLoading(true);
    const timer=setTimeout(() => {
      getTasks({search,category,listingType}).then(result => {if(active){setTasks(result);setError('');}})
        .catch(e => {if(active)setError(e.message);}).finally(() => {if(active)setLoading(false);});
    },180);
    return () => {active=false;clearTimeout(timer);};
  },[search,category,listingType]));
  const sorted=[...tasks].sort((a,b) => sort==='Price: low' ? a.budget-b.budget : sort==='Price: high' ? b.budget-a.budget : 0);
  const filters=(values,selected,onChange,prefix='') => <View style={s.filters}>{values.map(value =>
    <Pressable accessibilityRole="button" accessibilityLabel={prefix + value} accessibilityState={{selected:selected===value}}
      key={value} style={[s.chip,selected===value && s.selected]} onPress={() => onChange(value)}>
      <Text style={{color:selected===value ? colors.onPrimary : colors.text}}>{value}</Text>
    </Pressable>)}</View>;
  return <View style={s.page}><FlatList data={sorted} keyExtractor={t => String(t.id)}
    contentContainerStyle={{padding:20,paddingBottom:32}} keyboardShouldPersistTaps="handled"
    renderItem={({item}) => <TaskCard task={item}/>}
    ListHeaderComponent={<>
      <Text style={s.title}>Learn a skill. Hire campus talent.</Text>
      <Text style={s.subtitle}>Discover student-led courses, classes and professional services.</Text>
      <TextInput placeholderTextColor={colors.muted} selectionColor={colors.primary} keyboardAppearance={scheme} accessibilityLabel="Search services" placeholder="Search Java, photography, design..." value={search} onChangeText={setSearch} style={s.input}/>
      <Text style={s.label}>Category</Text>{filters(categories,category,value => router.setParams({category:value}),'Category: ')}
      <Text style={s.label}>Offering</Text>{filters(['All',...listingTypes],listingType,value => router.setParams({type:value}),'Type: ')}
      <View style={s.sort}>{['Newest','Price: low','Price: high'].map(value =>
        <Pressable accessibilityRole="button" accessibilityState={{selected:sort===value}} key={value} onPress={() => setSort(value)}>
          <Text style={{color:sort===value ? colors.primary : colors.muted,paddingVertical:12,paddingHorizontal:4}}>{value}</Text>
        </Pressable>)}</View>
      <Text style={s.count} accessibilityLiveRegion="polite">{loading ? 'Finding services...' : `${tasks.length} ${tasks.length===1 ? 'service' : 'services'} found`}</Text>
      {!!error && <Text accessibilityRole="alert" style={{color:colors.danger}}>{error}</Text>}
    </>}
    ListEmptyComponent={!loading && !error ? <Text style={s.bodyText}>No matching services. Try another search or category.</Text> : null}/>
  </View>;
}
const createStyles=colors=>StyleSheet.create({
  bodyText:{color:colors.text},error:{color:colors.danger,lineHeight:22},
  page:{flex:1,backgroundColor:colors.background,width:'100%',maxWidth:820,alignSelf:'center'},
  title:{fontSize:25,fontWeight:'800',color:colors.text,marginBottom:8},
  subtitle:{color:colors.muted,marginBottom:20,lineHeight:22},
  input:{color:colors.text,backgroundColor:colors.surface,borderRadius:12,padding:14,borderWidth:1,borderColor:colors.border,minHeight:48},
  label:{fontWeight:'700',color:colors.text,marginTop:18,marginBottom:10},
  filters:{flexDirection:'row',flexWrap:'wrap',gap:8},
  chip:{paddingHorizontal:12,paddingVertical:12,borderRadius:20,backgroundColor:colors.chip,minHeight:44},
  selected:{backgroundColor:colors.primary},
  sort:{flexDirection:'row',flexWrap:'wrap',gap:12,marginTop:12},
  count:{color:colors.muted,marginVertical:14},
});
