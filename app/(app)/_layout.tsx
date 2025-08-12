// Arquivo: app/(app)/_layout.tsx (VERSÃO FINAL E SEGURA)

import CustomDrawerContent from '@/components/CustomDrawerContent';
import { useAuth } from '@/context/AuthContext';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

// Este é o componente que controla o acesso à área logada do app.
function AppLayout() {
  const { userData, isLoading } = useAuth();

  // 1. Enquanto o AuthContext verifica os dados do usuário, mostramos um carregamento.
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#005A9C" />
      </View>
    );
  }

  // 2. Se o usuário NÃO está aprovado, não renderizamos nada da área interna.
  //    O redirecionamento no _layout.tsx principal cuidará de mandá-lo embora.
  //    Isso previne o "flicker" de ver uma tela interna antes de ser redirecionado.
  if (userData?.status !== 'aprovado') {
     // Renderiza uma tela de carregamento vazia para aguardar o redirecionamento global.
     return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' }}>
          <ActivityIndicator size="large" color="#005A9C" />
        </View>
      );
  }

  // 3. Somente se o usuário estiver 'aprovado', renderizamos o Drawer Navigator com acesso ao app.
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Drawer.Screen name="(tabs)" options={{ drawerLabel: 'Início' }} />
      <Drawer.Screen name="agenda" options={{ drawerLabel: 'Turmas disponíveis' }} />
      <Drawer.Screen name="ranking" options={{ drawerLabel: 'Rankings' }} />
      
      {/* Telas que existem mas não devem aparecer como itens de menu padrão */}
      <Drawer.Screen name="perfil" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="criar-desafio" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="novo-post" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="notificacoes" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="novo-aviso" options={{ drawerItemStyle: { display: 'none' } }} />

    </Drawer>
  );
}

// O export default agora aponta para o nosso novo componente de controle
export default AppLayout;