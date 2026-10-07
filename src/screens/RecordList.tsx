import React, { useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { C, STATUS } from '../theme';
import { Btn, Card, Chips, Empty, PromptModal, SheetModal, s } from '../components/UI';
import { useStore } from '../store';
import { fmtDate, isSettled, money, outstanding, parseAmount, todayISO } from '../utils';
import { Kind, PersonRecord } from '../types';

export default function RecordList({ route, navigation }: any) {
  const kind: Kind = route.params.kind;
  const b = kind === 'borrowed';
  const { data, settle, deleteRecord, addPayment } = useStore();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('All');
  const [payFor, setPayFor] = useState<PersonRecord | null>(null);
  const [history, setHistory] = useState<string | null>(null);
  const color = b ? C.borrowed : C.lent;
  const list = data[kind].filter(r => (filter === 'All' || r.status === filter) &&
    (!q || `${r.person} ${r.amount} ${r.notes}`.toLowerCase().includes(q.toLowerCase())));
  const pending = data[kind].reduce((sum, r) => sum + outstanding(r), 0);
  const hist = history ? data[kind].filter(r => r.person.toLowerCase() === history.toLowerCase()) : [];

  const del = (r: PersonRecord) => Alert.alert('Delete this record?', `${r.person} — ${money(r.amount)}`, [
    { text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteRecord(kind, r.id) }]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FlatList
        data={list} keyExtractor={r => r.id} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListHeaderComponent={<>
          <Card style={{ borderColor: color }}>
            <Text style={{ color: C.muted }}>{b ? 'You still owe' : 'Still to receive'}</Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color }}>{money(pending)}</Text>
          </Card>
          <TextInput style={[s.input, { marginBottom: 10 }]} placeholder="Search name, amount or notes" placeholderTextColor={C.muted} value={q} onChangeText={setQ} />
          <View style={{ marginBottom: 12 }}><Chips items={['All', ...STATUS[kind]]} value={filter} onChange={setFilter} color={color} /></View>
        </>}
        ListEmptyComponent={<Empty text={`No records yet. Tap Add to create one.`} />}
        renderItem={({ item: r }) => {
          const done = isSettled(kind, r), overdue = !done && r.dueDate && r.dueDate < todayISO();
          return (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Pressable onPress={() => setHistory(r.person)} style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: C.ink }}>{r.person}</Text>
                  {!!r.phone && <Text style={{ color: C.muted }}>{r.phone}</Text>}
                </Pressable>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color }}>{money(r.amount)}</Text>
                  <Text style={{ color: done ? C.income : overdue ? C.danger : C.muted, fontWeight: '600' }}>{overdue ? `${r.status} · overdue` : r.status}</Text>
                </View>
              </View>
              <Text style={{ color: C.muted, marginTop: 6 }}>{fmtDate(r.date)} → {fmtDate(r.dueDate)}{r.paid > 0 && !done ? `  ·  ${money(r.paid)} ${b ? 'paid' : 'returned'}, ${money(outstanding(r))} left` : ''}</Text>
              {!!r.notes && <Text style={{ color: C.ink, marginTop: 4 }}>{r.notes}</Text>}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {!done && <Btn title={b ? 'Mark as settled' : 'Mark as returned'} onPress={() => settle(kind, r.id)} style={{ paddingVertical: 8, paddingHorizontal: 12 }} />}
                {!done && <Btn title={b ? 'Add payment' : 'Add return'} kind="ghost" onPress={() => setPayFor(r)} style={{ paddingVertical: 8, paddingHorizontal: 12 }} />}
                <Btn title="Edit" kind="ghost" onPress={() => navigation.navigate('RecordForm', { kind, id: r.id })} style={{ paddingVertical: 8, paddingHorizontal: 12 }} />
                <Btn title="Delete" kind="danger" onPress={() => del(r)} style={{ paddingVertical: 8, paddingHorizontal: 12 }} />
              </View>
            </Card>
          );
        }}
      />
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
        <Btn title={b ? 'Add borrowed money' : 'Add lent money'} onPress={() => navigation.navigate('RecordForm', { kind })} style={{ backgroundColor: color, borderColor: color }} />
      </View>
      <PromptModal visible={!!payFor} title={b ? `Payment to ${payFor?.person}` : `Return from ${payFor?.person}`} keyboardType="decimal-pad" confirm="Add"
        onCancel={() => setPayFor(null)}
        onSubmit={v => { const a = parseAmount(v); if (a > 0 && payFor) addPayment(kind, payFor.id, a); setPayFor(null); }} />
      <SheetModal visible={!!history} title={`${b ? 'Borrow' : 'Lending'} history: ${history}`} onClose={() => setHistory(null)}>
        <Text style={{ color: C.muted, marginBottom: 8 }}>Total {money(hist.reduce((x, r) => x + r.amount, 0))}  ·  Outstanding {money(hist.reduce((x, r) => x + outstanding(r), 0))}</Text>
        {hist.map(r => (
          <View key={r.id} style={{ paddingVertical: 10, borderTopWidth: 1, borderColor: C.line }}>
            <Text style={{ color: C.ink, fontWeight: '600' }}>{money(r.amount)} · {r.status}</Text>
            <Text style={{ color: C.muted }}>{fmtDate(r.date)} → {fmtDate(r.dueDate)}{r.paid ? ` · ${money(r.paid)} ${b ? 'paid' : 'returned'}` : ''}</Text>
          </View>
        ))}
      </SheetModal>
    </View>
  );
}
