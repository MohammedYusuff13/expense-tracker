import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { C } from '../theme';
import { Btn, Card, Chips, H } from '../components/UI';
import { BarChart, DetailLine, LineChart, PieChart } from '../components/Charts';
import { useStore } from '../store';
import { DAYS, MONTHS, addDays, byCategory, fmtDate, isoDate, isSettled, money, outstanding, startOfWeek, sumBetween, todayISO } from '../utils';
import { Kind, PersonRecord } from '../types';

const TYPES = ['Daily', 'Weekly', 'Monthly', 'Yearly', 'By category', 'Borrowed', 'Lent'];

export default function Reports() {
  const { data } = useStore();
  const [type, setType] = useState('Monthly');
  const [offset, setOffset] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const now = new Date();
  const txs = data.transactions;

  let from = '0000-01-01', to = '9999-12-31', title = 'All time';
  let bars: { label: string; value: number; detail: string }[] = [];
  if (type === 'Daily') { const d = addDays(now, offset); from = to = isoDate(d); title = fmtDate(from); }
  if (type === 'Weekly') {
    const s = addDays(startOfWeek(now), offset * 7); from = isoDate(s); to = isoDate(addDays(s, 6)); title = `${fmtDate(from)} – ${fmtDate(to)}`;
    bars = DAYS.map((l, i) => { const d = isoDate(addDays(s, i)); return { label: l, value: sumBetween(txs, d, d), detail: fmtDate(d) }; });
  }
  if (type === 'Monthly') {
    const m = new Date(now.getFullYear(), now.getMonth() + offset, 1), dim = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    from = isoDate(m); to = isoDate(new Date(m.getFullYear(), m.getMonth(), dim)); title = `${MONTHS[m.getMonth()]} ${m.getFullYear()}`;
    bars = Array.from({ length: dim }, (_, i) => { const d = isoDate(new Date(m.getFullYear(), m.getMonth(), i + 1)); return { label: String(i + 1), value: sumBetween(txs, d, d), detail: fmtDate(d) }; });
  }
  if (type === 'Yearly') {
    const y = now.getFullYear() + offset; from = `${y}-01-01`; to = `${y}-12-31`; title = String(y);
    bars = MONTHS.map((l, m) => ({ label: l, value: sumBetween(txs, isoDate(new Date(y, m, 1)), isoDate(new Date(y, m + 1, 0))), detail: `${l} ${y}` }));
  }
  const expenses = txs.filter(t => t.type === 'Expense' && t.date >= from && t.date <= to).sort((a, b) => b.date.localeCompare(a.date));
  const total = expenses.reduce((s, t) => s + t.amount, 0);
  const cats = byCategory(txs, from, to);

  const people = (kind: Kind) => {
    const list = data[kind]; const map: Record<string, { total: number; left: number }> = {};
    list.forEach(r => { const k = r.person; map[k] = map[k] || { total: 0, left: 0 }; map[k].total += r.amount; map[k].left += outstanding(r); });
    const b = kind === 'borrowed';
    return (
      <>
        <Card><H>{b ? 'Borrowed money report' : 'Lent money report'}</H>
          <Text style={{ color: C.muted }}>Total {b ? 'borrowed' : 'lent'}: {money(list.reduce((s, r) => s + r.amount, 0))}</Text>
          <Text style={{ color: C.ink, fontWeight: '700', fontSize: 20, marginTop: 4 }}>Outstanding: {money(list.reduce((s, r) => s + outstanding(r), 0))}</Text>
          <Text style={{ color: C.muted, marginTop: 4 }}>{list.filter(r => isSettled(kind, r)).length} of {list.length} records settled</Text></Card>
        <Card><H>By person</H>
          {Object.entries(map).map(([n, v]) => (
            <View key={n} style={{ flexDirection: 'row', paddingVertical: 8, borderTopWidth: 1, borderColor: C.line }}>
              <Text style={{ flex: 1, color: C.ink }}>{n}</Text><Text style={{ color: C.muted, marginRight: 12 }}>{money(v.total)}</Text><Text style={{ color: v.left ? C.danger : C.income, fontWeight: '700' }}>{money(v.left)} left</Text>
            </View>))}
          {!list.length && <Text style={{ color: C.muted }}>No records yet.</Text>}</Card>
      </>
    );
  };

  const periodic = ['Daily', 'Weekly', 'Monthly', 'Yearly'].includes(type);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <Chips items={TYPES} value={type} onChange={v => { setType(v); setOffset(0); setSel(null); }} />
      <View style={{ height: 12 }} />
      {periodic && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Btn title="‹" kind="ghost" onPress={() => { setOffset(offset - 1); setSel(null); }} style={{ paddingHorizontal: 18 }} />
          <Text style={{ flex: 1, textAlign: 'center', color: C.ink, fontWeight: '700' }}>{title}</Text>
          <Btn title="›" kind="ghost" onPress={() => { setOffset(offset + 1); setSel(null); }} style={{ paddingHorizontal: 18 }} />
        </View>)}
      {type === 'Borrowed' && people('borrowed')}
      {type === 'Lent' && people('lent')}
      {(periodic || type === 'By category') && (
        <>
          <Card><Text style={{ color: C.muted }}>{type === 'By category' ? 'All-time expenses' : `${type} expense report`}</Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: C.expense }}>{money(total)}</Text>
            <Text style={{ color: C.muted }}>{expenses.length} transaction{expenses.length === 1 ? '' : 's'}</Text></Card>
          {bars.length > 0 && (
            <Card><H>{type === 'Monthly' ? 'Daily trend' : 'Spending by period'}</H>
              {type === 'Monthly' ? <LineChart data={bars} selected={sel} onSelect={setSel} /> : <BarChart data={bars} selected={sel} onSelect={setSel} />}
              <DetailLine d={sel != null ? bars[sel] : null} /></Card>)}
          <Card><H>Category distribution</H><PieChart data={cats} /></Card>
          {type !== 'By category' && (
            <Card><H>Transactions</H>
              {expenses.slice(0, 50).map(t => (
                <View key={t.id} style={{ flexDirection: 'row', paddingVertical: 8, borderTopWidth: 1, borderColor: C.line }}>
                  <View style={{ flex: 1 }}><Text style={{ color: C.ink }}>{t.category}{t.description ? ` · ${t.description}` : ''}</Text><Text style={{ color: C.muted, fontSize: 12 }}>{fmtDate(t.date)}</Text></View>
                  <Text style={{ color: C.expense, fontWeight: '700' }}>{money(t.amount)}</Text>
                </View>))}
              {!expenses.length && <Text style={{ color: C.muted }}>No expenses in this period.</Text>}
              {expenses.length > 50 && <Text style={{ color: C.muted, marginTop: 8 }}>Showing the latest 50. The Excel file has everything.</Text>}</Card>)}
        </>)}
    </ScrollView>
  );
}
