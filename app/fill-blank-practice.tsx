import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FillBlankPractice } from '@/components/FillBlankPractice';
import { parseRawWordList } from '@/data/mock';

export default function FillBlankPracticeRoute() {
  const router = useRouter();
  const { value } = useLocalSearchParams<{ value?: string }>();
  const words = parseRawWordList(value);

  return (
    <FillBlankPractice
      words={words}
      onBack={() => router.back()}
      onClose={() => router.back()}
      onComplete={() => router.back()}
    />
  );
}
