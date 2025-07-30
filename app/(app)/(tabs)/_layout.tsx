// Arquivo: app/(app)/(tabs)/_layout.tsx (VERSÃO CORRIGIDA)

import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#005A9C', // Usando nosso azul
      }}>
      <Tabs.Screen
        name="index" // Refere-se a app/(app)/(tabs)/index.tsx (TelaFeed)
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => <Feather name="home" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore" // Refere-se a app/(app)/(tabs)/explore.tsx
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color }) => <Feather name="compass" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}