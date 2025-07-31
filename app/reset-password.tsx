// Arquivo: app/reset-password.tsx (NOVO ARQUIVO)

import { auth } from '@/config/firebaseConfig';
import { router, useLocalSearchParams } from 'expo-router';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function ResetPasswordScreen() {
  // O hook 'useLocalSearchParams' pega os parâmetros da URL, como o código de redefinição.
  const { oobCode } = useLocalSearchParams();

  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidCode, setIsValidCode] = useState(false);
  const [checkingCode, setCheckingCode] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  // 1. VERIFICAR SE O CÓDIGO DO LINK É VÁLIDO
  useEffect(() => {
    if (!oobCode || Array.isArray(oobCode)) {
      Alert.alert("Erro", "Link de redefinição inválido ou expirado.");
      setCheckingCode(false);
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        setUserEmail(email); // Guarda o e-mail do usuário
        setIsValidCode(true); // O código é válido, podemos mostrar os campos de senha
      })
      .catch((error) => {
        console.error("Erro ao verificar código:", error);
        Alert.alert("Erro", "O link de redefinição é inválido ou já foi utilizado. Por favor, tente novamente.");
        router.replace('/'); // Manda de volta para o login
      })
      .finally(() => {
        setCheckingCode(false);
      });
  }, [oobCode]);


  // 2. FUNÇÃO PARA SALVAR A NOVA SENHA
  const handleConfirmReset = () => {
    if (loading) return;

    if (!senha || !confirmarSenha) {
      Alert.alert("Atenção", "Por favor, preencha e confirme a nova senha.");
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }
    if (senha.length < 6) {
      Alert.alert("Erro", "A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (!oobCode || Array.isArray(oobCode)) return;

    setLoading(true);
    confirmPasswordReset(auth, oobCode, senha)
      .then(() => {
        Alert.alert(
          "Sucesso!",
          "Sua senha foi redefinida. Você já pode fazer o login com a nova senha."
        );
        router.replace('/'); // Redireciona para a tela de login
      })
      .catch((error) => {
        console.error("Erro ao confirmar nova senha:", error);
        Alert.alert("Erro", "Não foi possível redefinir a senha. Por favor, solicite um novo link.");
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  // Enquanto o código está sendo verificado
  if (checkingCode) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.infoText}>Verificando link...</Text>
      </View>
    );
  }
  
  // Se o código for inválido
  if (!isValidCode) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>Link inválido ou expirado.</Text>
      </View>
    );
  }

  // Se o código for válido, mostra a tela para criar a nova senha
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Crie uma nova senha</Text>
      <Text style={styles.subtitle}>Redefinindo a senha para: {userEmail}</Text>

      <TextInput
        style={styles.input}
        placeholder="Nova Senha (mín. 6 caracteres)"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry={true}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Confirmar Nova Senha"
        value={confirmarSenha}
        onChangeText={setConfirmarSenha}
        secureTextEntry={true}
        placeholderTextColor="#888"
      />

      <TouchableOpacity style={styles.button} onPress={handleConfirmReset} disabled={loading}>
        {loading ? (
            <ActivityIndicator color="#fff" />
        ) : (
            <Text style={styles.buttonText}>SALVAR NOVA SENHA</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Estilos semelhantes aos que você já usa
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007bff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});