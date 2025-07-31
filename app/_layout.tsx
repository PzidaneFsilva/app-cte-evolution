// Arquivo: app/_layout.tsx (O NOVO "PORTEIRO" INTELIGENTE)

import { Stack, router, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function AuthLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    console.log('[AuthLayout] user:', user);
    console.log('[AuthLayout] segments:', segments);
    // Não faz nada enquanto o estado de autenticação está carregando
    if (isLoading) return;

    // `inAuthGroup` verifica se o usuário está tentando acessar uma tela DENTRO do grupo '(app)'
    const inAuthGroup = segments[0] === '(app)';

    // Cenário 1: O usuário NÃO está logado, mas está tentando acessar uma tela protegida.
    if (!user && inAuthGroup) {
      console.log('[AuthLayout] Redirecionando para /')
      // Manda para a tela de login.
      router.replace('/');
    }
    // Cenário 2: O usuário ESTÁ logado, mas está em uma tela pública (login/cadastro).
    else if (user && !inAuthGroup) {
    console.log('[AuthLayout] Redirecionando para /')
      // Manda para a tela principal dentro do grupo de app.
      // ESTA LINHA É CRUCIAL E DEVE SER PARA `/(app)`
      router.replace('/feed');
    }
  }, [user, isLoading, segments]); // Adicionamos `segments` para mais robustez

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="cadastro" />
      <Stack.Screen name="(app)" />
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