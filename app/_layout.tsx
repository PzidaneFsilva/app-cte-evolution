// app/_layout.tsx
import { Stack, useSegments } from 'expo-router';
import { useEffect } from 'react';

export default function RootLayout() {
  const segments = useSegments();

  useEffect(() => {
    console.log('✅ ROTA ATIVA:', segments.join('/'));
  }, [segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}
