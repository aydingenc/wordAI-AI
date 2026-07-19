import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WordMatchPractice } from '@/components/WordMatchPractice';
import { parseRawWordList } from '@/data/mock';

export default function WordMatchPracticeRoute() {
  const router = useRouter();
  const { value } = useLocalSearchParams<{ value?: string }>();
  const words = parseRawWordList(value);

  return (
    <WordMatchPractice
      words={words}
      onBack={() => router.back()}
      onClose={() => router.back()}
      onComplete={() => router.back()}
    />
  );
}
