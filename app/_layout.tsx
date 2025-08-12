// Arquivo: app/_layout.tsx (VERSÃO COM SPLASH SCREEN)

import { Stack, router, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' }}>
      <ActivityIndicator size="large" color="#005A9C" />
    </View>
  );
}

function AuthLayout() {
  const { user, userData, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    // Se ainda estiver carregando as informações, não fazemos nada.
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(app)';

    // Se não há usuário logado e ele não está na tela de login/cadastro, redireciona para o início.
    if (!user && inAuthGroup) {
      router.replace('/');
    } 
    // Se o usuário está logado e autenticado
    else if (user && userData) {
      // Se o status for pendente, redireciona para a tela de espera.
      if ((userData.status === 'pendente' || userData.status === 'suspenso') && segments[0] !== 'pending-approval') {
        router.replace('/pending-approval');
      } 
      // Se o status for aprovado e ele não estiver no grupo de telas do app, manda para o feed.
      else if (userData.status === 'aprovado' && !inAuthGroup) {
        router.replace('/(app)/(tabs)/feed');
      }
    }
  }, [user, userData, isLoading, segments]);

  // Enquanto isLoading for true, mostramos uma tela de carregamento global.
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Quando o carregamento terminar, o Stack de navegação é renderizado.
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