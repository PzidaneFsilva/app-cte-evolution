// Arquivo: app/(app)/perfil.tsx (VERSÃO COM CORREÇÃO DEFINITIVA)

import { useAuth } from '@/context/AuthContext';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { firestore, storage } from '../../src/config/firebaseConfig';

export default function PerfilScreen() {
  const { user, userData } = useAuth();
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [imagemUri, setImagemUri] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (userData) {
      const nomeCompleto = userData.nomeCompleto || '';
      const partesNome = nomeCompleto.split(' ');
      setNome(partesNome?.[0] || '');
      setSobrenome(partesNome?.slice(1).join(' ') || '');
      setImagemUri(userData?.profilePicUrl || null);
    }
  }, [userData]);

  const selecionarImagem = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permissão necessária", "É preciso permitir o acesso à galeria.");
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      // A CORREÇÃO DEFINITIVA ESTÁ AQUI
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!resultado.canceled) {
      setImagemUri(resultado.assets?.[0]?.uri || null);
    }
  };

  const handleSalvar = async () => {
    if (!user || !nome || !sobrenome) {
      Alert.alert("Atenção", "Nome e sobrenome são obrigatórios.");
      return;
    }
    setSalvando(true);
    try {
      let profilePicUrl = userData?.profilePicUrl || '';

      if (imagemUri && imagemUri !== userData?.profilePicUrl) {
        const response = await fetch(imagemUri);
        const blob = await response.blob();
        const storageRef = ref(storage, `profile_pictures/${user.uid}`);
        await uploadBytesResumable(storageRef, blob);
        profilePicUrl = await getDownloadURL(storageRef);
      }

      const userRef = doc(firestore, 'usuarios', user.uid);
      await updateDoc(userRef, {
        nomeCompleto: `${nome} ${sobrenome}`,
        profilePicUrl: profilePicUrl,
      });

      Alert.alert("Sucesso", "Perfil atualizado!");
      router.back();
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      Alert.alert("Erro", "Não foi possível atualizar o perfil.");
    } finally {
      setSalvando(false);
    }
  };

  const getInitials = () => {
    if (!nome) return '';
    const firstInitial = nome?.[0] || '';
    const lastInitial = sobrenome ? (sobrenome.split(' ').pop() || '')?.[0] || '' : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <TouchableOpacity style={styles.profilePicContainer} onPress={selecionarImagem}>
          {imagemUri ? (
            <Image source={{ uri: imagemUri }} style={styles.profilePic} />
          ) : (
            <View style={styles.initialsContainer}>
              <Text style={styles.initialsText}>{getInitials()}</Text>
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Feather name="camera" size={16} color="white" />
          </View>
        </TouchableOpacity>
        <View style={styles.inputContainer}>
          <Feather name="user" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Nome"
            value={nome}
            onChangeText={setNome}
            placeholderTextColor="#aaa"
          />
        </View>
        <View style={styles.inputContainer}>
          <Feather name="user" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Sobrenome"
            value={sobrenome}
            onChangeText={setSobrenome}
            placeholderTextColor="#aaa"
          />
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={handleSalvar} disabled={salvando}>
          {salvando ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#f4f4f4', }, header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#ddd', }, headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', }, content: { padding: 20, alignItems: 'center', }, profilePicContainer: { width: 100, height: 100, borderRadius: 50, marginBottom: 20, position: 'relative', overflow: 'hidden', borderWidth: 2, borderColor: 'white', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2, }, profilePic: { width: '100%', height: '100%', }, initialsContainer: { width: '100%', height: '100%', backgroundColor: '#005A9C', justifyContent: 'center', alignItems: 'center', }, initialsText: { color: 'white', fontSize: 32, fontWeight: 'bold', }, cameraIcon: { position: 'absolute', bottom: 5, right: 5, backgroundColor: 'rgba(0, 90, 156, 0.8)', padding: 6, borderRadius: 12, }, inputContainer: { width: '100%', height: 50, backgroundColor: 'white', borderRadius: 12, marginBottom: 15, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: '#e0e0e0', }, inputIcon: { marginRight: 10, color: '#aaa', }, input: { flex: 1, fontSize: 16, color: '#333', }, saveButton: { width: '100%', height: 50, backgroundColor: '#005A9C', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1, }, saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', },});