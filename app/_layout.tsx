import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProgressProvider, useProgress } from '@/context/ProgressContext';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/**
 * Keeps the native splash screen up until BOTH fonts and the persisted local
 * state have loaded, so `index.tsx` never gets a chance to render its
 * onboarding animation for a single frame before redirecting an already-
 * onboarded user straight to /home.
 */
function SplashGate({ fontsReady }: { fontsReady: boolean }) {
  const { isHydrated } = useProgress();
  useEffect(() => {
    if (fontsReady && isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsReady, isHydrated]);
  return null;
}

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
      <Stack.Screen name="images-gallery" />
      <Stack.Screen name="scene-transition" options={{ animation: 'fade' }} />
      <Stack.Screen name="story-reader" options={{ animation: 'fade' }} />
      <Stack.Screen name="themes" />
      <Stack.Screen name="theme/[id]" />
      <Stack.Screen name="scene/[id]" />
      <Stack.Screen name="learn/story" />
      <Stack.Screen name="learn/quiz" />
      <Stack.Screen name="learn/flashcards" />
      <Stack.Screen name="learn/summary" options={{ animation: 'fade' }} />
      <Stack.Screen name="recent-words" />
      <Stack.Screen name="word-network" />
      <Stack.Screen name="flashcards-practice" options={{ animation: 'fade' }} />
      <Stack.Screen name="word-match-practice" options={{ animation: 'fade' }} />
      <Stack.Screen name="fill-blank-practice" options={{ animation: 'fade' }} />
      <Stack.Screen name="memory-game-practice" options={{ animation: 'fade' }} />
      <Stack.Screen name="speed-round-practice" options={{ animation: 'fade' }} />
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
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100%';
      const root = document.getElementById('root');
      if (root) {
        root.style.height = '100%';
        root.style.overflow = 'hidden';
      }
    }
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <ProgressProvider>
                <SplashGate fontsReady={fontsLoaded || !!fontError} />
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
