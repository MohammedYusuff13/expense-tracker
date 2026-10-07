import React, { useState } from 'react';
import { Alert, ScrollView, ToastAndroid, View } from 'react-native';
import { C, EXPENSE_CATEGORIES, INCOME_SOURCES, PAYMENT_METHODS } from '../theme';
import { Btn, DateField, Field, Label, Chips } from '../components/UI';
import { useStore } from '../store';
import { parseAmount, todayISO, uid } from '../utils';
import { Transaction, TxType } from '../types';

export default function TransactionForm({ route, navigation }: any) {
  const { saveTransaction, deleteTransaction, data } = useStore();
  const editing: Transaction | undefined = route.params?.id ? data.transactions.find(t => t.id === route.params.id) : undefined;
  const type: TxType = editing?.type || route.params?.type || 'Expense';
  const isExp = type === 'Expense';
  const cats = isExp ? EXPENSE_CATEGORIES : INCOME_SOURCES;
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [category, setCategory] = useState(editing?.category || cats[0]);
  const [description, setDescription] = useState(editing?.description || '');
  const [date, setDate] = useState(editing?.date || todayISO());
  const [method, setMethod] = useState(editing?.paymentMethod || PAYMENT_METHODS[0]);

  const save = async (another: boolean) => {
    const amt = parseAmount(amount);
    if (amt <= 0) return Alert.alert('Enter an amount', 'The amount must be greater than zero.');
    const t: Transaction = { id: editing?.id || uid(), date, category, description: description.trim(), amount: amt, type, paymentMethod: isExp ? method : '' };
    try { await saveTransaction(t); } catch (e: any) { return Alert.alert('Could not save to Excel', e?.message || 'Check the file connection in Settings.'); }
    ToastAndroid.show(`${type} saved to Excel`, ToastAndroid.SHORT);
    if (another) { setAmount(''); setDescription(''); } else navigation.goBack();
  };
  const del = () => Alert.alert('Delete this entry?', 'It will be removed from your Excel file.', [
    { text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { await deleteTransaction(editing!.id); navigation.goBack(); } }]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 18 }} keyboardShouldPersistTaps="handled">
      <Field label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />
      <Label>{isExp ? 'Category' : 'Income source'}</Label>
      <View style={{ marginBottom: 14 }}><Chips items={cats} value={category} onChange={setCategory} color={isExp ? C.expense : C.income} /></View>
      <Field label="Description" value={description} onChangeText={setDescription} placeholder="Optional" />
      <DateField label="Date" value={date} onChange={setDate} />
      {isExp && <><Label>Payment method</Label><View style={{ marginBottom: 14 }}><Chips items={PAYMENT_METHODS} value={method} onChange={setMethod} /></View></>}
      <Btn title={editing ? 'Save changes' : 'Quick save'} onPress={() => save(false)} />
      {!editing && <Btn title="Save and add another" kind="ghost" onPress={() => save(true)} style={{ marginTop: 10 }} />}
      {editing && <Btn title="Delete" kind="danger" onPress={del} style={{ marginTop: 10 }} />}
    </ScrollView>
  );
}
