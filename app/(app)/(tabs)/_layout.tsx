// Arquivo: app/(app)/(tabs)/_layout.tsx (VERSÃO CORRIGIDA)

import { useAuth } from '@/context/AuthContext';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const { userData } = useAuth();

  return (
    <Tabs 
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#005A9C',
      }}>
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => <Feather name="home" size={28} color={color} />,
        }}
      />
      
      {/* --- O BLOCO DA TELA 'EXPLORE' FOI REMOVIDO DAQUI --- */}
      
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color }) => <Feather name="shield" size={28} color={color} />,
          href: (userData?.role === 'administrador' || userData?.role === 'staff') 
            ? '/admin' 
            : null,
        }}
      />
    </Tabs>
  );
}