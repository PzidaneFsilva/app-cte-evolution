import React from 'react';
import {
  Image // Precisamos do componente Image
  ,




  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { Feather } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native'; // Importa as ações da Gaveta
import { useNavigation } from 'expo-router'; // 1. IMPORTE O useNavigation


export default function TelaFeed() {
  const navigation = useNavigation(); // 2. PEGUE O CONTROLE DA NAVEGAÇÃO

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer()); // Função para abrir a gaveta
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* 3. ADICIONE O 'onPress' AO BOTÃO */}
          <TouchableOpacity style={styles.profileButton} onPress={openDrawer}>
            <View style={styles.profilePic}>
              <Text style={styles.profileInitials}>KS</Text>
            </View>
            <View style={styles.plusButton}>
              <Feather name="plus" size={14} color="#007bff" />
            </View>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Timeline</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="message-square" size={26} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="bell" size={26} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTEÚDO DO FEED com a marca d'água */}
      <View style={styles.feedContainer}>
        {/* 1. IMAGEM DA MARCA D'ÁGUA */}
        <Image 
          source={require('@/assets/images/minha-logo.png')}
          style={styles.watermark}
          resizeMode="contain" // Garante que a logo não distorça
        />

        {/* 2. O CONTEÚDO QUE FICA POR CIMA */}
        <ScrollView>
          <Text style={styles.placeholderText}>Conteúdo do Feed aparecerá aqui...</Text>
        </ScrollView>
      </View>

    </SafeAreaView>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#005A9C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 10,
    backgroundColor: '#005A9C',
    paddingTop: 50,
  },
  // ... (outros estilos do cabeçalho continuam os mesmos)
  headerLeft: { flex: 1, justifyContent: 'flex-start' },
  profileButton: { position: 'relative', width: 44, height: 44 },
  profilePic: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  profileInitials: { color: '#005A9C', fontSize: 16, fontWeight: 'bold' },
  plusButton: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#005A9C' },
  headerTitle: { flex: 2, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: 'white' },
  headerRight: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  iconButton: { marginLeft: 20 },
  
  // Estilos do Feed
  feedContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5', 
    // A View precisa ter um 'position: relative' para que a imagem absoluta se posicione dentro dela
    position: 'relative', 
  },
  // AQUI ESTÁ A LÓGICA DA MARCA D'ÁGUA
  watermark: {
    width: '80%', // A imagem vai ocupar 80% da largura do container
    height: '80%', // E 80% da altura
    position: 'absolute', // ESTE É O TRUQUE: solta a imagem do layout normal
    top: '10%', // Posiciona a 10% do topo
    left: '10%', // Posiciona a 10% da esquerda
    // AQUI É ONDE VOCÊ CONTROLA A TRANSPARÊNCIA
    opacity: 0.08, // 0.08 = 8% de visibilidade. Aumente para 0.1, 0.2 etc. para ficar mais forte.
  },
  placeholderText: {
    textAlign: 'center',
    color: 'gray',
    fontSize: 16,
    marginTop: 50,
  }
})