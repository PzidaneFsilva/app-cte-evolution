import { auth } from '@/config/firebaseConfig';
import { router } from 'expo-router';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from 'react';
// 1. IMPORTE O MODAL E OUTROS COMPONENTES NECESSÁRIOS
import { ActivityIndicator, Alert, Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  
  // 2. ESTADOS PARA CONTROLAR O MODAL E O E-MAIL DE REDEFINIÇÃO
  const [modalVisivel, setModalVisivel] = useState(false);
  const [emailRedefinicao, setEmailRedefinicao] = useState('');
  const [loading, setLoading] = useState(false); // NOVO: Estado de carregamento

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert("Atenção", "Por favor, preencha e-mail e senha.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      console.log("Login bem-sucedido!");
    } catch (error) {
      // ... (seu tratamento de erro de login continua o mesmo)
      Alert.alert("Erro", "E-mail ou senha inválidos.");
    }
  };

  // 3. LÓGICA DE REDEFINIÇÃO ATUALIZADA PARA O MODAL
  const handleRedefinirSenha = () => {
    if (loading) return; // NOVO: Impede cliques se já estiver carregando
    if (!emailRedefinicao) {
      Alert.alert("Atenção", "Por favor, digite seu e-mail.");
      return;
    }

    setLoading(true); // NOVO: Inicia o carregamento

    sendPasswordResetEmail(auth, emailRedefinicao)
      .then(() => {
        // Explicação sobre a "garantia"
        Alert.alert(
          "Verifique seu E-mail",
          "Se este e-mail estiver cadastrado em nossa base de dados, um link para redefinição de senha foi enviado."
        );
        setModalVisivel(false); // Fecha o modal após o sucesso
        setEmailRedefinicao(''); // Limpa o campo
      })
      .catch((error) => {
        console.error("Erro ao redefinir senha: ", error);
        Alert.alert("Erro", "Ocorreu um erro ao tentar enviar o e-mail de redefinição.");
      })
      .finally(() => {
        setLoading(false); // NOVO: Finaliza o carregamento, ocorrendo erro ou sucesso.
      });
      
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 4. O MODAL PARA REDEFINIÇÃO DE SENHA */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisivel}
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Redefinir Senha</Text>
            <Text style={styles.modalText}>
              Digite o e-mail associado à sua conta para receber o link de redefinição.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Digite seu e-mail"
              value={emailRedefinicao}
              onChangeText={setEmailRedefinicao}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#888"
            />
            <View style={styles.modalButtonRow}>
              <Pressable
                style={[styles.modalButton, styles.buttonCancel]}
                onPress={() => setModalVisivel(false)}
              >
                <Text style={styles.textStyle}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.buttonConfirm]}
                onPress={handleRedefinirSenha}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" /> // NOVO: Mostra um indicador de carregamento
                ) : (
                <Text style={styles.textStyle}>Enviar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* O RESTANTE DA SUA TELA DE LOGIN PERMANECE IGUAL */}
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
      
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>ENTRAR</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/cadastro')}>
        <Text style={styles.signupText}>Não possui conta? Faça seu cadastro!</Text>
      </TouchableOpacity>
      
      {/* 5. AGORA O BOTÃO APENAS ABRE O MODAL */}
      <TouchableOpacity onPress={() => setModalVisivel(true)}>
        <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.helpButton}>
        <Text style={styles.helpButtonText}>?</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// 6. ADICIONEI OS ESTILOS PARA O MODAL
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', paddingHorizontal: 20, },
  logoContainer: { width: '100%', height: 100, justifyContent: 'center', alignItems: 'center', marginVertical: 40, },
  slogan: { fontSize: 22, fontWeight: '600', color: '#333', textAlign: 'center', marginBottom: 40, },
  input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16, },
  button: { width: '100%', height: 50, backgroundColor: '#007bff', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10, },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', },
  signupText: { marginTop: 20, color: '#007bff', fontSize: 16, },
  forgotPasswordText: {
    marginTop: 15,
    color: '#555',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  helpButton: { position: 'absolute', left: 20, bottom: 20, width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', },
  helpButtonText: { fontSize: 20, fontWeight: 'bold', color: '#555', },
  
  // Estilos do Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fundo escurecido
  },
  modalView: {
    width: '90%',
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  modalInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonCancel: {
    backgroundColor: '#6c757d',
  },
  buttonConfirm: {
    backgroundColor: '#007bff',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});