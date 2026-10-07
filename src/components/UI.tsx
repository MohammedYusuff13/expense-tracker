import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, ViewStyle, KeyboardTypeOptions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { C } from '../theme';
import { fmtDate, isoDate, parseISO } from '../utils';

export const Card = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => <View style={[s.card, style]}>{children}</View>;
export const H = ({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) => (
  <View style={s.h}><Text style={s.hText}>{children}</Text>{right}</View>
);
export const Btn = ({ title, onPress, kind = 'primary', style, disabled }: { title: string; onPress: () => void; kind?: 'primary' | 'ghost' | 'danger'; style?: ViewStyle; disabled?: boolean }) => (
  <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [s.btn, kind === 'ghost' && s.btnGhost, kind === 'danger' && s.btnDanger, pressed && { opacity: 0.8 }, disabled && { opacity: 0.5 }, style]}>
    <Text style={[s.btnText, kind === 'ghost' && { color: C.accent }, kind === 'danger' && { color: C.danger }]}>{title}</Text>
  </Pressable>
);
export const Chip = ({ label, active, onPress, color = C.accent }: { label: string; active?: boolean; onPress: () => void; color?: string }) => (
  <Pressable onPress={onPress} style={[s.chip, active && { backgroundColor: color, borderColor: color }]}>
    <Text style={[s.chipText, active && { color: '#fff' }]}>{label}</Text>
  </Pressable>
);
export const Chips = ({ items, value, onChange, color }: { items: string[]; value: string; onChange: (v: string) => void; color?: string }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
    {items.map(i => <Chip key={i} label={i} active={i === value} onPress={() => onChange(i)} color={color} />)}
  </ScrollView>
);
export const Field = ({ label, value, onChangeText, keyboardType, multiline, placeholder }: { label: string; value: string; onChangeText: (t: string) => void; keyboardType?: KeyboardTypeOptions; multiline?: boolean; placeholder?: string }) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={s.label}>{label}</Text>
    <TextInput style={[s.input, multiline && { height: 80, textAlignVertical: 'top' }]} value={value} onChangeText={onChangeText} keyboardType={keyboardType} multiline={multiline} placeholder={placeholder} placeholderTextColor={C.muted} />
  </View>
);
export const Label = ({ children }: { children: string }) => <Text style={s.label}>{children}</Text>;
export const Empty = ({ text }: { text: string }) => <Text style={{ color: C.muted, textAlign: 'center', paddingVertical: 20 }}>{text}</Text>;

export function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ marginBottom: 14, flex: 1 }}>
      <Text style={s.label}>{label}</Text>
      <Pressable style={s.input} onPress={() => setShow(true)}><Text style={{ color: C.ink, paddingTop: 2 }}>{fmtDate(value)}</Text></Pressable>
      {show && <DateTimePicker value={parseISO(value)} mode="date" onChange={(e, d) => { setShow(false); if (e.type === 'set' && d) onChange(isoDate(d)); }} />}
    </View>
  );
}

export function PromptModal({ visible, title, defaultValue = '', keyboardType, confirm = 'Save', onSubmit, onCancel }: { visible: boolean; title: string; defaultValue?: string; keyboardType?: KeyboardTypeOptions; confirm?: string; onSubmit: (v: string) => void; onCancel: () => void }) {
  const [v, setV] = useState(defaultValue);
  React.useEffect(() => { if (visible) setV(defaultValue); }, [visible]);
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={s.backdrop}><View style={s.sheet}>
        <Text style={s.hText}>{title}</Text>
        <TextInput autoFocus style={[s.input, { marginTop: 12 }]} value={v} onChangeText={setV} keyboardType={keyboardType} />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <Btn title="Cancel" kind="ghost" onPress={onCancel} style={{ flex: 1 }} />
          <Btn title={confirm} onPress={() => onSubmit(v)} style={{ flex: 1 }} />
        </View>
      </View></View>
    </Modal>
  );
}

export function SheetModal({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}><View style={[s.sheet, { maxHeight: '75%' }]}>
        <Text style={[s.hText, { marginBottom: 10 }]}>{title}</Text>
        <ScrollView>{children}</ScrollView>
        <Btn title="Close" kind="ghost" onPress={onClose} style={{ marginTop: 10 }} />
      </View></View>
    </Modal>
  );
}

export const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: C.line },
  h: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  hText: { fontSize: 17, fontWeight: '700', color: C.ink },
  btn: { backgroundColor: C.accent, paddingVertical: 13, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: C.accent },
  btnGhost: { backgroundColor: 'transparent' },
  btnDanger: { backgroundColor: 'transparent', borderColor: C.danger },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  chip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: C.line, backgroundColor: C.card },
  chipText: { color: C.ink, fontWeight: '600', fontSize: 13 },
  label: { color: C.muted, fontSize: 13, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 16, color: C.ink, minHeight: 46 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  sheet: { backgroundColor: C.bg, borderRadius: 18, padding: 18 },
});
