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
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color }) => <Feather name="compass" size={28} color={color} />,
        }}
      />
      
      {/* --- CORREÇÃO AQUI --- */}
      {/* A tela 'admin' é sempre declarada, mas só é navegável se a condição for atendida. */}
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color }) => <Feather name="shield" size={28} color={color} />,
          // Se a condição não for atendida, 'href: null' esconde a aba da barra.
          href: (userData?.role === 'administrador' || userData?.role === 'staff') 
            ? '/admin' 
            : null,
        }}
      />
    </Tabs>
  );
}