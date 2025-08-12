// Arquivo: app/(app)/novo-aviso.tsx (VERSÃO COM LAYOUT AJUSTADO)

import { useAuth } from '@/context/AuthContext';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { firestore } from '../../src/config/firebaseConfig';

export default function NovoAvisoScreen() {
  const { userData } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Atenção", "Por favor, preencha o título e a mensagem.");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(firestore, 'notifications'), {
        title: title,
        message: message,
        timestamp: serverTimestamp(),
        isRead: false,
        userId: 'todos',
        type: 'announcement',
        senderName: userData?.nomeCompleto || 'Administração',
        senderProfilePicUrl: userData?.profilePicUrl || ''
      });
      Alert.alert("Sucesso!", "Seu aviso foi enviado para todos os alunos.");
      router.back();
    } catch (error) {
      console.error("Erro ao enviar aviso: ", error);
      Alert.alert("Erro", "Não foi possível enviar o aviso.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nova notificação</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* A propriedade 'justifyContent' foi removida daqui para o conteúdo subir */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Título do Aviso"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#888"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Digite a mensagem do seu aviso aqui..."
            value={message}
            onChangeText={setMessage}
            multiline
            placeholderTextColor="#888"
          />
          <TouchableOpacity
            style={[styles.button, (!title.trim() || !message.trim()) && styles.buttonDisabled]}
            onPress={handleSend}
            disabled={loading || !title.trim() || !message.trim()}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Enviar para Todos</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  keyboardView: { flex: 1 }, // justifyContent foi removido
  form: { 
    padding: 20,
    paddingTop: 30, // Adicionado um espaçamento no topo do formulário
  },
  input: { backgroundColor: '#f0f2f5', borderRadius: 12, padding: 15, fontSize: 16, marginBottom: 15, },
  textArea: { height: 150, textAlignVertical: 'top' },
  button: { 
    backgroundColor: '#007bff', // COR DO BOTÃO ATUALIZADA
    borderRadius: 25, 
    paddingVertical: 15, 
    alignItems: 'center', 
    marginTop: 10, 
  },
  buttonDisabled: { backgroundColor: '#a9d0f5' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});