// Imports para TelaLogin.tsx
import { auth } from '@/config/firebaseConfig'; // Apenas o 'auth' é necessário aqui
import { router } from 'expo-router';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert("Atenção", "Por favor, preencha e-mail e senha.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      console.log("Login bem-sucedido!", userCredential.user.uid);
      router.replace('/'); // Navega para a área principal do app

    } catch (error) {
      let errorMessage = "E-mail ou senha inválidos. Tente novamente.";
      if (error instanceof Error) {
        console.error("Erro no login: ", error.message);
      } else {
        console.error("Erro desconhecido no login: ", error);
      }
      Alert.alert("Erro", errorMessage);
    }
  };

  // 2. Adicionada a nova função para redefinir a senha
  const handleEsqueciSenha = () => {
    if (!email) {
      Alert.alert("Atenção", "Por favor, digite seu e-mail no campo acima para redefinir a senha.");
      return;
    }
    sendPasswordResetEmail(auth, email)
      .then(() => {
        Alert.alert("Verifique seu E-mail", "Enviamos um link para você redefinir sua senha.");
      })
      .catch((error) => {
        console.error("Erro ao redefinir senha: ", error);
        Alert.alert("Erro", "Não foi possível enviar o e-mail de redefinição. Verifique se o e-mail está correto.");
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={{ color: '#aaa' }}>Centro de Treinamento Evolution</Text>
      </View>

      <Text style={styles.slogan}>SUA SAÚDE EM MELHOR ESTILO</Text>

      <TextInput
        style={styles.input}
        placeholder="E-mail ou CPF"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry={true}
        placeholderTextColor="#888"
      />

      {/* Botão ENTRAR que estava faltando, agora de volta */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>ENTRAR</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/cadastro')}>
        <Text style={styles.signupText}>Não possui conta? Faça seu cadastro!</Text>
      </TouchableOpacity>
      
      {/* 3. Link "Esqueci minha senha" com a função correta no onPress */}
      <TouchableOpacity onPress={handleEsqueciSenha}>
        <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.helpButton}>
        <Text style={styles.helpButtonText}>?</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', paddingHorizontal: 20, },
  logoContainer: { width: '100%', height: 100, justifyContent: 'center', alignItems: 'center', marginVertical: 40, },
  slogan: { fontSize: 22, fontWeight: '600', color: '#333', textAlign: 'center', marginBottom: 40, },
  input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16, },
  button: { width: '100%', height: 50, backgroundColor: '#007bff', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10, },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', },
  signupText: { marginTop: 20, color: '#007bff', fontSize: 16, },
  // 4. Adicionado o novo estilo para o link de redefinir senha
  forgotPasswordText: {
    marginTop: 15,
    color: '#555',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  helpButton: { position: 'absolute', left: 20, bottom: 20, width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', },
  helpButtonText: { fontSize: 20, fontWeight: 'bold', color: '#555', },
});