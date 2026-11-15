import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeStyles } from '../theme/ThemeProvider';

const choices = /** @type {const} */ ([
  {value:'system',label:'System',icon:'phone-portrait-outline'},
  {value:'light',label:'Light',icon:'sunny-outline'},
  {value:'dark',label:'Dark',icon:'moon-outline'},
]);
export default function AppearanceSelector() {
  const {colors,scheme,preference,changePreference,saving,preferenceError} = useTheme();
  const s = useThemeStyles(createStyles);
  return <View style={s.section}>
    <Text style={s.title}>Appearance</Text>
    <Text style={s.help}>Choose a look or follow your device.</Text>
    <View accessibilityRole="radiogroup" accessibilityLabel="Appearance" style={s.row}>
      {choices.map(choice => {
        const selected = preference === choice.value;
        return <Pressable key={choice.value} accessibilityRole="radio" accessibilityLabel={choice.label}
          aria-checked={selected} accessibilityState={{checked:selected,disabled:saving}} disabled={saving}
          onPress={() => changePreference(choice.value)} style={[s.choice,selected && s.selected]}>
          <Ionicons name={choice.icon} size={21} color={selected ? colors.onPrimary : colors.text}/>
          <Text style={[s.label,selected && {color:colors.onPrimary}]}>{choice.label}</Text>
        </Pressable>;
      })}
    </View>
    <Text aria-live="polite" accessibilityLiveRegion="polite" style={s.help}>{saving ? 'Saving appearance...' : `${scheme === 'dark' ? 'Dark' : 'Light'} mode active`}</Text>
    {!!preferenceError && <Text accessibilityRole="alert" style={s.error}>{preferenceError}</Text>}
  </View>;
}
const createStyles = colors => StyleSheet.create({
  section:{backgroundColor:colors.surface,borderColor:colors.border,borderWidth:1,borderRadius:16,padding:16,marginBottom:24},
  title:{fontSize:20,fontWeight:'700',color:colors.text,marginBottom:8},
  help:{color:colors.muted,lineHeight:21,marginBottom:10},
  row:{flexDirection:'row',gap:8,marginBottom:12},
  choice:{flex:1,minHeight:72,paddingVertical:12,paddingHorizontal:4,alignItems:'center',justifyContent:'center',
    backgroundColor:colors.chip,borderRadius:12,gap:8},
  selected:{backgroundColor:colors.primary},
  label:{fontWeight:'700',color:colors.text},error:{color:colors.danger,lineHeight:21},
});
