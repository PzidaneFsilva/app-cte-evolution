// Arquivo: app/(app)/novo-post.tsx (VERSÃO COMPLETA E CORRIGIDA)

import { useAuth } from '@/context/AuthContext';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { firestore, storage } from '../../src/config/firebaseConfig';

export default function NovoPostScreen() {
  const { user, userData } = useAuth();
  const [texto, setTexto] = useState('');
  const [imagem, setImagem] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [isImagePickerVisible, setImagePickerVisible] = useState(false);

  const getInitials = () => {
    if (!userData?.nomeCompleto) return '';
    const names = userData.nomeCompleto.split(' ');
    const firstInitial = names[0]?.[0] || '';
    const lastInitial = names.length > 1 ? names[names.length - 1]?.[0] || '' : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  const tirarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permissão necessária", "Você precisa permitir o acesso à câmera para tirar fotos.");
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.5,
    });
    
    // CORREÇÃO: Modal fecha apenas DEPOIS da ação
    setImagePickerVisible(false);
    if (!resultado.canceled) {
      setImagem(resultado.assets[0].uri);
    }
  };

  const escolherDaGaleria = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permissão necessária", "Você precisa permitir o acesso à galeria para postar fotos.");
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.5,
    });
    
    // CORREÇÃO: Modal fecha apenas DEPOIS da ação
    setImagePickerVisible(false);
    if (!resultado.canceled) {
      setImagem(resultado.assets[0].uri);
    }
  };
  
  const handlePostar = async () => {
    if (!texto.trim() && !imagem) { Alert.alert("Atenção", "Escreva um texto ou selecione uma imagem."); return; }
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
        isPinned: false, // <-- CORREÇÃO: Garante que o post apareça no feed
      });

      Alert.alert("Sucesso!", "Seu post foi publicado.");
      router.back();

    } catch (error) { console.error("Erro ao postar:", error); Alert.alert("Erro", "Não foi possível publicar seu post.");
    } finally { setEnviando(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} disabled={enviando}>
            <Feather name="x" size={26} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.postButton, (!texto.trim() && !imagem) && styles.postButtonDisabled]} 
            onPress={handlePostar} 
            disabled={enviando || (!texto.trim() && !imagem)}
          >
            {enviando ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.postButtonText}>Postar</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.userInfo}>
            {userData?.profilePicUrl ? (
                <Image source={{ uri: userData.profilePicUrl }} style={styles.profilePic} />
            ) : (
                <View style={styles.initialsContainer}>
                    <Text style={styles.initialsText}>{getInitials()}</Text>
                </View>
            )}
            <Text style={styles.userName}>{userData?.nomeCompleto}</Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="No que você está pensando?"
            placeholderTextColor="#999"
            multiline
            value={texto}
            onChangeText={setTexto}
          />

          {imagem && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imagem }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImageButton} onPress={() => setImagem(null)}>
                <Feather name="x" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        
        <View style={styles.toolbar}>
            <TouchableOpacity style={styles.toolbarButton} onPress={() => setImagePickerVisible(true)}>
                <Feather name="camera" size={30} color="#007bff" />
            </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isImagePickerVisible}
        onRequestClose={() => setImagePickerVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setImagePickerVisible(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Adicionar Imagem</Text>
            
            <TouchableOpacity style={styles.modalOption} onPress={tirarFoto}>
              <Feather name="camera" size={22} color="#333" />
              <Text style={styles.modalOptionText}>Tirar Foto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={escolherDaGaleria}>
              <Feather name="image" size={22} color="#333" />
              <Text style={styles.modalOptionText}>Escolher da Galeria</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalOption, styles.modalCancel]} onPress={() => setImagePickerVisible(false)}>
              <Text style={[styles.modalOptionText, styles.modalCancelText]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: 'white'
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 10,
      paddingTop: 50,
      backgroundColor: 'white',
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    postButton: { 
      backgroundColor: '#007bff', 
      paddingVertical: 8, 
      paddingHorizontal: 22, 
      borderRadius: 20 
    },
    postButtonDisabled: {
      backgroundColor: '#a9d0f5', 
    },
    postButtonText: { 
      color: 'white', 
      fontWeight: 'bold', 
      fontSize: 16 
    },
    scrollContent: { 
      padding: 20,
      flexGrow: 1,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    profilePic: {
      width: 45,
      height: 45,
      borderRadius: 22.5,
      marginRight: 12,
    },
    initialsContainer: {
      width: 45,
      height: 45,
      borderRadius: 22.5,
      marginRight: 12,
      backgroundColor: '#005A9C',
      justifyContent: 'center',
      alignItems: 'center',
    },
    initialsText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    userName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
    },
    input: { 
      fontSize: 18, 
      minHeight: 120, 
      textAlignVertical: 'top',
      color: '#333',
    },
    imagePreviewContainer: {
      marginTop: 20,
      position: 'relative',
    },
    imagePreview: { 
      width: '100%', 
      height: 350, 
      borderRadius: 15,
    },
    removeImageButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderRadius: 15,
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    toolbar: {
      flexDirection: 'row',
      paddingHorizontal: 15,
      paddingVertical: 5,
      paddingBottom: 40,
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0',
      backgroundColor: '#fff',
      alignItems: 'center',
    },
    toolbarButton: {
      padding: 20,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: 'white',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 40,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20,
      color: '#333',
    },
    modalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      padding: 15,
      borderRadius: 12,
      marginBottom: 10,
    },
    modalOptionText: {
      fontSize: 16,
      marginLeft: 15,
      color: '#333',
    },
    modalCancel: {
      backgroundColor: 'transparent',
      marginTop: 10,
      justifyContent: 'center',
    },
    modalCancelText: {
      fontWeight: 'bold',
      color: '#007bff',
      marginLeft: 0, 
    },
});