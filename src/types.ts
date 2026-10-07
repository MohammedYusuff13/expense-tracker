export type TxType = 'Expense' | 'Income';
export interface Transaction { id: string; date: string; category: string; description: string; amount: number; type: TxType; paymentMethod: string; }
export type Kind = 'borrowed' | 'lent';
export interface PersonRecord { id: string; person: string; amount: number; date: string; dueDate: string; status: string; notes: string; phone: string; paid: number; }
export interface AppData { transactions: Transaction[]; borrowed: PersonRecord[]; lent: PersonRecord[]; }
export interface Config { fileUri: string; fileName: string; }
export interface Prefs { dueReminders: boolean; dailyReminder: boolean; }
