import React, { useLayoutEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { C } from '../theme';
import { Card, Chips, H } from '../components/UI';
import { BarChart, DetailLine } from '../components/Charts';
import { useStore } from '../store';
import { FilterMode, expenseBuckets, fmtDate, isSettled, money, outstanding, totals } from '../utils';

const Stat = ({ label, value, color, onPress, wide }: { label: string; value: number; color: string; onPress?: () => void; wide?: boolean }) => (
  <Pressable onPress={onPress} style={{ width: wide ? '100%' : '48.5%', backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.line, borderLeftWidth: 5, borderLeftColor: color }}>
    <Text style={{ color: C.muted, fontSize: 13 }}>{label}</Text>
    <Text style={{ color: C.ink, fontSize: 20, fontWeight: '800', marginTop: 4 }} numberOfLines={1} adjustsFontSizeToFit>{money(value)}</Text>
  </Pressable>
);

export default function Home({ navigation }: any) {
  const { data, busy } = useStore();
  const [mode, setMode] = useState<FilterMode>('Day');
  const [sel, setSel] = useState<number | null>(null);
  const [fab, setFab] = useState(false);
  const t = totals(data);
  const buckets = expenseBuckets(data.transactions, mode);
  const recent = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  const settled = [...data.borrowed.map(r => ({ r, k: 'borrowed' })), ...data.lent.map(r => ({ r, k: 'lent' }))]
    .filter(x => isSettled(x.k as any, x.r)).slice(0, 4);

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => (
      <View style={{ flexDirection: 'row', gap: 16 }}>
        {[['Search', 'Search'], ['Reports', 'Reports'], ['Settings', 'Settings']].map(([l, r]) => (
          <Pressable key={r} onPress={() => navigation.navigate(r)}><Text style={{ color: C.accent, fontWeight: '700' }}>{l}</Text></Pressable>))}
      </View>) });
  }, [navigation]);

  const go = (screen: string, params?: any) => { setFab(false); navigation.navigate(screen, params); };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 130 }} onScrollBeginDrag={() => setFab(false)}>
        {busy && <Text style={{ color: C.muted, textAlign: 'center', marginBottom: 6 }}>Saving to Excel…</Text>}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <Stat label="Total expense" value={t.expense} color={C.expense} wide />
          <Stat label="Amount borrowed" value={t.borrowedOut} color={C.borrowed} onPress={() => navigation.navigate('RecordList', { kind: 'borrowed' })} />
          <Stat label="Amount lent" value={t.lentOut} color={C.lent} onPress={() => navigation.navigate('RecordList', { kind: 'lent' })} />
        </View>

        <Card>
          <H>Expense analytics</H>
          <Chips items={['Day', 'Week', 'Month', 'Year']} value={mode} onChange={v => { setMode(v as FilterMode); setSel(null); }} />
          <View style={{ marginTop: 8 }}>
            <BarChart data={buckets} selected={sel} onSelect={i => setSel(sel === i ? null : i)} />
            <DetailLine d={sel != null ? buckets[sel] : null} />
          </View>
          <Text style={{ color: C.muted, textAlign: 'center', marginTop: 4, fontSize: 12 }}>
            {mode === 'Day' ? 'This week, by day' : mode === 'Week' ? 'This month, by week' : mode === 'Month' ? 'This year, by month' : 'Last 5 years'}
          </Text>
        </Card>

        <Card>
          <H>Recent transactions</H>
          {recent.length === 0 && <Text style={{ color: C.muted }}>Nothing yet. Tap + to add your first entry.</Text>}
          {recent.map(x => (
            <Pressable key={x.id} onPress={() => navigation.navigate('TransactionForm', { id: x.id })} style={{ flexDirection: 'row', paddingVertical: 10, borderTopWidth: 1, borderColor: C.line }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.ink, fontWeight: '600' }}>{x.category}{x.description ? ` · ${x.description}` : ''}</Text>
                <Text style={{ color: C.muted, fontSize: 12 }}>{fmtDate(x.date)} · {x.type}</Text>
              </View>
              <Text style={{ fontWeight: '800', color: x.type === 'Income' ? C.income : C.expense }}>{x.type === 'Income' ? '+' : '−'}{money(x.amount)}</Text>
            </Pressable>
          ))}
        </Card>

        <Card>
          <H>Borrow and lend</H>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate('RecordList', { kind: 'borrowed' })}>
              <Text style={{ color: C.muted }}>Pending borrowed</Text><Text style={{ color: C.borrowed, fontSize: 19, fontWeight: '800' }}>{money(t.borrowedOut)}</Text>
            </Pressable>
            <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate('RecordList', { kind: 'lent' })}>
              <Text style={{ color: C.muted }}>Pending lent</Text><Text style={{ color: C.lent, fontSize: 19, fontWeight: '800' }}>{money(t.lentOut)}</Text>
            </Pressable>
          </View>
          <Text style={{ color: C.ink, fontWeight: '700', marginTop: 14, marginBottom: 4 }}>Recently settled</Text>
          {settled.length === 0 && <Text style={{ color: C.muted }}>No settled records yet.</Text>}
          {settled.map(({ r, k }) => (
            <Text key={r.id} style={{ color: C.muted, paddingVertical: 2 }}>{r.person} · {money(r.amount)} · {k === 'borrowed' ? 'you paid back' : 'returned to you'}</Text>
          ))}
        </Card>
      </ScrollView>

      {fab && <Pressable onPress={() => setFab(false)} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.25)' }} />}
      <View style={{ position: 'absolute', right: 18, bottom: 22, alignItems: 'flex-end' }}>
        {fab && [
          ['Add expense', C.expense, () => go('TransactionForm', { type: 'Expense' })],
          ['Add income', C.income, () => go('TransactionForm', { type: 'Income' })],
          ['Add borrowed money', C.borrowed, () => go('RecordForm', { kind: 'borrowed' })],
          ['Add lent money', C.lent, () => go('RecordForm', { kind: 'lent' })],
        ].map(([label, color, fn]: any) => (
          <Pressable key={label} onPress={fn} style={{ backgroundColor: color, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 24, marginBottom: 10, elevation: 4 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{label}</Text>
          </Pressable>))}
        <Pressable onPress={() => setFab(!fab)} style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', elevation: 6 }}>
          <Text style={{ color: '#fff', fontSize: 34, marginTop: -2, transform: [{ rotate: fab ? '45deg' : '0deg' }] }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}
