import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type TabMeta = { name: string; label: string; icon: keyof typeof Feather.glyphMap };

// Visual order in the bar. 'fab' is the central create button (not a route).
const BAR: (TabMeta | 'fab')[] = [
  { name: 'home', label: 'Ana Sayfa', icon: 'home' },
  { name: 'words', label: 'Kelimelerim', icon: 'book' },
  'fab',
  { name: 'stories', label: 'Hikâyelerim', icon: 'book-open' },
  { name: 'explore', label: 'Keşfet', icon: 'compass' },
];

function CustomTabBar({ state, navigation }: any) {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'web' ? 12 : insets.bottom;

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.backgroundElevated,
          borderTopColor: colors.border,
          paddingBottom: bottomInset + 8,
        },
      ]}
    >
      {BAR.map((item, i) => {
        if (item === 'fab') {
          return (
            <View key="fab" style={styles.tab}>
              <Pressable
                onPress={() => router.push('/create')}
                style={({ pressed }) => [
                  styles.fab,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.background,
                    shadowColor: colors.primaryGlow,
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  },
                ]}
              >
                <Feather name="plus" size={28} color="#FFFFFF" />
              </Pressable>
            </View>
          );
        }

        const routeIndex = state.routes.findIndex((r: any) => r.name === item.name);
        if (routeIndex < 0) return null;
        const route = state.routes[routeIndex];
        const focused = state.index === routeIndex;

        return (
          <Pressable
            key={item.name}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route?.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(item.name);
              }
            }}
            style={styles.tab}
          >
            <View
              style={[
                styles.iconWrap,
                focused && {
                  backgroundColor: colors.secondary,
                  shadowColor: colors.primaryGlow,
                },
                focused && styles.iconGlow,
              ]}
            >
              <Feather
                name={item.icon}
                size={22}
                color={focused ? colors.primary : colors.mutedForeground}
              />
            </View>
            <Text
              style={[
                styles.label,
                { color: focused ? colors.foreground : colors.mutedForeground },
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="words" />
      <Tabs.Screen name="stories" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 6,
    alignItems: 'flex-start',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 46,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  fab: {
    width: 62,
    height: 62,
    borderRadius: 31,
    marginTop: -26,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 10,
  },
});
