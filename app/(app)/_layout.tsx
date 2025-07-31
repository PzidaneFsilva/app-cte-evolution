import { Drawer } from 'expo-router/drawer';
import 'react-native-reanimated';
// Usando o atalho '@' para o caminho do CustomDrawerContent
import CustomDrawerContent from '@/components/CustomDrawerContent';

export default function AppLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* As telas agora estão descomentadas e visíveis para o navegador */}
      <Drawer.Screen name="(tabs)" options={{ drawerLabel: 'Início' }} />
      <Drawer.Screen name="agenda" options={{ drawerLabel: 'Agenda' }} />
    </Drawer>
  );
}