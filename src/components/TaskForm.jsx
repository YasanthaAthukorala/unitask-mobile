import { useLocalProfile } from '../context/LocalProfileProvider';
import { useTheme, useThemeStyles } from '../theme/ThemeProvider';
import { getSession } from '../services/api';
import { useState } from 'react';
import { ScrollView, Text, TextInput, Pressable, StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { categories } from '../constants/theme';
import { listingTypes, priceUnits } from '../constants/services';
import { validateService } from '../utils/serviceDetails';

export default function TaskForm({ title: heading, initial = undefined, submitLabel, onSubmit }) {
  const {colors,scheme}=useTheme();
  const s=useThemeStyles(createStyles);
  const {profile}=useLocalProfile();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'Education');
  const [budget, setBudget] = useState(initial?.budget != null ? String(initial.budget) : '');
  const [listingType, setListingType] = useState(initial?.listingType ?? 'Service');
  const [priceUnit, setPriceUnit] = useState(initial?.priceUnit ?? 'Per project');
  const [availability, setAvailability] = useState(initial?.availability ?? '');
  const [providerName, setProviderName] = useState(initial?.student_name ?? getSession()?.user?.name ?? profile.name);
  const [contactEmail, setContactEmail] = useState(initial?.contactEmail ?? getSession()?.user?.email ?? profile.email);
  const [contactPhone, setContactPhone] = useState(initial?.contactPhone ?? '');
  const [saving, setSaving] = useState(false), [error, setError] = useState('');

  async function save() {
    if (saving) return;
    setError('');
    try {
      const values = validateService({ title, description, category, budget, listingType, priceUnit,
        availability, student_name: providerName, contactEmail, contactPhone });
      setSaving(true);
      await onSubmit(values);
    } catch (e) {
      setError(e.message || 'Could not save your service. Please try again.');
    } finally { setSaving(false); }
  }
  const choices = (values, selected, onChange) => <View style={s.choices}>{values.map(value =>
    <Pressable accessibilityRole="button" accessibilityState={{selected:selected === value}} key={value}
      disabled={saving} style={[s.chip, selected === value && s.selected]} onPress={() => onChange(value)}>
      <Text style={{color:selected === value ? colors.onPrimary : colors.text}}>{value}</Text>
    </Pressable>)}</View>;
  const input = (label, value, setter, options = {}) => <>
    <Text style={s.label}>{label}</Text>
    <TextInput placeholderTextColor={colors.muted} selectionColor={colors.primary} keyboardAppearance={scheme} accessibilityLabel={label} placeholder={label} value={value} onChangeText={value => {setError('');setter(value);}}
      editable={!saving} style={s.input} {...options}/>
  </>;
  return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.heading}>{heading}</Text>
      <Text style={s.help}>Turn your skills into income. Offer a paid service, course or class to fellow students.</Text>
      {input('Service or course title', title, setTitle, {maxLength:120})}
      {input('What you offer', description, setDescription, {multiline:true, maxLength:4000, style:[s.input,s.description]})}
      <Text style={s.label}>Listing type</Text>{choices(listingTypes, listingType, setListingType)}
      <Text style={s.label}>Category</Text>
      {choices([...new Set([...categories.filter(c => c !== 'All'),category])], category, setCategory)}
      {input('Price in LKR', budget, setBudget, {keyboardType:'decimal-pad',maxLength:12})}
      <Text style={s.label}>Price unit</Text>{choices(priceUnits, priceUnit, setPriceUnit)}
      {input('Availability (optional)', availability, setAvailability, {maxLength:160})}
      <Text style={s.help}>For example: weekday evenings, online or on campus. Agree on the schedule before booking.</Text>
      <Text style={s.section}>Provider contact details</Text>
      <Text style={s.help}>These details appear on your listing so students can contact you about your offer.</Text>
      {input('Provider name', providerName, setProviderName, {maxLength:80,autoComplete:'name'})}
      {input('Contact email', contactEmail, setContactEmail, {autoCapitalize:'none',autoCorrect:false,keyboardType:'email-address',autoComplete:'email',maxLength:254})}
      {input('Sri Lankan phone number', contactPhone, setContactPhone, {keyboardType:'phone-pad',autoComplete:'tel',maxLength:30})}
      <Text style={s.help}>Use 0771234567 or +94771234567. Sri Lankan landlines are accepted too.</Text>
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      <Pressable accessibilityRole="button" style={[s.button,saving && {opacity:0.6}]} onPress={save} disabled={saving}>
        <Text style={s.buttonText}>{saving ? 'Saving...' : submitLabel}</Text>
      </Pressable>
    </ScrollView>
  </KeyboardAvoidingView>;
}
const createStyles=colors=>StyleSheet.create({
  bodyText:{color:colors.text},
  page:{flex:1,backgroundColor:colors.background},
  content:{padding:20,width:'100%',maxWidth:760,alignSelf:'center',paddingBottom:48},
  heading:{fontSize:24,fontWeight:'800',marginBottom:12,color:colors.text},
  section:{fontSize:19,fontWeight:'700',color:colors.text,marginTop:18,marginBottom:10},
  help:{color:colors.muted,lineHeight:21,marginBottom:18},
  label:{marginBottom:8,fontWeight:'700',color:colors.text},
  input:{color:colors.text,backgroundColor:colors.surface,padding:14,borderRadius:12,marginBottom:16,borderWidth:1,borderColor:colors.border,minHeight:48},
  description:{height:112,textAlignVertical:'top'},
  choices:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:20},
  chip:{padding:12,backgroundColor:colors.chip,borderRadius:20,minHeight:44,justifyContent:'center'},
  selected:{backgroundColor:colors.primary},
  error:{color:colors.danger,lineHeight:22,marginBottom:12},
  button:{backgroundColor:colors.primary,padding:16,borderRadius:12,alignItems:'center',marginTop:8,minHeight:50},
  buttonText:{color:colors.onPrimary,fontWeight:'700'},
});
