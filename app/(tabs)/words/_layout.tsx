import React from 'react';
import { Stack } from 'expo-router';

export default function WordsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0B0713' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="all" />
    </Stack>
  );
}
