import { AppData, Kind, PersonRecord, Transaction } from './types';
import { CURRENCY, STATUS } from './theme';

export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parseISO = (s: string) => { const [y, m, d] = (s || isoDate(new Date())).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
export const todayISO = () => isoDate(new Date());
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const startOfWeek = (d: Date) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const wd = (x.getDay() + 6) % 7; return addDays(x, -wd); };
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const fmtDate = (s: string) => { if (!s) return '—'; const d = parseISO(s); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
export const money = (n: number) => `${CURRENCY}${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const parseAmount = (s: string) => { const n = parseFloat(String(s).replace(/,/g, '')); return isNaN(n) ? 0 : n; };

export function statusFor(kind: Kind, amount: number, paid: number) {
  const [pending, partial, done] = STATUS[kind];
  if (paid >= amount && amount > 0) return done;
  return paid > 0 ? partial : pending;
}
export const isSettled = (kind: Kind, r: PersonRecord) => r.status === STATUS[kind][2];
export const outstanding = (r: PersonRecord) => Math.max(r.amount - r.paid, 0);

export function totals(d: AppData) {
  const income = d.transactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
  const expense = d.transactions.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
  const borrowedOut = d.borrowed.reduce((s, r) => s + outstanding(r), 0);
  const lentOut = d.lent.reduce((s, r) => s + outstanding(r), 0);
  // Borrowing brings cash in, lending sends cash out; repayments net against these.
  return { income, expense, borrowedOut, lentOut, balance: income - expense + borrowedOut - lentOut };
}

export const sumBetween = (txs: Transaction[], from: string, to: string, type = 'Expense') =>
  txs.filter(t => t.type === type && t.date >= from && t.date <= to).reduce((s, t) => s + t.amount, 0);

export type FilterMode = 'Day' | 'Week' | 'Month' | 'Year';
export interface Bucket { label: string; value: number; detail: string; }

export function expenseBuckets(txs: Transaction[], mode: FilterMode, now = new Date()): Bucket[] {
  if (mode === 'Day') {
    const s = startOfWeek(now);
    return DAYS.map((l, i) => { const d = isoDate(addDays(s, i)); return { label: l, value: sumBetween(txs, d, d), detail: fmtDate(d) }; });
  }
  if (mode === 'Week') {
    const y = now.getFullYear(), m = now.getMonth(), dim = new Date(y, m + 1, 0).getDate();
    return Array.from({ length: Math.ceil(dim / 7) }, (_, k) => {
      const a = 1 + k * 7, b = Math.min(a + 6, dim);
      return { label: `W${k + 1}`, value: sumBetween(txs, isoDate(new Date(y, m, a)), isoDate(new Date(y, m, b))), detail: `${a}–${b} ${MONTHS[m]} ${y}` };
    });
  }
  if (mode === 'Month') {
    const y = now.getFullYear();
    return MONTHS.map((l, m) => ({ label: l, value: sumBetween(txs, isoDate(new Date(y, m, 1)), isoDate(new Date(y, m + 1, 0))), detail: `${l} ${y}` }));
  }
  const y = now.getFullYear();
  return Array.from({ length: 5 }, (_, i) => { const yy = y - 4 + i; return { label: String(yy), value: sumBetween(txs, `${yy}-01-01`, `${yy}-12-31`), detail: `Year ${yy}` }; });
}

export function byCategory(txs: Transaction[], from: string, to: string) {
  const map: Record<string, number> = {};
  txs.filter(t => t.type === 'Expense' && t.date >= from && t.date <= to).forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
  return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export type Preset = 'All' | 'Today' | 'This Week' | 'This Month' | 'Custom';
export function rangeFor(p: Preset, from: string, to: string): [string, string] {
  const now = new Date();
  if (p === 'Today') return [todayISO(), todayISO()];
  if (p === 'This Week') { const s = startOfWeek(now); return [isoDate(s), isoDate(addDays(s, 6))]; }
  if (p === 'This Month') return [isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))];
  if (p === 'Custom') return [from, to];
  return ['0000-01-01', '9999-12-31'];
}
