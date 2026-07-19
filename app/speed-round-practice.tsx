import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SpeedRoundPractice } from '@/components/SpeedRoundPractice';
import { parseRawWordList } from '@/data/mock';

export default function SpeedRoundPracticeRoute() {
  const router = useRouter();
  const { value } = useLocalSearchParams<{ value?: string }>();
  const words = parseRawWordList(value);

  return (
    <SpeedRoundPractice
      words={words}
      onClose={() => router.back()}
      onComplete={() => router.back()}
    />
  );
}
