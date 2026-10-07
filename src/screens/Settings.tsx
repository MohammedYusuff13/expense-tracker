import React, { useState } from 'react';
import { Alert, ScrollView, Switch, Text, ToastAndroid, View, Pressable } from 'react-native';
import { C } from '../theme';
import { Btn, Card, H, SheetModal } from '../components/UI';
import { backupTo, listXlsx, pickFolder, readData } from '../excel';
import { useStore } from '../store';

export default function Settings({ navigation }: any) {
  const { config, data, prefs, setPrefs, replaceAll, reload } = useStore();
  const [files, setFiles] = useState<{ uri: string; name: string }[] | null>(null);
  const guard = async (fn: () => Promise<void>) => { try { await fn(); } catch (e: any) { Alert.alert('Something went wrong', e?.message || 'Please try again.'); } };

  const backup = () => guard(async () => {
    const d = await pickFolder(); if (!d) return;
    const name = await backupTo(d, data);
    Alert.alert('Backup saved', `Saved as ${name}.`);
  });
  const restorePick = () => guard(async () => {
    const d = await pickFolder(); if (!d) return;
    const f = await listXlsx(d);
    if (!f.length) return Alert.alert('No backups found', 'That folder has no .xlsx files.');
    setFiles(f);
  });
  const restore = (f: { uri: string; name: string }) => {
    setFiles(null);
    Alert.alert('Restore this backup?', `Everything in your current Excel file will be replaced with the contents of ${f.name}.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Restore', style: 'destructive', onPress: () => guard(async () => { await replaceAll(await readData(f.uri)); ToastAndroid.show('Backup restored', ToastAndroid.SHORT); }) }]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <Card>
        <H>Excel file</H>
        <Text style={{ color: C.ink, fontWeight: '600' }}>{config?.fileName}</Text>
        <Text style={{ color: C.muted, marginTop: 4 }}>{data.transactions.length} transactions · {data.borrowed.length} borrowed · {data.lent.length} lent</Text>
        <View style={{ gap: 10, marginTop: 14 }}>
          <Btn title="Change storage location" onPress={() => navigation.navigate('Setup')} />
          <Btn title="Reload from Excel" kind="ghost" onPress={() => guard(async () => { await reload(); ToastAndroid.show('Reloaded', ToastAndroid.SHORT); })} />
        </View>
        <Text style={{ color: C.muted, marginTop: 10, fontSize: 12 }}>If you edit the file in another app, reload to see the changes here.</Text>
      </Card>
      <Card>
        <H>Backup and restore</H>
        <View style={{ gap: 10 }}>
          <Btn title="Back up Excel file" onPress={backup} />
          <Btn title="Restore from a backup" kind="ghost" onPress={restorePick} />
        </View>
      </Card>
      <Card>
        <H>Reminders</H>
        {([['dueReminders', 'Borrowed and lent due dates (9 AM)'], ['dailyReminder', 'Daily expense entry (8 PM)']] as const).map(([k, label]) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ flex: 1, color: C.ink }}>{label}</Text>
            <Switch value={prefs[k]} onValueChange={v => setPrefs({ ...prefs, [k]: v })} trackColor={{ true: C.accent }} />
          </View>))}
      </Card>
      <SheetModal visible={!!files} title="Choose a backup to restore" onClose={() => setFiles(null)}>
        {files?.map(f => <Pressable key={f.uri} onPress={() => restore(f)} style={{ paddingVertical: 14, borderBottomWidth: 1, borderColor: C.line }}><Text style={{ color: C.ink, fontSize: 16 }}>{f.name}</Text></Pressable>)}
      </SheetModal>
    </ScrollView>
  );
}
