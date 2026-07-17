import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PracticeMethodsScreen, type PracticeMethodId } from '@/components/PracticeMethodsScreen';
import { parseRawWordList } from '@/data/mock';
import { useProgress } from '@/context/ProgressContext';

function methodRoute(methodId: PracticeMethodId) {
  switch (methodId) {
    case 'flashcards':
      return '/flashcards-practice' as const;
    case 'match':
      return '/word-match-practice' as const;
    case 'fillblank':
      return '/fill-blank-practice' as const;
    case 'memory':
      return '/memory-game-practice' as const;
    case 'speed':
      return '/speed-round-practice' as const;
  }
}

export default function PracticeMethodsRoute() {
  const router = useRouter();
  const { clearSession } = useProgress();
  const { value, title } = useLocalSearchParams<{ value?: string; title?: string }>();
  const words = parseRawWordList(value);

  return (
    <PracticeMethodsScreen
      learnedWords={words}
      storyTitle={title ?? ''}
      onClose={() => {
        // Reached from learn/summary.tsx, a root-stack screen sitting above the
        // (tabs) group — router.back() here isn't reliable, since focusing (tabs)
        // to enter this tab-nested route pops the deep learn/* stack it came
        // from (same cross-tree issue already solved for word-dna.tsx in 1A.2).
        // Going to home is the explicit, contract-preserving fallback the task
        // allows ("özet ekranına veya ana sayfaya").
        clearSession();
        router.dismissAll();
        router.replace('/home');
      }}
      onSelectMethod={(methodId) =>
        router.push({ pathname: methodRoute(methodId), params: { source: 'raw', value: words.join(',') } })
      }
    />
  );
}
