// Arquivo: app/(app)/_layout.tsx (VERSÃO ATUALIZADA)

import CustomDrawerContent from '@/components/CustomDrawerContent';
import { Drawer } from 'expo-router/drawer';
import 'react-native-reanimated';

export default function AppLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* 1. ORDEM AJUSTADA CONFORME SOLICITADO */}
      <Drawer.Screen name="(tabs)" options={{ drawerLabel: 'Início' }} />
      <Drawer.Screen name="agenda" options={{ drawerLabel: 'Turmas disponíveis' }} />
      <Drawer.Screen name="ranking" options={{ drawerLabel: 'Rankings' }} />
      
      {/* Telas que existem mas não devem aparecer como itens de menu padrão */}
      <Drawer.Screen name="perfil" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="criar-desafio" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="novo-post" options={{ drawerItemStyle: { display: 'none' } }} />

    </Drawer>
  );
}