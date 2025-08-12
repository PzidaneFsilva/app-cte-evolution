// Arquivo: src/screens/TelaLogin.tsx (VERSÃO COMPLETA E CORRIGIDA)

import { auth } from '@/config/firebaseConfig';
import { router } from 'expo-router';
// 1. A FUNÇÃO 'sendPasswordResetEmail' FOI ADICIONADA AQUI
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import MinhaLogo from '../assets/images/minha-logor.png';

export default function TelaLogin() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [modalVisivel, setModalVisivel] = useState(false);
  const [emailRedefinicao, setEmailRedefinicao] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert("Atenção", "Por favor, preencha e-mail e senha.");
      return;
    }
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      console.log("Login bem-sucedido!");
    } catch (error) {
      Alert.alert("Erro", "E-mail ou senha inválidos.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRedefinirSenha = () => {
    if (loading) return;
    if (!emailRedefinicao) {
      Alert.alert("Atenção", "Por favor, digite seu e-mail.");
      return;
    }
    setLoading(true);
    sendPasswordResetEmail(auth, emailRedefinicao)
      .then(() => {
        Alert.alert("Verifique seu E-mail", "Se este e-mail estiver cadastrado, um link para redefinição de senha foi enviado.");
        setModalVisivel(false);
        setEmailRedefinicao('');
      })
      // 2. O BLOCO CATCH FOI ATUALIZADO
      .catch((error: any) => {
        console.error("Erro ao enviar e-mail de redefinição:", error); // Adicionado para depuração
        Alert.alert("Erro", "Ocorreu um erro ao tentar enviar o e-mail.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleOpenPrivacyPolicy = () => {
      const url = "https://github.com/PzidaneFsilva/Pol-tica-de-Privacidade---Centro-de-Treinamento-Evolution/blob/main/Politica%20de%20Privacidade%20-%20Centro%20de%20Treinamento%20Evolution.pdf";
      Linking.openURL(url).catch(err => console.error('Erro ao abrir a URL', err));
  };


  return (
    <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
            <Modal
              animationType="fade"
              transparent={true}
              visible={modalVisivel}
              onRequestClose={() => setModalVisivel(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalView}>
                  <Text style={styles.modalTitle}>Redefinir Senha</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Digite seu e-mail"
                    value={emailRedefinicao}
                    onChangeText={setEmailRedefinicao}
                    keyboardType="email-address"
                  />
                  <View style={styles.modalButtonRow}>
                    <Pressable style={[styles.modalButton, styles.buttonCancel]} onPress={() => setModalVisivel(false)}>
                      <Text style={styles.textStyle}>Cancelar</Text>
                    </Pressable>
                    <Pressable style={[styles.modalButton, styles.buttonConfirm]} onPress={handleRedefinirSenha} disabled={loading}>
                      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.textStyle}>Enviar</Text>}
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>

            <View style={styles.logoContainer}>
              <Image source={MinhaLogo} style={styles.logoImage} />
            </View>

            <Text style={styles.title}>Centro de Treinamento Evolution</Text>

            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} placeholder="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <TextInput style={styles.input} placeholder="Senha" value={senha} onChangeText={setSenha} secureTextEntry />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loginLoading}>
              <Text style={styles.buttonText}>{loginLoading ? 'ENTRANDO...' : 'ENTRAR'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisivel(true)}>
              <Text style={styles.linkText}>Esqueceu sua senha?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signupLink} onPress={() => router.push('/cadastro')}>
              <Text style={styles.signupText}>Não possui conta? <Text style={{ fontWeight: 'bold' }}>Faça seu cadastro!</Text></Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
        <TouchableOpacity style={styles.helpButton} onPress={handleOpenPrivacyPolicy}>
            <Text style={styles.helpButtonText}>?</Text>
        </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  logoContainer: { marginBottom: 0, alignItems: 'center' },
  logoImage: { width: 180, height: 180, resizeMode: 'contain' },
  title: { fontSize: 22, fontWeight: '600', color: '#033d66ff', fontFamily: 'SpaceMono', textAlign: 'center', marginBottom: 50 },
  inputWrapper: { width: '100%', marginBottom: 10 },
  input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#ccc', borderRadius: 25, paddingHorizontal: 20, marginBottom: 15, fontSize: 16, backgroundColor: 'white' },
  button: { width: '100%', height: 50, backgroundColor: '#007bff', borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkText: { marginTop: 15, color: '#555', fontSize: 14 },
  signupLink: { marginTop: 15 },
  signupText: { color: '#555', fontSize: 14 },
  helpButton: { position: 'absolute', right: 20, bottom: 50, width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  helpButtonText: { fontSize: 20, fontWeight: 'bold', color: '#555' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalView: { width: '90%', margin: 20, backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  modalInput: { width: '100%', height: 50, borderWidth: 1, borderColor: '#ccc', borderRadius: 25, paddingHorizontal: 20, marginBottom: 20, fontSize: 16 },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalButton: { borderRadius: 8, padding: 12, elevation: 2, flex: 1, marginHorizontal: 5 },
  buttonCancel: { backgroundColor: '#6c757d' },
  buttonConfirm: { backgroundColor: '#007bff' },
  textStyle: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
});