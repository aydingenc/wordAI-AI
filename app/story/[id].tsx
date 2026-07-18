import React from 'react';
import { Redirect } from 'expo-router';

// Aşama 1E, Görev 2: this plain-text reader (no TTS, no chapter/pill system)
// has been superseded — custom stories now reopen in the rich learn/story.tsx
// reader (see app/(tabs)/stories.tsx's openStory()), via
// buildSessionFromStory()/readOnly (data/mock.ts). No entry point pushes
// `/story/${id}` anymore; this redirect only exists so the registered
// dynamic route never dead-ends if something still links here — same
// "Redirect instead of delete" pattern already used for app/story-reader.tsx
// (WL-004). The file is intentionally left in place as an archive, not
// deleted, per instruction.
export default function StoryDetailScreen() {
  return <Redirect href="/learn/story" />;
}
