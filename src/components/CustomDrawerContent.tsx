// ficheiro: CustomDrawerContent.tsx (VERSÃO CORRIGIDA)

import { auth } from '@/config/firebaseConfig';
import { Feather } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CustomDrawerContent(props: any) {
  const handleLogout = async () => {
    try {
    await signOut(auth);
    console.log("Usuário deslogado. O AuthLayout agora deve redirecionar.");

    // Reseta a navegação forçando início no index
    router.replace('/');
  } catch (error) {
    console.error("Erro ao fazer logout: ", error);
  }
};

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Meu App</Text>
        </View>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Feather name="log-out" size={22} color="#333" />
        <Text style={styles.logoutButtonText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    margin: 10,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  logoutButtonText: {
    marginLeft: 15,
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
});