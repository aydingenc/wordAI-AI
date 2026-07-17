import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { WordStatus } from '@/data/mock';

type IconProps = { size?: number; color?: string };

/** Thin-line custom SVG icons (16x16 viewBox) — no emoji, matching the reference demo exactly. */

export function SparkleIcon({ size = 14, color = '#c4b5fd' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M8 1.8l1.1 3.9 3.9 1.1-3.9 1.1L8 11.8l-1.1-3.9-3.9-1.1 3.9-1.1L8 1.8z" fill={color} />
    </Svg>
  );
}

export function BookIcon({ size = 14, color = '#facc15' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 3.3c1.5-.6 3.2-.6 4.7 0 .3.1.5.4.5.7v7.2c0 .5-.5.8-1 .6-1.2-.5-2.8-.5-4.2 0V3.3z" />
      <Path d="M14 3.3c-1.5-.6-3.2-.6-4.7 0-.3.1-.5.4-.5.7v7.2c0 .5.5.8 1 .6 1.2-.5 2.8-.5 4.2 0V3.3z" />
    </Svg>
  );
}

export function HeartIcon({ size = 13, color = '#f472b6' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M8 13.5s-5.5-3.4-5.5-7.2C2.5 4 4.2 2.5 6.2 2.5c1.1 0 2.1.5 2.8 1.3.7-.8 1.7-1.3 2.8-1.3 2 0 3.7 1.5 3.7 3.8 0 3.8-5.5 7.2-5.5 7.2z" fill={color} />
    </Svg>
  );
}

export function ShieldIcon({ size = 14, color = '#4ade80' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M8 1.6l4.6 1.7v3.5c0 3.1-2 5.4-4.6 6.6-2.6-1.2-4.6-3.5-4.6-6.6V3.3L8 1.6z" />
      <Path d="M5.8 7.9l1.5 1.5L10.3 6" />
    </Svg>
  );
}

export function DnaIcon({ size = 18, color = '#b39dfb' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.2} strokeLinecap="round">
      <Path d="M4.2 1.6c0 2.8 7.6 2.8 7.6 6.4s-7.6 3.6-7.6 6.4" />
      <Path d="M11.8 1.6c0 2.8-7.6 2.8-7.6 6.4s7.6 3.6 7.6 6.4" />
      <Path d="M4.7 3.6h6.6M4.4 8h7.2M4.7 12.4h6.6" />
    </Svg>
  );
}

export function LockIcon({ size = 11, color = '#fbbf24' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3.5} y={7} width={9} height={6} rx={1.5} />
      <Path d="M5.5 7V4.8a2.5 2.5 0 0 1 5 0V7" />
    </Svg>
  );
}

export function PersonIcon({ size = 16, color = '#b39dfb' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={8} cy={5.5} r={2.5} />
      <Path d="M3.5 13.5c0-2.8 2-4.5 4.5-4.5s4.5 1.7 4.5 4.5" />
    </Svg>
  );
}

export function FunnelIcon({ size = 14, color = '#b39dfb' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2.3 3h11.4L9.2 8v4.3L6.8 13.7V8L2.3 3z" />
    </Svg>
  );
}

export function ClearIcon({ size = 14, color = '#a89fc2' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M13 8A5 5 0 1 1 11.5 4.3" />
      <Path d="M13 2.3V5H10.3" />
    </Svg>
  );
}

export function PlayIcon({ size = 14, color = '#ffffff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 3l10 5-10 5V3z" />
    </Svg>
  );
}

export function BlendIcon({ size = 14, color = '#ffffff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 8h10M8 3v10M3 3l10 10M13 3L3 13" />
    </Svg>
  );
}

export function VerbIcon({ size = 17, color = '#ff8a5c' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 8h10M9 4l4 4-4 4" />
    </Svg>
  );
}

export function NounIcon({ size = 17, color = '#38d4ff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="3" width="10" height="10" rx="2" />
    </Svg>
  );
}

export function AdjectiveIcon({ size = 17, color = '#4ade80' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 8c2-4 10-4 12 0" />
      <Path d="M2 8c2 4 10 4 12 0" />
    </Svg>
  );
}

