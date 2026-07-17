import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PresetSceneTransition, type WordLevel } from '@/components/PresetSceneTransition';
import { GALLERY_CATEGORIES, GALLERY_ITEMS, sessionFromGalleryItem } from '@/data/mock';
import { useProgress } from '@/context/ProgressContext';

export default function SceneTransitionScreen() {
  const router = useRouter();
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { startSession } = useProgress();

  const item = GALLERY_ITEMS.find((g) => g.id === itemId);

  if (!item) {
    router.replace('/images-gallery');
    return null;
  }

  return (
    <PresetSceneTransition
      sceneTitle={item.title}
      sceneSummaryTR={item.preview.tr}
      targetWords={item.targetWords.map((word) => ({ word, level: item.level as WordLevel }))}
      sceneIcon={GALLERY_CATEGORIES.find((c) => c.id === item.categoryId)?.icon ?? 'image-outline'}
      onProceed={() => {
        startSession(sessionFromGalleryItem(item));
        router.replace('/story-reader');
      }}
    />
  );
}
