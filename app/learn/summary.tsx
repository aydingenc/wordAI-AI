import React from 'react';
import { Redirect } from 'expo-router';

// Flow-end change: learn/quiz.tsx's own results screen is now the session's
// final screen (ring/score/XP/tier + word pills + the full CTA list, old
// PostStoryFlow-style layout) — quiz no longer routes here. This screen is
// taken out of the route chain rather than deleted, same sanctioned pattern
// as app/story-reader.tsx's Redirect. If something still links here (it
// shouldn't — verified no remaining references), send it home rather than
// dead-ending.
export default function SummaryScreen() {
  return <Redirect href="/home" />;
}
