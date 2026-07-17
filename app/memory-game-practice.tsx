import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MemoryGamePractice } from '@/components/MemoryGamePractice';
import { parseRawWordList } from '@/data/mock';

export default function MemoryGamePracticeRoute() {
  const router = useRouter();
  const { value } = useLocalSearchParams<{ value?: string }>();
  const words = parseRawWordList(value);

  return (
    <MemoryGamePractice
      words={words}
      onBack={() => router.back()}
      onClose={() => router.back()}
      onComplete={() => router.back()}
    />
  );
}
