// Arquivo: app/pending-approval.tsx (VERSÃO CORRIGIDA)

import { auth } from '@/config/firebaseConfig';
import { router } from 'expo-router'; // 1. Importar o router do Expo
import { signOut } from 'firebase/auth';
import React from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PendingApprovalScreen() {
  
  // 2. Criar uma função para lidar com o logout e o redirecionamento
  const handleLogout = async () => {
    try {
      await signOut(auth); // Finaliza a sessão do usuário no Firebase
      router.replace('/'); // Força o redirecionamento para a tela de login (a raiz do app)
    } catch (error) {
      console.error("Erro ao tentar sair:", error);
      // Você pode adicionar um Alert.alert aqui se quiser notificar o usuário de um erro
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#005A9C" />
        <Text style={styles.title}>Acesso em Revisão</Text>
        <Text style={styles.message}>
          Sua conta está aguardando a liberação de um administrador.
          Você será notificado quando seu acesso for liberado.
        </Text>
        {/* 3. Chamar a nova função handleLogout no onPress do botão */}
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    alignItems: 'center',
    textAlign: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  button: {
    width: '100%',
    padding: 15,
    backgroundColor: '#6c757d',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});