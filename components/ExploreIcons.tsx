import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

type IconProps = { size?: number; color?: string };

/** Simple robot-face avatar for the Keşfet header. */
export function BotIcon({ size = 22, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={4} y={8} width={16} height={12} rx={4} />
      <Path d="M12 8V4M9 4h6" />
      <Circle cx={9} cy={14} r={1.4} fill={color} stroke="none" />
      <Circle cx={15} cy={14} r={1.4} fill={color} stroke="none" />
      <Path d="M9.5 17.5c1.5 1 3.5 1 5 0" />
    </Svg>
  );
}

/** Two overlapping "Aa" flashcards — illustration for the flashcard practice card. */
export function FlashcardStackIcon({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <Defs>
        <LinearGradient id="cardG1" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#7c3aed" />
          <Stop offset="100%" stopColor="#4c1d95" />
        </LinearGradient>
        <LinearGradient id="cardG2" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#a78bfa" />
          <Stop offset="100%" stopColor="#7c3aed" />
        </LinearGradient>
      </Defs>
      <Rect x={15} y={10} width={30} height={38} rx={6} fill="url(#cardG1)" opacity={0.85} transform="rotate(-8 30 29)" />
      <Rect x={13} y={12} width={30} height={38} rx={6} fill="url(#cardG2)" transform="rotate(6 28 31)" />
      <SvgText x={28} y={38} fontSize={17} fontWeight="700" fill="#fff" textAnchor="middle" transform="rotate(6 28 31)">
        Aa
      </SvgText>
    </Svg>
  );
}

/** Two overlapping lab flasks — illustration for the Cümle Laboratuvarı card. */
export function FlaskIcon({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <Defs>
        <LinearGradient id="flaskBack" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#134e4a" />
          <Stop offset="100%" stopColor="#0f766e" />
        </LinearGradient>
        <LinearGradient id="flaskFront" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#2dd4bf" />
          <Stop offset="100%" stopColor="#0d9488" />
        </LinearGradient>
      </Defs>
      <Rect x={16} y={6} width={6} height={12} rx={1.5} fill="url(#flaskBack)" transform="translate(3,3)" />
      <Path
        d="M16 16 L22 16 L30 36 C31.5 40 29 44 24.5 44 L13.5 44 C9 44 6.5 40 8 36 Z"
        fill="url(#flaskBack)"
        transform="translate(3,3)"
      />
      <Rect x={26} y={9} width={7} height={13} rx={1.5} fill="url(#flaskFront)" transform="translate(9,1)" />
      <Path
        d="M26 20 L33 20 L42.5 42 C44.3 46.5 41.3 51 36.4 51 L22.6 51 C17.7 51 14.7 46.5 16.5 42 Z"
        fill="url(#flaskFront)"
        transform="translate(9,1)"
      />
      <Path
        d="M19 34 L40 34 L42.5 42 C44.3 46.5 41.3 51 36.4 51 L22.6 51 C17.7 51 14.7 46.5 16.5 42 Z"
        fill="#5eead4"
        opacity={0.35}
        transform="translate(9,1)"
      />
      <Circle cx={38} cy={14} r={1.6} fill="#fff" opacity={0.75} />
      <Circle cx={41} cy={20} r={1} fill="#fff" opacity={0.6} />
      <Circle cx={16} cy={11} r={1.2} fill="#fff" opacity={0.6} />
    </Svg>
  );
}

/** Game controller — illustration for the locked "Oyunlar" card. */
export function GamesIcon({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <Defs>
        <LinearGradient id="padG1" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#fbbf24" />
          <Stop offset="100%" stopColor="#b45309" />
        </LinearGradient>
      </Defs>
      <Path
        d="M14 28c0-5 3-8 8-8h16c5 0 8 3 8 8l2 10c.7 3.5-2 6.5-5 5.2l-7-3H24l-7 3c-3 1.3-5.7-1.7-5-5.2l2-10z"
        fill="url(#padG1)"
      />
      <Circle cx={21} cy={30} r={1.8} fill="#5c3d00" />
      <Path d="M21 27v6M18 30h6" stroke="#5c3d00" strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx={38} cy={28} r={1.7} fill="#5c3d00" />
      <Circle cx={43} cy={32} r={1.7} fill="#5c3d00" />
    </Svg>
  );
}

/** Two-tone donut arc (80% known / 20% new) for the "Öğrenmenin Bilimsel Yolu" card. */
export function LearningDonutChart({ size = 150 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 150 150">
      <Circle
        cx={75}
        cy={75}
        r={50}
        fill="none"
        stroke="rgba(139,92,246,0.9)"
        strokeWidth={34}
        strokeDasharray="220 251"
        strokeDashoffset={0}
        transform="rotate(-90 75 75)"
      />
      <Circle
        cx={75}
        cy={75}
        r={50}
        fill="none"
        stroke="rgba(250,204,21,0.9)"
        strokeWidth={34}
        strokeDasharray="55 251"
        strokeDashoffset={-220}
        transform="rotate(-90 75 75)"
      />
    </Svg>
  );
}
