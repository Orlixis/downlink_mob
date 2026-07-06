import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import { ProviderProvider, useProvider } from '../src/context/ProviderContext';

function RootLayoutNav() {
  const { providerUrl, isLoading } = useProvider();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inTabsGroup = segments[0] === '(tabs)';
    
    if (!providerUrl) {
      // If no provider URL, force them to the onboard screen
      // @ts-ignore: Typed routes hasn't updated yet for onboard
      router.replace("/onboard" as any);
    } else if ((segments[0] as string) === 'onboard') {
      // If they have a provider URL and are on onboard, send to tabs
      router.replace('/(tabs)');
    }
  }, [providerUrl, isLoading, segments]);

  if (isLoading) {
    return null; // Or a splash screen
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#020617' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="onboard"
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="add-modal"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="player"
        options={{
          presentation: 'fullScreenModal',
          headerShown: false,
          animation: 'fade_from_bottom',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ProviderProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootLayoutNav />
        <StatusBar style="light" />
      </GestureHandlerRootView>
    </ProviderProvider>
  );
}
