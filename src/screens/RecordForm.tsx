import React, { useState } from 'react';
import { Alert, ScrollView, ToastAndroid, View } from 'react-native';
import { C } from '../theme';
import { Btn, DateField, Field } from '../components/UI';
import { useStore } from '../store';
import { addDays, isoDate, parseAmount, parseISO, todayISO, uid } from '../utils';
import { Kind, PersonRecord } from '../types';

export default function RecordForm({ route, navigation }: any) {
  const kind: Kind = route.params.kind;
  const { data, saveRecord } = useStore();
  const editing = route.params.id ? data[kind].find(r => r.id === route.params.id) : undefined;
  const b = kind === 'borrowed';
  const [person, setPerson] = useState(editing?.person || '');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [date, setDate] = useState(editing?.date || todayISO());
  const [due, setDue] = useState(editing?.dueDate || isoDate(addDays(parseISO(todayISO()), 30)));
  const [phone, setPhone] = useState(editing?.phone || '');
  const [notes, setNotes] = useState(editing?.notes || '');
  const [paid, setPaid] = useState(editing ? String(editing.paid) : '0');

  const save = async () => {
    const amt = parseAmount(amount);
    if (!person.trim()) return Alert.alert('Enter a name', b ? 'Who did you borrow from?' : 'Who did you lend to?');
    if (amt <= 0) return Alert.alert('Enter an amount', 'The amount must be greater than zero.');
    const r: PersonRecord = { id: editing?.id || uid(), person: person.trim(), amount: amt, date, dueDate: due, phone: phone.trim(), notes: notes.trim(), paid: parseAmount(paid), status: '' };
    try { await saveRecord(kind, r); } catch (e: any) { return Alert.alert('Could not save to Excel', e?.message || 'Check the file connection in Settings.'); }
    ToastAndroid.show('Saved to Excel', ToastAndroid.SHORT);
    navigation.goBack();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 18 }} keyboardShouldPersistTaps="handled">
      <Field label="Person name" value={person} onChangeText={setPerson} />
      <Field label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <DateField label={b ? 'Borrow date' : 'Date given'} value={date} onChange={setDate} />
        <DateField label={b ? 'Due date' : 'Expected return date'} value={due} onChange={setDue} />
      </View>
      <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      {editing && <Field label={b ? 'Amount paid so far' : 'Amount returned so far'} value={paid} onChangeText={setPaid} keyboardType="decimal-pad" />}
      <Field label="Notes" value={notes} onChangeText={setNotes} multiline />
      <Btn title={editing ? 'Save changes' : 'Save'} onPress={save} />
    </ScrollView>
  );
}
