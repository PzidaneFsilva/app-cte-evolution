// Arquivo: app/(app)/perfil.tsx (VERSÃO CORRIGIDA E COMPLETA)

import { useAuth } from '@/context/AuthContext';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { firestore, storage } from '../../src/config/firebaseConfig';

export default function PerfilScreen() {
  const { user, userData } = useAuth();
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [imagemUri, setImagemUri] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [isImagePickerVisible, setImagePickerVisible] = useState(false);

  useEffect(() => {
    if (userData) {
      const nomeCompleto = userData.nomeCompleto || '';
      const partesNome = nomeCompleto.split(' ');
      setNome(partesNome?.[0] || '');
      setSobrenome(partesNome?.slice(1).join(' ') || '');
      setImagemUri(userData?.profilePicUrl || null);
    }
  }, [userData]);

  const escolherDaGaleria = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permissão necessária", "É preciso permitir o acesso à galeria.");
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      // Usando a correção que funciona no seu ambiente
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    
    // O modal fecha DEPOIS da ação
    setImagePickerVisible(false);
    if (!resultado.canceled) {
      setImagemUri(resultado.assets?.[0]?.uri || null);
    }
  };
  
  const tirarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert("Permissão necessária", "Você precisa permitir o acesso à câmera para tirar fotos.");
        return;
    }
    const resultado = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
    });
    
    // O modal fecha DEPOIS da ação
    setImagePickerVisible(false);
    if (!resultado.canceled) {
        setImagemUri(resultado.assets[0].uri);
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
          <Feather name="chevron-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.content}>
        <TouchableOpacity style={styles.profilePicContainer} onPress={() => setImagePickerVisible(true)}>
          {imagemUri ? (
            <Image source={{ uri: imagemUri }} style={styles.profilePic} />
          ) : (
            <View style={styles.initialsContainer}>
              <Text style={styles.initialsText}>{getInitials()}</Text>
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Feather name="camera" size={18} color="white" />
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={isImagePickerVisible}
        onRequestClose={() => setImagePickerVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setImagePickerVisible(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Alterar Foto</Text>
            
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
        backgroundColor: '#f0f2f5' 
    },
    header: { 
        paddingTop: 50, 
        paddingBottom: 15, 
        paddingHorizontal: 20, 
        backgroundColor: 'white', 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        borderBottomWidth: 1, 
        borderBottomColor: '#ddd',
    },
    headerTitle: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        color: '#333', 
    },
    content: { 
        padding: 25, 
        alignItems: 'center', 
    },
    profilePicContainer: { 
        width: 120, 
        height: 120, 
        borderRadius: 60, 
        marginBottom: 30, 
        position: 'relative', 
    },
    profilePic: { 
        width: '100%', 
        height: '100%', 
        borderRadius: 60,
        borderWidth: 4,
        borderColor: 'white'
    },
    initialsContainer: { 
        width: '100%', 
        height: '100%', 
        borderRadius: 60,
        backgroundColor: '#007bff',
        justifyContent: 'center', 
        alignItems: 'center', 
        borderWidth: 4,
        borderColor: 'white'
    },
    initialsText: { 
        color: 'white', 
        fontSize: 40, 
        fontWeight: 'bold', 
    },
    cameraIcon: { 
        position: 'absolute', 
        bottom: 5, 
        right: 5, 
        backgroundColor: '#007bff',
        padding: 8, 
        borderRadius: 15, 
    },
    inputContainer: { 
        width: '100%', 
        height: 55, 
        backgroundColor: 'white', 
        borderRadius: 27.5,
        marginBottom: 15, 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        borderWidth: 1, 
        borderColor: '#e0e0e0', 
    },
    inputIcon: { 
        marginRight: 10, 
    },
    input: { 
        flex: 1, 
        fontSize: 16, 
        color: '#333', 
    },
    saveButton: { 
        width: '100%', 
        height: 55, 
        backgroundColor: '#007bff',
        borderRadius: 27.5,
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: 20, 
        elevation: 2, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.2, 
        shadowRadius: 2, 
    },
    saveButtonText: { 
        color: 'white', 
        fontSize: 16, 
        fontWeight: 'bold', 
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