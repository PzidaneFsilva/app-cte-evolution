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
      <Drawer.Screen name="(tabs)" options={{ drawerLabel: 'Início' }} />
      <Drawer.Screen name="agenda" options={{ drawerLabel: 'Agenda' }} />
      {/* ADICIONE ESTA LINHA PARA A TELA DE PERFIL */}
      <Drawer.Screen name="perfil" options={{ drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  );
}