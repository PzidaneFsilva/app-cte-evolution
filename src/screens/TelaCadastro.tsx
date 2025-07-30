// Imports para TelaCadastro.tsx
import { auth, firestore } from '@/config/firebaseConfig'; // Importa 'auth' e 'firestore'
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaskedTextInput } from "react-native-mask-text";

export default function TelaCadastro() {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [celular, setCelular] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const handleCadastro = async () => {
    // Validações
    if (!nome || !sobrenome || !celular || !email || !senha || !confirmarSenha) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }
    if (celular.length < 15) {
      Alert.alert("Erro", "Número de celular inválido.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;
      await sendEmailVerification(user);
      Alert.alert("Verifique seu E-mail!", "Enviamos um link de confirmação para o seu e-mail.");

      await setDoc(doc(firestore, "usuarios", user.uid), {
        nomeCompleto: `${nome} ${sobrenome}`,
        email: email,
        celular: celular,
        role: "aluno",
        createdAt: new Date(),
      });
      
      console.log("Usuário criado com sucesso no Auth e Firestore!");
      router.back();

    } catch (error) {
      console.error("Erro no cadastro: ", error);
      // 2. BLOCO 'CATCH' CORRIGIDO PARA O TYPESCRIPT
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === 'auth/email-already-in-use') {
          Alert.alert("Erro", "Este e-mail já está em uso.");
        } else if (firebaseError.code === 'auth/weak-password') {
          Alert.alert("Erro", "A senha deve ter no mínimo 6 caracteres.");
        } else {
          Alert.alert("Erro", "Ocorreu um erro ao criar a conta.");
        }
      } else {
        Alert.alert("Erro", "Ocorreu um erro desconhecido.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="chevron-left" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cadastro</Text>
        <View style={{width: 28}} />
      </View>

      {/* Corpo do Formulário */}
      <ScrollView style={styles.body}>
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.inputHalf]} placeholder="Nome" value={nome} onChangeText={setNome} />
          <TextInput style={[styles.input, styles.inputHalf]} placeholder="Sobrenome" value={sobrenome} onChangeText={setSobrenome} />
        </View>
        <MaskedTextInput
          mask="(99) 99999-9999"
          style={styles.input}
          placeholder="Número do celular"
          keyboardType="phone-pad"
          value={celular}
          onChangeText={setCelular}
        />
        <TextInput style={styles.input} placeholder="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Senha (mín. 6 caracteres)" value={senha} onChangeText={setSenha} secureTextEntry />
        <TextInput style={styles.input} placeholder="Confirmar Senha" value={confirmarSenha} onChangeText={setConfirmarSenha} secureTextEntry />

        <TouchableOpacity style={styles.button} onPress={handleCadastro}>
          <Text style={styles.buttonText}>CRIAR CONTA</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#005A9C' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#005A9C' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  body: { flex: 1, backgroundColor: '#f0f2f5', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  input: { backgroundColor: 'white', height: 50, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16 },
  inputHalf: { width: '48%' },
  button: { width: '100%', height: 50, backgroundColor: '#005A9C', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10, },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});