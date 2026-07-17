import React from 'react';
import { Redirect } from 'expo-router';

// WL-004: /story-reader (StoryReader + PostStoryFlow) has been superseded by
// the canonical learn/story -> learn/quiz -> learn/flashcards -> learn/summary
// flow. All entry points now route to /learn/story directly; this redirect
// only exists so the registered route never dead-ends if something still
// links here. components/StoryReader.tsx and components/PostStoryFlow.tsx
// (and PostStoryFlow's exclusive children) are intentionally left in place,
// just unimported — see WORDLOOP_AUDIT_FIX_REPORT.md.
export default function StoryReaderScreen() {
  return <Redirect href="/learn/story" />;
}
