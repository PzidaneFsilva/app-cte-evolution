// Arquivo: app/(app)/novo-post.tsx (VERSÃO COM MELHORIAS DE DESIGN E FUNCIONALIDADE)

import { useAuth } from '@/context/AuthContext';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { firestore, storage } from '../../src/config/firebaseConfig';

export default function NovoPostScreen() {
  const { user, userData } = useAuth();
  const [texto, setTexto] = useState('');
  const [imagem, setImagem] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // 1. FUNÇÃO PRINCIPAL QUE DÁ A OPÇÃO AO USUÁRIO
  const handleSelecionarImagem = () => {
    Alert.alert(
      "Adicionar Imagem",
      "Escolha de onde você quer adicionar a foto:",
      [
        {
          text: "Tirar Foto",
          onPress: () => tirarFoto(),
        },
        {
          text: "Escolher da Galeria",
          onPress: () => escolherDaGaleria(),
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ]
    );
  };
  
  // 2. NOVA FUNÇÃO PARA USAR A CÂMERA
  const tirarFoto = async () => {
    // Solicita permissão para a câmera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permissão necessária", "Você precisa permitir o acesso à câmera para tirar fotos.");
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.3,
    });

    if (!resultado.canceled) {
      setImagem(resultado.assets[0].uri);
    }
  };

  // 3. FUNÇÃO ANTIGA, AGORA FOCADA APENAS NA GALERIA
  const escolherDaGaleria = async () => {
    // Solicita permissão para a galeria
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permissão necessária", "Você precisa permitir o acesso à galeria para postar fotos.");
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.3,
    });

    if (!resultado.canceled) {
      setImagem(resultado.assets[0].uri);
    }
  };


  const handlePostar = async () => {
    if (!texto && !imagem) { Alert.alert("Atenção", "Escreva um texto ou selecione uma imagem."); return; }
    if (!user || !userData) return;

    setEnviando(true);
    let imageUrl = '';

    try {
      if (imagem) {
        const response = await fetch(imagem);
        const blob = await response.blob();
        const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}`);
        const uploadTask = uploadBytesResumable(storageRef, blob);
        await new Promise<void>((resolve, reject) => {
            uploadTask.on('state_changed', 
                () => {}, 
                (error) => reject(error), 
                async () => { imageUrl = await getDownloadURL(uploadTask.snapshot.ref); resolve(); }
            );
        });
      }

      await addDoc(collection(firestore, 'posts'), {
        userId: user.uid,
        userName: userData.nomeCompleto,
        userProfilePicUrl: userData.profilePicUrl || '',
        texto: texto,
        imageUrl: imageUrl,
        timestamp: serverTimestamp(),
        likes: [],
        commentsCount: 0,
      });

      Alert.alert("Sucesso!", "Seu post foi publicado.");
      router.back();

    } catch (error) { console.error("Erro ao postar:", error); Alert.alert("Erro", "Não foi possível publicar seu post.");
    } finally { setEnviando(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={28} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.postButton} onPress={handlePostar} disabled={enviando}>
          {enviando ? <ActivityIndicator color="#fff" /> : <Text style={styles.postButtonText}>Postar</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="No que você está pensando?"
          multiline
          value={texto}
          onChangeText={setTexto}
        />

        {imagem && <Image source={{ uri: imagem }} style={styles.imagemPreview} />}
        
        {/* O BOTÃO AGORA CHAMA A FUNÇÃO QUE MOSTRA AS OPÇÕES */}
        <TouchableOpacity style={styles.imagePickerButton} onPress={handleSelecionarImagem}>
          <Feather name="camera" size={24} color="#555" />
          <Text style={styles.imagePickerText}>Adicionar foto</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    // 4. LAYOUT DO CABEÇALHO CORRIGIDO
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 10,
      paddingTop: 50, // Adiciona espaço no topo para não sobrepor a status bar
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    postButton: { backgroundColor: '#005A9C', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
    postButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    content: { padding: 15 },
    input: { fontSize: 18, minHeight: 100, textAlignVertical: 'top' },
    imagemPreview: { width: '100%', height: 300, borderRadius: 10, marginTop: 20 },
    imagePickerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', padding: 15, borderRadius: 10, marginTop: 20 },
    imagePickerText: { marginLeft: 10, fontSize: 16, color: '#333' }
});