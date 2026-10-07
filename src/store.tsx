import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, Config, Kind, PersonRecord, Prefs, Transaction } from './types';
import { emptyData, nameOf, readData, writeData } from './excel';
import { rescheduleAll } from './notifications';
import { statusFor } from './utils';

interface Store {
  ready: boolean; config: Config | null; data: AppData; prefs: Prefs; busy: boolean;
  connect: (uri: string, name?: string) => Promise<void>;
  reload: () => Promise<void>;
  replaceAll: (d: AppData) => Promise<void>;
  saveTransaction: (t: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  saveRecord: (k: Kind, r: PersonRecord) => Promise<void>;
  deleteRecord: (k: Kind, id: string) => Promise<void>;
  addPayment: (k: Kind, id: string, amount: number) => Promise<void>;
  settle: (k: Kind, id: string) => Promise<void>;
  setPrefs: (p: Prefs) => Promise<void>;
}
const Ctx = createContext<Store>(null as any);
export const useStore = () => useContext(Ctx);
const CFG = 'etp.config', PREFS = 'etp.prefs';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);
  const [data, setData] = useState<AppData>(emptyData());
  const [prefs, setPrefsState] = useState<Prefs>({ dueReminders: true, dailyReminder: true });
  const queue = useRef<Promise<any>>(Promise.resolve());
  const ref = useRef({ config, data, prefs });
  ref.current = { config, data, prefs };

  useEffect(() => {
    (async () => {
      try {
        const p = await AsyncStorage.getItem(PREFS); if (p) setPrefsState(JSON.parse(p));
        const c = await AsyncStorage.getItem(CFG);
        if (c) {
          const cfg: Config = JSON.parse(c);
          try { const d = await readData(cfg.fileUri); setConfig(cfg); setData(d); rescheduleAll(d, p ? JSON.parse(p) : ref.current.prefs); }
          catch { await AsyncStorage.removeItem(CFG); } // file moved or permission lost: back to setup
        }
      } finally { setReady(true); }
    })();
  }, []);

  // Applies a change locally, then writes the whole workbook. Writes are serialised so they cannot interleave.
  const commit = useCallback(async (next: AppData) => {
    setData(next);
    const cfg = ref.current.config; if (!cfg) return;
    queue.current = queue.current.then(() => writeData(cfg.fileUri, next));
    setBusy(true);
    try { await queue.current; rescheduleAll(next, ref.current.prefs); } finally { setBusy(false); }
  }, []);

  const connect = async (uri: string, name?: string) => {
    const d = await readData(uri);
    await writeData(uri, d); // makes sure all four sheets exist
    const cfg = { fileUri: uri, fileName: name || nameOf(uri) };
    await AsyncStorage.setItem(CFG, JSON.stringify(cfg));
    ref.current.config = cfg; setConfig(cfg); setData(d); rescheduleAll(d, ref.current.prefs);
  };
  const reload = async () => { if (config) { const d = await readData(config.fileUri); setData(d); rescheduleAll(d, prefs); } };
  const upsert = <T extends { id: string }>(list: T[], item: T) => list.some(x => x.id === item.id) ? list.map(x => x.id === item.id ? item : x) : [item, ...list];
  const fix = (k: Kind, r: PersonRecord): PersonRecord => ({ ...r, paid: Math.min(r.paid, r.amount), status: statusFor(k, r.amount, r.paid) });

  const store: Store = {
    ready, config, data, prefs, busy, connect, reload,
    replaceAll: commit,
    saveTransaction: t => commit({ ...data, transactions: upsert(data.transactions, t) }),
    deleteTransaction: id => commit({ ...data, transactions: data.transactions.filter(t => t.id !== id) }),
    saveRecord: (k, r) => commit({ ...data, [k]: upsert(data[k], fix(k, r)) }),
    deleteRecord: (k, id) => commit({ ...data, [k]: data[k].filter(r => r.id !== id) }),
    addPayment: (k, id, amt) => commit({ ...data, [k]: data[k].map(r => r.id === id ? fix(k, { ...r, paid: r.paid + amt }) : r) }),
    settle: (k, id) => commit({ ...data, [k]: data[k].map(r => r.id === id ? fix(k, { ...r, paid: r.amount }) : r) }),
    setPrefs: async p => { setPrefsState(p); ref.current.prefs = p; await AsyncStorage.setItem(PREFS, JSON.stringify(p)); rescheduleAll(data, p); },
  };
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}
