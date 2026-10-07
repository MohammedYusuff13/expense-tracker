import React, { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { C } from '../theme';
import { Chips, DateField, Empty, s } from '../components/UI';
import { useStore } from '../store';
import { Preset, fmtDate, money, rangeFor, todayISO } from '../utils';

export default function Search({ navigation }: any) {
  const { data } = useStore();
  const [q, setQ] = useState('');
  const [preset, setPreset] = useState<Preset>('All');
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [lo, hi] = rangeFor(preset, from, to);

  const rows = [
    ...data.transactions.map(t => ({ id: t.id, date: t.date, title: `${t.category}${t.description ? ` · ${t.description}` : ''}`, sub: t.type, amount: t.amount, color: t.type === 'Income' ? C.income : C.expense, hay: `${t.category} ${t.description} ${t.amount}`, go: () => navigation.navigate('TransactionForm', { id: t.id }) })),
    ...data.borrowed.map(r => ({ id: r.id, date: r.date, title: r.person, sub: `Borrowed · ${r.status}`, amount: r.amount, color: C.borrowed, hay: `${r.person} ${r.notes} ${r.amount}`, go: () => navigation.navigate('RecordForm', { kind: 'borrowed', id: r.id }) })),
    ...data.lent.map(r => ({ id: r.id, date: r.date, title: r.person, sub: `Lent · ${r.status}`, amount: r.amount, color: C.lent, hay: `${r.person} ${r.notes} ${r.amount}`, go: () => navigation.navigate('RecordForm', { kind: 'lent', id: r.id }) })),
  ].filter(x => x.date >= lo && x.date <= hi && (!q || x.hay.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FlatList data={rows} keyExtractor={r => r.id} contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<>
          <TextInput style={[s.input, { marginBottom: 10 }]} placeholder="Search person, amount, category or notes" placeholderTextColor={C.muted} value={q} onChangeText={setQ} />
          <Chips items={['All', 'Today', 'This Week', 'This Month', 'Custom']} value={preset} onChange={v => setPreset(v as Preset)} />
          {preset === 'Custom' && <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}><DateField label="From" value={from} onChange={setFrom} /><DateField label="To" value={to} onChange={setTo} /></View>}
          <Text style={{ color: C.muted, marginVertical: 10 }}>{rows.length} result{rows.length === 1 ? '' : 's'}</Text>
        </>}
        ListEmptyComponent={<Empty text="Nothing matches. Try a different search or date range." />}
        renderItem={({ item: x }) => (
          <Pressable onPress={x.go} style={{ flexDirection: 'row', backgroundColor: C.card, padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: C.line }}>
            <View style={{ flex: 1 }}><Text style={{ color: C.ink, fontWeight: '600' }}>{x.title}</Text><Text style={{ color: C.muted, fontSize: 12 }}>{fmtDate(x.date)} · {x.sub}</Text></View>
            <Text style={{ color: x.color, fontWeight: '800' }}>{money(x.amount)}</Text>
          </Pressable>)} />
    </View>
  );
}
