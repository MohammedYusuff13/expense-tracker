import React, { useState } from 'react';
import { Alert, ScrollView, Text, ToastAndroid, View } from 'react-native';
import { C } from '../theme';
import { Btn, PromptModal, SheetModal } from '../components/UI';
import { createWorkbook, listXlsx, pickFolder } from '../excel';
import { useStore } from '../store';
import { Pressable } from 'react-native';

export default function Welcome({ navigation }: any) {
  const { connect, config } = useStore();
  const [dir, setDir] = useState<string | null>(null);
  const [askName, setAskName] = useState(false);
  const [files, setFiles] = useState<{ uri: string; name: string }[] | null>(null);
  const [busy, setBusy] = useState(false);

  const done = async (uri: string, name: string) => {
    await connect(uri, name);
    ToastAndroid.show('Excel file connected', ToastAndroid.SHORT);
    Alert.alert('Connected', `Your data is now stored in ${name}.`, [{ text: 'OK', onPress: () => navigation.canGoBack() && navigation.popToTop() }]);
  };
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); } catch (e: any) { Alert.alert('Could not connect the file', e?.message || 'Check that you gave access to the folder and try again.'); }
    setBusy(false);
  };

  const create = () => run(async () => { const d = await pickFolder(); if (d) { setDir(d); setAskName(true); } });
  const existing = () => run(async () => {
    const d = await pickFolder(); if (!d) return;
    const f = await listXlsx(d);
    if (!f.length) return Alert.alert('No Excel files found', 'That folder has no .xlsx files. Choose another folder, or create a new file.');
    setFiles(f);
  });
  const auto = () => run(async () => { const d = await pickFolder(); if (!d) return; const f = await createWorkbook(d, 'ExpenseTracker_Pro'); await done(f.uri, f.name); });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 24, paddingTop: 70 }}>
      <Text style={{ fontSize: 34, fontWeight: '800', color: C.ink }}>ExpenseTracker Pro</Text>
      <Text style={{ fontSize: 16, color: C.muted, marginTop: 10, lineHeight: 23 }}>
        Your money records live in an Excel file that you own. Choose where to keep it. The app works offline and updates the file every time you save.
      </Text>
      <View style={{ marginTop: 36, gap: 12 }}>
        <Btn title="Create new Excel file" onPress={create} disabled={busy} />
        <Btn title="Select existing Excel file" kind="ghost" onPress={existing} disabled={busy} />
        <Btn title="Select folder and create file automatically" kind="ghost" onPress={auto} disabled={busy} />
      </View>
      {config && <Text style={{ color: C.muted, marginTop: 24 }}>Currently connected: {config.fileName}</Text>}

      <PromptModal visible={askName} title="Name your Excel file" defaultValue="ExpenseTracker_Pro" confirm="Create"
        onCancel={() => setAskName(false)}
        onSubmit={v => { setAskName(false); run(async () => { const f = await createWorkbook(dir!, v); await done(f.uri, f.name); }); }} />
      <SheetModal visible={!!files} title="Choose your Excel file" onClose={() => setFiles(null)}>
        {files?.map(f => (
          <Pressable key={f.uri} onPress={() => { setFiles(null); run(() => done(f.uri, f.name)); }} style={{ paddingVertical: 14, borderBottomWidth: 1, borderColor: C.line }}>
            <Text style={{ color: C.ink, fontSize: 16 }}>{f.name}</Text>
          </Pressable>
        ))}
      </SheetModal>
    </ScrollView>
  );
}
