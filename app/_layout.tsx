import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProgressProvider } from '@/context/ProgressContext';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0B0713' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="create" />
      <Stack.Screen name="words-info" />
      <Stack.Screen name="words-entry" />
      <Stack.Screen name="story-loading" options={{ animation: 'fade' }} />
      <Stack.Screen name="images-info" />
      <Stack.Screen name="image-analysis-loading" options={{ animation: 'fade' }} />
      <Stack.Screen name="themes" />
      <Stack.Screen name="theme/[id]" />
      <Stack.Screen name="scene/[id]" />
      <Stack.Screen name="learn/story" />
      <Stack.Screen name="learn/quiz" />
      <Stack.Screen name="learn/flashcards" />
      <Stack.Screen name="learn/summary" options={{ animation: 'fade' }} />
      <Stack.Screen name="recent-words" />
      <Stack.Screen name="worddna/[word]" />
      <Stack.Screen name="story/[id]" />
      <Stack.Screen name="legal/[doc]" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <ProgressProvider>
                <StatusBar style="light" />
                <RootLayoutNav />
              </ProgressProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
