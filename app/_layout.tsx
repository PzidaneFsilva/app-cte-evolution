// Arquivo: app/_layout.tsx (VERSÃO ATUALIZADA)

import { Stack, router, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function AuthLayout() {
  const { user, userData, isLoading } = useAuth();
  const segments = useSegments() as string[];


  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(app)';
    const inPublicScreens = segments.length === 0 || ['cadastro', 'pending-approval', 'reset-password'].includes(segments[0] ?? '');


    // Se o usuário não está logado e está tentando acessar uma área protegida
    if (!user && !inPublicScreens) {
      router.replace('/');
      return;
    }
    
    // Se o usuário está logado
    if (user && userData) {
      const isPendingOrSuspended = userData.status === 'pendente' || userData.status === 'suspenso';
      const onPendingScreen = segments[0] === 'pending-approval';

      // Se o status for pendente/suspenso e ele não estiver na tela correta, redireciona
      if (isPendingOrSuspended && !onPendingScreen) {
        router.replace('/pending-approval');
      }
      // Se o status for aprovado e ele não estiver na área do app, redireciona para o feed
      else if (userData.status === 'aprovado' && !inAuthGroup) {
        router.replace('/feed');
      }
    }
    
  }, [user, userData, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="cadastro" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="pending-approval" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthLayout />
    </AuthProvider>
  );
}