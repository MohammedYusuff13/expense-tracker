import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';
import { AppData, PersonRecord, Transaction } from './types';
import { totals, statusFor, uid } from './utils';

const SAF = FileSystem.StorageAccessFramework;
const B64 = { encoding: FileSystem.EncodingType.Base64 };
export const MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const SHEETS = { tx: 'Transactions', bo: 'Borrowed Money', le: 'Lent Money', su: 'Summary' };

export const emptyData = (): AppData => ({ transactions: [], borrowed: [], lent: [] });

const cellDate = (v: any): string => {
  if (v === '' || v == null) return '';
  if (typeof v === 'number') { const d = new Date(Math.round((v - 25569) * 86400000)); return d.toISOString().slice(0, 10); }
  return String(v).slice(0, 10);
};
const num = (v: any) => { const n = parseFloat(String(v).replace(/,/g, '')); return isNaN(n) ? 0 : n; };

function buildWorkbook(d: AppData): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const add = (name: string, rows: any[][], widths: number[]) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = widths.map(wch => ({ wch }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  };
  add(SHEETS.tx,
    [['Transaction ID', 'Date', 'Category', 'Description', 'Amount', 'Transaction Type', 'Payment Method'],
      ...d.transactions.map(t => [t.id, t.date, t.category, t.description, t.amount, t.type, t.paymentMethod])],
    [14, 12, 16, 30, 12, 16, 16]);
  const rec = (r: PersonRecord) => [r.person, r.amount, r.date, r.dueDate, r.status, r.notes, r.phone, r.paid, r.id];
  add(SHEETS.bo,
    [['Person Name', 'Amount', 'Borrow Date', 'Due Date', 'Status', 'Notes', 'Phone Number', 'Amount Paid', 'Record ID'], ...d.borrowed.map(rec)],
    [20, 12, 14, 14, 16, 30, 16, 14, 14]);
  add(SHEETS.le,
    [['Person Name', 'Amount', 'Date Given', 'Expected Return Date', 'Status', 'Notes', 'Phone Number', 'Amount Returned', 'Record ID'], ...d.lent.map(rec)],
    [20, 12, 14, 20, 18, 30, 16, 16, 14]);
  const t = totals(d);
  add(SHEETS.su,
    [['Total Income', 'Total Expense', 'Outstanding Borrowed Amount', 'Outstanding Lent Amount', 'Available Balance'],
      [t.income, t.expense, t.borrowedOut, t.lentOut, t.balance]],
    [16, 16, 28, 24, 18]);
  return wb;
}

function parseWorkbook(wb: XLSX.WorkBook): AppData {
  const rows = (name: string): any[] => (wb.Sheets[name] ? XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' }) : []);
  const transactions: Transaction[] = rows(SHEETS.tx).filter(r => r['Amount'] !== '').map(r => ({
    id: String(r['Transaction ID'] || uid()), date: cellDate(r['Date']), category: String(r['Category']), description: String(r['Description']),
    amount: num(r['Amount']), type: r['Transaction Type'] === 'Income' ? 'Income' : 'Expense', paymentMethod: String(r['Payment Method'] || ''),
  }));
  const people = (name: string, kind: 'borrowed' | 'lent', dateCol: string, dueCol: string, paidCol: string): PersonRecord[] =>
    rows(name).filter(r => r['Person Name'] !== '').map(r => {
      const amount = num(r['Amount']);
      const status = String(r['Status'] || '');
      let paid = num(r[paidCol]);
      if (!paid && /settled|returned/i.test(status) && !/partial/i.test(status)) paid = amount; // status edited by hand in Excel
      return {
        id: String(r['Record ID'] || uid()), person: String(r['Person Name']), amount, date: cellDate(r[dateCol]), dueDate: cellDate(r[dueCol]),
        status: statusFor(kind, amount, paid), notes: String(r['Notes']), phone: String(r['Phone Number'] || ''), paid,
      };
    });
  return {
    transactions,
    borrowed: people(SHEETS.bo, 'borrowed', 'Borrow Date', 'Due Date', 'Amount Paid'),
    lent: people(SHEETS.le, 'lent', 'Date Given', 'Expected Return Date', 'Amount Returned'),
  };
}

export async function readData(uri: string): Promise<AppData> {
  const b64 = await FileSystem.readAsStringAsync(uri, B64);
  if (!b64) return emptyData();
  const wb = XLSX.read(b64, { type: 'base64' });
  if (!wb.SheetNames.length) return emptyData();
  return parseWorkbook(wb);
}

export async function writeData(uri: string, d: AppData) {
  const b64 = XLSX.write(buildWorkbook(d), { type: 'base64', bookType: 'xlsx' });
  await FileSystem.writeAsStringAsync(uri, b64, B64);
}

export async function pickFolder(): Promise<string | null> {
  const p = await SAF.requestDirectoryPermissionsAsync();
  return p.granted ? p.directoryUri : null;
}
export const nameOf = (uri: string) => decodeURIComponent(uri).split(/[/:]/).pop() || uri;

export async function listXlsx(dirUri: string): Promise<{ uri: string; name: string }[]> {
  const all = await SAF.readDirectoryAsync(dirUri);
  return all.map(uri => ({ uri, name: nameOf(uri) })).filter(f => /\.xlsx$/i.test(f.name));
}

/** Creates a new workbook in the folder. If a file with that name already exists, it is reused. */
export async function createWorkbook(dirUri: string, baseName: string): Promise<{ uri: string; name: string }> {
  const clean = baseName.replace(/\.xlsx$/i, '').replace(/[\\/:*?"<>|]/g, '_').trim() || 'ExpenseTracker_Pro';
  const existing = (await listXlsx(dirUri)).find(f => f.name.toLowerCase() === `${clean}.xlsx`.toLowerCase());
  if (existing) return existing;
  const uri = await SAF.createFileAsync(dirUri, clean, MIME);
  await writeData(uri, emptyData());
  return { uri, name: nameOf(uri) };
}

export async function backupTo(dirUri: string, data: AppData) {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
  const uri = await SAF.createFileAsync(dirUri, `ExpenseTracker_Backup_${stamp}`, MIME);
  await writeData(uri, data);
  return nameOf(uri);
}
