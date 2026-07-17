import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StoryReader } from '@/components/StoryReader';
import { PostStoryFlow } from '@/components/PostStoryFlow';
import { buildStoryReaderData } from '@/data/mock';
import { useProgress } from '@/context/ProgressContext';

export default function StoryReaderScreen() {
  const router = useRouter();
  const { currentSession, clearSession } = useProgress();
  const [stage, setStage] = useState<'reading' | 'postStory'>('reading');

  useEffect(() => {
    if (!currentSession) router.replace('/home');
  }, [currentSession, router]);

  if (!currentSession) {
    return null;
  }

  const readerData = buildStoryReaderData(currentSession.title, currentSession.targetWords, currentSession.paragraphs);

  if (stage === 'postStory') {
    return (
      <PostStoryFlow
        storyTitle={readerData.storyTitle}
        targetWords={readerData.targetWords}
        onExit={() => {
          clearSession();
          router.replace('/home');
        }}
        onBackToStory={() => setStage('reading')}
        onDifferentTheme={() => router.replace('/images-gallery')}
        onNewStorySameWords={(words) =>
          router.replace({ pathname: '/words-entry', params: { prefillWords: words.join(',') } })
        }
      />
    );
  }

  return <StoryReader {...readerData} onFinish={() => setStage('postStory')} onBack={() => router.back()} />;
}
