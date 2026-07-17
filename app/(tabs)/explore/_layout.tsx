import React from 'react';
import { Stack } from 'expo-router';

export default function ExploreStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0B0713' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="word-cards-hub" />
      <Stack.Screen name="word-dna" />
    </Stack>
  );
}
