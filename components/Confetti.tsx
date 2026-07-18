import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const COLORS = ['#8B5CF6', '#4ADE80', '#FBBF24', '#60A5FA', '#F87171'];
const SCREEN_HEIGHT = Dimensions.get('window').height;

interface Piece {
  id: number;
  left: number;
  color: string;
  duration: number;
  delay: number;
  rounded: boolean;
}

let pieceIdCounter = 0;

/**
 * Fire a burst by incrementing `burstKey` (a nonce). 0 renders nothing, so
 * callers can start at 0 and bump on each celebratory event.
 */
export function ConfettiBurst({ burstKey, count = 24 }: { burstKey: number; count?: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (burstKey <= 0 || reducedMotion) return;
    const next: Piece[] = Array.from({ length: count }, () => ({
      id: pieceIdCounter++,
      left: 5 + Math.random() * 90,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      duration: 1200 + Math.random() * 800,
      delay: Math.random() * 150,
      rounded: Math.random() > 0.5,
    }));
    setPieces(next);
    const timer = setTimeout(() => setPieces([]), 2600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burstKey]);

  if (!pieces.length) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p) => (
        <ConfettiPiece key={p.id} piece={p} />
      ))}
    </View>
  );
}

function ConfettiPiece({ piece }: { piece: Piece }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(piece.delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT * 0.72,
          duration: piece.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: piece.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(piece.duration * 0.6),
          Animated.timing(opacity, {
            toValue: 0,
            duration: piece.duration * 0.4,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotateInterpolate = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '540deg'] });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: `${piece.left}%`,
          backgroundColor: piece.color,
          borderRadius: piece.rounded ? 6 : 2,
          opacity,
          transform: [{ translateY }, { rotate: rotateInterpolate }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: -10, width: 7, height: 11 },
});
