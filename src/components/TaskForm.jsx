import { getSession } from '../services/api';
import { useState } from 'react';
import { ScrollView, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { categories, colors } from '../constants/theme';
import { notify } from '../utils/dialog';

// Empty is allowed (deadline is optional); otherwise must be a real YYYY-MM-DD date.
export function isValidDate(s) {
  if (!s) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export default function TaskForm({ title: heading, initial = undefined, submitLabel, onSubmit }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'Education');
  const [budget, setBudget] = useState(initial?.budget != null ? String(initial.budget) : '');
  const [deadline, setDeadline] = useState(initial?.deadline ?? '');
  const [contactEmail,setContactEmail]=useState(initial?.contactEmail || '');
  const [contactPhone,setContactPhone]=useState(initial?.contactPhone || '');
  const [saving, setSaving] = useState(false);

  async function save() {
    const b = Number(budget);
    if (!title.trim() || !description.trim() || !budget.trim() || !Number.isFinite(b) || b <= 0) {
      notify('Validation', 'Enter title, description and a valid budget');
      return;
    }
    if (!isValidDate(deadline.trim())) {
      notify('Validation', 'Deadline must be a real date in YYYY-MM-DD format (or leave it empty)');
      return;
    }
    if(getSession() && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim()) || !/^\+94\d{9}$/.test(contactPhone.trim()))){notify('Contact details','Enter a valid email and Sri Lankan phone (+94 followed by 9 digits).');return;}
    if(saving)return;
    setSaving(true);
    try {
      await onSubmit({ title, description, category, budget, deadline, contactEmail, contactPhone });
    } catch (e) {
      notify('Error', String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={s.page} contentContainerStyle={{ padding: 18 }} keyboardShouldPersistTaps="handled">
      <Text style={s.heading}>{heading}</Text>
      <TextInput style={s.input} placeholder="Task title" value={title} onChangeText={setTitle} />
      <TextInput style={[s.input, { height: 100, textAlignVertical: 'top' }]} multiline placeholder="Description" value={description} onChangeText={setDescription} />
      <Text style={s.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
        {categories.filter((c) => c !== 'All').map((c) => (
          <Pressable key={c} style={[s.chip, category === c && { backgroundColor: colors.primary }]} onPress={() => setCategory(c)}>
            <Text style={{ color: category === c ? 'white' : colors.text }}>{c}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <TextInput style={s.input} placeholder="Budget in LKR" keyboardType="numeric" value={budget} onChangeText={setBudget} />
      <TextInput style={s.input} placeholder="Deadline (YYYY-MM-DD)" value={deadline} onChangeText={setDeadline} autoCapitalize="none" />
      {getSession() && <><TextInput accessibilityLabel="Contact email" style={s.input} placeholder="Contact email" autoCapitalize="none" keyboardType="email-address" value={contactEmail} onChangeText={setContactEmail}/><TextInput accessibilityLabel="Contact phone" style={s.input} placeholder="Phone (+94771234567)" keyboardType="phone-pad" value={contactPhone} onChangeText={setContactPhone}/></>}
      <Pressable style={[s.button, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
        <Text style={s.buttonText}>{submitLabel}</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { backgroundColor: colors.background },
  heading: { fontSize: 22, fontWeight: '800', marginBottom: 18, color: colors.text },
  input: { backgroundColor: 'white', padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  label: { marginBottom: 8, fontWeight: '700' },
  chip: { padding: 10, backgroundColor: '#E8E8F0', borderRadius: 20, marginRight: 8 },
  button: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  buttonText: { color: 'white', fontWeight: '700' },
});