export function AdverbIcon({ size = 17, color = '#fbbf24' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M8 2v3M8 11v3M3 8h3M10 8h3" />
    </Svg>
  );
}

export function PronounIcon({ size = 17, color = '#f472b6' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="8" cy="5" r="2.5" />
      <Path d="M3.5 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" />
    </Svg>
  );
}

export function OwnWordsIcon({ size = 14, color = '#60a5fa' }: IconProps) {
  return <BookIcon size={size} color={color} />;
}

export function ThemesIcon({ size = 14, color = '#facc15' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M7 1.6l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" fill={color} />
      <Path d="M12.3 8.8l.5 1.6 1.6.5-1.6.5-.5 1.6-.5-1.6-1.6-.5 1.6-.5.5-1.6z" fill={color} />
    </Svg>
  );
}

export function ImagesIcon({ size = 14, color = '#4ade80' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="2" y="3" width="12" height="10" rx="1.6" />
      <Circle cx="5.6" cy="6.6" r="1" fill={color} stroke="none" />
      <Path d="M2.3 11.2L5.7 8l2.6 2.4L11 7.2l2.7 3.8" />
    </Svg>
  );
}

export function TypeDot({ size = 7, color }: { size?: number; color: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 4,
      }}
    />
  );
}

export const STATUS_META: Record<
  WordStatus,
  { label: string; color: string; bg: string; border: string; Icon: (p: IconProps) => React.JSX.Element }
> = {
  new: { label: 'Yeni', color: '#b39dfb', bg: 'rgba(139,92,246,0.16)', border: 'rgba(139,92,246,0.35)', Icon: SparkleIcon },
  learning: { label: 'Öğreniliyor', color: '#facc15', bg: 'rgba(250,204,21,0.14)', border: 'rgba(250,204,21,0.35)', Icon: BookIcon },
  mastered: { label: 'Mastered', color: '#4ade80', bg: 'rgba(74,222,128,0.14)', border: 'rgba(74,222,128,0.35)', Icon: ShieldIcon },
};

export type WordTypeKey = 'verb' | 'noun' | 'adjective' | 'adverb' | 'pronoun';

export const TYPE_META: Record<
  WordTypeKey,
  { pillLabel: string; enLabel: string; btnLabel: string; color: string; Icon: (p: IconProps) => React.JSX.Element }
> = {
  verb: { pillLabel: 'Fiil', enLabel: 'Verb', btnLabel: 'Fiil Kelimeleriyle Pratik Yap', color: '#ff8a5c', Icon: VerbIcon },
  noun: { pillLabel: 'İsim', enLabel: 'Noun', btnLabel: 'İsim Kelimeleriyle Pratik Yap', color: '#38d4ff', Icon: NounIcon },
  adjective: { pillLabel: 'Sıfat', enLabel: 'Adjective', btnLabel: 'Sıfat Kelimeleriyle Pratik Yap', color: '#4ade80', Icon: AdjectiveIcon },
  adverb: { pillLabel: 'Zarf', enLabel: 'Adverb', btnLabel: 'Zarf Kelimeleriyle Pratik Yap', color: '#fbbf24', Icon: AdverbIcon },
  pronoun: { pillLabel: 'Zamir', enLabel: 'Pronoun', btnLabel: 'Zamir Kelimeleriyle Pratik Yap', color: '#f472b6', Icon: PronounIcon },
};

export type WordSourceKey = 'own' | 'theme' | 'image';

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export const SOURCE_META: Record<
  WordSourceKey,
  { pillLabel: string; btnLabel: string; color: string; Icon: (p: IconProps) => React.JSX.Element }
> = {
  own: { pillLabel: 'Kendi Kelimelerim', btnLabel: 'Kendi Kelimelerim ile Pratik Yap', color: '#60a5fa', Icon: OwnWordsIcon },
  theme: { pillLabel: 'Hazır Temalar', btnLabel: 'Hazır Temalar ile Pratik Yap', color: '#facc15', Icon: ThemesIcon },
  image: { pillLabel: 'Kendi Görsellerin', btnLabel: 'Kendi Görsellerin ile Pratik Yap', color: '#4ade80', Icon: ImagesIcon },
};
