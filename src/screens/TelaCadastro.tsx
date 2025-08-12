// Arquivo: src/screens/TelaCadastro.tsx (VERSÃO COMPLETA)

import { auth, firestore } from '@/config/firebaseConfig';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from 'react';
import { Alert, Linking, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaskedTextInput } from "react-native-mask-text";

export default function TelaCadastro() {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [celular, setCelular] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [aceitaTermos, setAceitaTermos] = useState(false); 

  const handleCadastro = async () => {
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
    if (!aceitaTermos) {
      Alert.alert("Atenção", "Você deve aceitar os termos de uso para criar sua conta.");
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
        status: "pendente",
        createdAt: new Date(),
      });
      
      console.log("Usuário criado com status pendente!");

    } catch (error) {
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

  const handleOpenTermsOfService = () => {
      const url = "https://github.com/PzidaneFsilva/Pol-tica-de-Privacidade---Centro-de-Treinamento-Evolution/blob/main/Politica%20de%20Privacidade%20-%20Centro%20de%20Treinamento%20Evolution.pdf";
      Linking.openURL(url).catch(err => console.error('Erro ao abrir a URL', err));
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="chevron-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crie sua Conta</Text>
        <View style={{width: 28}} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.subtitle}>Preencha seus dados para começar a treinar.</Text>

        <View style={styles.row}>
          <View style={[styles.inputContainer, styles.inputHalf]}>
            <Feather name="user" size={20} color="#888" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Nome" value={nome} onChangeText={setNome} placeholderTextColor="#888" />
          </View>
          <View style={[styles.inputContainer, styles.inputHalf]}>
            <TextInput style={styles.input} placeholder="Sobrenome" value={sobrenome} onChangeText={setSobrenome} placeholderTextColor="#888" />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Feather name="smartphone" size={20} color="#888" style={styles.inputIcon} />
          <MaskedTextInput
            mask="(99) 99999-9999"
            style={styles.input}
            placeholder="Número do celular"
            keyboardType="phone-pad"
            value={celular}
            onChangeText={setCelular}
            placeholderTextColor="#888"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Feather name="mail" size={20} color="#888" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#888" />
        </View>

        <View style={styles.inputContainer}>
          <Feather name="lock" size={20} color="#888" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Senha (mín. 6 caracteres)" value={senha} onChangeText={setSenha} secureTextEntry placeholderTextColor="#888" />
        </View>
        
        <View style={styles.inputContainer}>
          <Feather name="lock" size={20} color="#888" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Confirmar Senha" value={confirmarSenha} onChangeText={setConfirmarSenha} secureTextEntry placeholderTextColor="#888" />
        </View>

        <View style={styles.termsContainer}>
            <TouchableOpacity onPress={() => setAceitaTermos(!aceitaTermos)}>
                <Feather 
                    name={aceitaTermos ? "check-square" : "square"} 
                    size={24} 
                    color={aceitaTermos ? "#007bff" : "#666"} 
                    style={{ marginRight: 10 }}
                />
            </TouchableOpacity>
            <Text style={styles.termsText}>
                Eu li e aceito os <Text style={styles.termsLink} onPress={handleOpenTermsOfService}>termos de uso</Text>.
            </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleCadastro}>
          <Text style={styles.buttonText}>CRIAR CONTA</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f0f2f5' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingBottom: 15,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#333'
  },
  body: { 
    paddingHorizontal: 25,
    paddingVertical: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 27.5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 20,
    height: 55, 
    marginBottom: 15, 
  },
  input: { 
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  inputHalf: { 
    width: '48.5%', 
    marginBottom: 0, 
  },
  inputIcon: {
    marginRight: 10,
  },
  button: { 
    height: 55, 
    backgroundColor: '#007bff', 
    borderRadius: 27.5,
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    flexShrink: 1,
  },
  termsLink: {
    color: '#007bff',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  }
});