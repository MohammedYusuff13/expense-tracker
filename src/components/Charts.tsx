import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SText } from 'react-native-svg';
import { C, PALETTE } from '../theme';
import { money } from '../utils';

export interface Datum { label: string; value: number; detail?: string; }

export function BarChart({ data, selected, onSelect, height = 190 }: { data: Datum[]; selected: number | null; onSelect: (i: number) => void; height?: number }) {
  const [w, setW] = useState(0);
  const max = Math.max(...data.map(d => d.value), 1), base = height - 24, bw = w / Math.max(data.length, 1);
  return (
    <View onLayout={e => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Svg width={w} height={height}>
          {data.map((d, i) => {
            const h = Math.max((d.value / max) * (base - 14), d.value > 0 ? 3 : 1), x = i * bw;
            return (
              <G key={i} onPress={() => onSelect(i)}>
                <Rect x={x} y={0} width={bw} height={height} fill="transparent" />
                <Rect x={x + bw * 0.18} y={base - h} width={bw * 0.64} height={h} rx={6} fill={PALETTE[i % PALETTE.length]} opacity={selected == null || selected === i ? 1 : 0.35} />
                <SText x={x + bw / 2} y={height - 6} fontSize={11} fill={selected === i ? C.ink : C.muted} fontWeight={selected === i ? 'bold' : 'normal'} textAnchor="middle">{d.label}</SText>
              </G>
            );
          })}
        </Svg>
      )}
    </View>
  );
}

const pt = (cx: number, cy: number, r: number, a: number) => `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;

export function PieChart({ data, size = 170 }: { data: Datum[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <Text style={{ color: C.muted, textAlign: 'center', padding: 16 }}>No expenses in this period.</Text>;
  const r = size / 2 - 4, c = size / 2;
  let a = -Math.PI / 2;
  return (
    <View>
      <View style={{ alignItems: 'center' }}>
        <Svg width={size} height={size}>
          {data.length === 1 ? <Circle cx={c} cy={c} r={r} fill={PALETTE[0]} /> : data.map((d, i) => {
            const sweep = (d.value / total) * Math.PI * 2, a0 = a; a += sweep;
            return <Path key={i} fill={PALETTE[i % PALETTE.length]} d={`M${c} ${c} L${pt(c, c, r, a0)} A${r} ${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${pt(c, c, r, a0 + sweep - 0.0001)} Z`} />;
          })}
          <Circle cx={c} cy={c} r={r * 0.55} fill={C.card} />
          <SText x={c} y={c + 5} fontSize={13} fontWeight="bold" fill={C.ink} textAnchor="middle">{money(total)}</SText>
        </Svg>
      </View>
      <View style={{ marginTop: 10 }}>
        {data.map((d, i) => (
          <View key={d.label} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: PALETTE[i % PALETTE.length], marginRight: 8 }} />
            <Text style={{ flex: 1, color: C.ink }}>{d.label}</Text>
            <Text style={{ color: C.muted, marginRight: 10 }}>{Math.round((d.value / total) * 100)}%</Text>
            <Text style={{ color: C.ink, fontWeight: '600' }}>{money(d.value)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function LineChart({ data, selected, onSelect, height = 150, color = C.accent }: { data: Datum[]; selected: number | null; onSelect: (i: number) => void; height?: number; color?: string }) {
  const [w, setW] = useState(0);
  const max = Math.max(...data.map(d => d.value), 1), padX = 14, base = height - 22, top = 12;
  const step = data.length > 1 ? (w - padX * 2) / (data.length - 1) : 0;
  const pts = data.map((d, i) => ({ x: padX + i * step, y: base - (d.value / max) * (base - top) }));
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  const labelEvery = Math.ceil(data.length / 8);
  return (
    <View onLayout={e => setW(e.nativeEvent.layout.width)}>
      {w > 0 && pts.length > 0 && (
        <Svg width={w} height={height}>
          <Path d={`${path} L${pts[pts.length - 1].x} ${base} L${pts[0].x} ${base} Z`} fill={color} opacity={0.1} />
          <Path d={path} stroke={color} strokeWidth={2.5} fill="none" />
          {pts.map((p, i) => (
            <G key={i} onPress={() => onSelect(i)}>
              <Circle cx={p.x} cy={p.y} r={14} fill="transparent" />
              <Circle cx={p.x} cy={p.y} r={selected === i ? 6 : 3.5} fill={selected === i ? C.expense : color} />
              {i % labelEvery === 0 && <SText x={p.x} y={height - 5} fontSize={10} fill={C.muted} textAnchor="middle">{data[i].label}</SText>}
            </G>
          ))}
        </Svg>
      )}
    </View>
  );
}

export const DetailLine = ({ d }: { d: Datum | null | undefined }) =>
  d ? <Text style={{ textAlign: 'center', color: C.ink, marginTop: 6, fontWeight: '600' }}>{d.detail || d.label}: {money(d.value)}</Text>
    : <Text style={{ textAlign: 'center', color: C.muted, marginTop: 6 }}>Tap a bar or point for details</Text>;
