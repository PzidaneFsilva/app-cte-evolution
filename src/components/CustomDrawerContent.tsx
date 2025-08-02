// ficheiro: CustomDrawerContent.tsx (VERSÃO ATUALIZADA)

import { useAuth } from '@/context/AuthContext'; // 1. IMPORTE O useAuth
import { Feather } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../config/firebaseConfig';

export default function CustomDrawerContent(props: any) {
  const { userData } = useAuth(); // 2. PEGUE OS DADOS DO USUÁRIO

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/');
    } catch (error) {
      console.error("Erro ao fazer logout: ", error);
    }
  };

  // 3. FUNÇÃO PARA PEGAR AS INICIAIS
  const getInitials = () => {
    if (!userData?.nomeCompleto) return '..';
    const names = userData.nomeCompleto.split(' ');
    const firstInitial = names[0]?.[0] || '';
    const lastInitial = names.length > 1 ? names[names.length - 1]?.[0] || '' : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        {/* 4. NOVO CABEÇALHO DO PERFIL */}
        <TouchableOpacity style={styles.profileContainer} onPress={() => router.push('/(app)/perfil')}>
          {userData?.profilePicUrl ? (
            <Image source={{ uri: userData.profilePicUrl }} style={styles.profilePic} />
          ) : (
            <View style={styles.initialsContainer}>
              <Text style={styles.initialsText}>{getInitials()}</Text>
            </View>
          )}
          <Text style={styles.profileName}>{userData?.nomeCompleto || 'Carregando...'}</Text>
        </TouchableOpacity>
        
        <View style={styles.separator} />

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
  // 5. NOVOS ESTILOS PARA O PERFIL
  profileContainer: { padding: 20, alignItems: 'center' },
  profilePic: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
  initialsContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#005A9C', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  initialsText: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  profileName: { fontSize: 18, fontWeight: 'bold' },
  separator: { borderBottomColor: '#eee', borderBottomWidth: 1, marginVertical: 10 },
  
  logoutButton: { flexDirection: 'row', alignItems: 'center', padding: 20, margin: 10, marginBottom: 20, borderRadius: 12, backgroundColor: '#f0f0f0' },
  logoutButtonText: { marginLeft: 15, color: '#333', fontSize: 16, fontWeight: '500' },
});