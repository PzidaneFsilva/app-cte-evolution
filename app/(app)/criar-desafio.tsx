// Arquivo: app/(app)/criar-desafio.tsx (VERSÃO COM DESIGN MODERNIZADO)

import { Feather } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useFocusEffect } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { firestore } from '../../src/config/firebaseConfig';

type Desafio = {
  id: string;
  nome: string;
  ativo: boolean;
};

export default function GerenciarDesafiosScreen() {
  const [nome, setNome] = useState('');
  const [duracao, setDuracao] = useState<15 | 30>(30);
  const [loading, setLoading] = useState(false);
  const [desafios, setDesafios] = useState<Desafio[]>([]);
  const [loadingDesafios, setLoadingDesafios] = useState(true);
  const [isDurationModalVisible, setIsDurationModalVisible] = useState(false);
  const navigation = useNavigation();

  const fetchDesafios = async () => {
    setLoadingDesafios(true);
    try {
      const q = query(collection(firestore, "desafios"));
      const snap = await getDocs(q);
      const desafiosList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Desafio));
      setDesafios(desafiosList);
    } catch (error) {
      console.error("Erro ao buscar desafios:", error);
    } finally {
      setLoadingDesafios(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDesafios(); }, []));

  const handleCriarDesafio = async () => {
    if (!nome) { Alert.alert("Atenção", "O desafio precisa de um nome."); return; }
    setLoading(true);
    try {
      const batch = writeBatch(firestore);
      const qDesafiosAtivos = query(collection(firestore, "desafios"), where("ativo", "==", true));
      const desafiosAtivosSnap = await getDocs(qDesafiosAtivos);
      desafiosAtivosSnap.forEach(doc => {
        batch.update(doc.ref, { ativo: false });
      });

      const dataInicio = new Date();
      const dataFim = new Date();
      dataFim.setDate(dataInicio.getDate() + duracao);

      const novoDesafioRef = doc(collection(firestore, 'desafios'));
      batch.set(novoDesafioRef, { nome, dataInicio, dataFim, ativo: true, criadoEm: serverTimestamp() });
      
      await batch.commit();
      Alert.alert("Sucesso!", "O novo desafio foi criado e ativado.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível criar o desafio.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizarDesafio = (desafio: Desafio) => {
    Alert.alert(
      "Finalizar Desafio",
      `Tem certeza que deseja encerrar o desafio "${desafio.nome}"? O pódio será preenchido com os vencedores atuais.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, Finalizar",
          onPress: async () => {
            try {
              const desafioRef = doc(firestore, "desafios", desafio.id);
              await updateDoc(desafioRef, { ativo: false });
              Alert.alert("Sucesso!", "Desafio finalizado. O ranking agora mostra os vencedores.");
              fetchDesafios();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível finalizar o desafio.");
            }
          }
        }
      ]
    );
  };

  const handleDeletarDesafio = (desafio: Desafio) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja remover o desafio "${desafio.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(firestore, "desafios", desafio.id));
              Alert.alert("Sucesso!", "O desafio foi removido.");
              fetchDesafios();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível remover o desafio.");
              console.error(error);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} disabled={loading}>
                <Feather name="menu" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Gerenciar Desafios</Text>
            <View style={{ width: 28 }} />
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Criar Novo Desafio</Text>
                <TextInput style={styles.input} placeholder="Nome do Desafio (ex: Agosto Ativo)" value={nome} onChangeText={setNome} />
                <Text style={styles.label}>Duração:</Text>
                
                <TouchableOpacity style={styles.input} onPress={() => setIsDurationModalVisible(true)}>
                    <Text style={styles.inputText}>{duracao} Dias</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={handleCriarDesafio} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Iniciar Novo Desafio</Text>}
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Desafios Existentes</Text>
                {loadingDesafios ? <ActivityIndicator color="#005A9C" /> : (
                    desafios.length > 0 ? desafios.map(item => (
                        <View key={item.id} style={styles.desafioCard}>
                            <View>
                                <Text style={styles.desafioNome}>{item.nome}</Text>
                                <View style={[styles.statusBadge, item.ativo ? styles.statusAtivo : styles.statusInativo]}>
                                  <Text style={styles.statusText}>
                                      {item.ativo ? 'ATIVO' : 'FINALIZADO'}
                                  </Text>
                                </View>
                            </View>
                            <View style={styles.actionsContainer}>
                                {item.ativo && (
                                    <TouchableOpacity style={[styles.actionButton, styles.finishButton]} onPress={() => handleFinalizarDesafio(item)}>
                                    <Feather name="flag" size={20} color="#fff" />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDeletarDesafio(item)}>
                                    <Feather name="trash-2" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )) : <Text style={styles.emptyText}>Nenhum desafio criado ainda.</Text>
                )}
            </View>
        </ScrollView>
        
        {/* Modal para seleção de duração */}
        <Modal
            animationType="fade"
            transparent={true}
            visible={isDurationModalVisible}
            onRequestClose={() => setIsDurationModalVisible(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Selecione a Duração</Text>
                    <TouchableOpacity style={styles.modalOption} onPress={() => { setDuracao(15); setIsDurationModalVisible(false); }}>
                        <Text style={styles.modalOptionText}>15 Dias</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalOption} onPress={() => { setDuracao(30); setIsDurationModalVisible(false); }}>
                        <Text style={styles.modalOptionText}>30 Dias</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalCancelButton} onPress={() => setIsDurationModalVisible(false)}>
                        <Text style={styles.modalCancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f8ff' },
  scrollView: { flex: 1 },
  header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  section: { backgroundColor: 'white', padding: 20, margin: 15, borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  input: { width: '100%', height: 50, backgroundColor: '#f0f2f5', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 25, paddingHorizontal: 20, marginBottom: 20, fontSize: 16, justifyContent: 'center' },
  inputText: { fontSize: 16, color: '#333' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: '#555' },
  button: { width: '100%', height: 50, backgroundColor: '#005A9C', borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 10, },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  desafioCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  desafioNome: { fontSize: 16, fontWeight: '500', color: '#444' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 5, alignSelf: 'flex-start' },
  statusAtivo: { backgroundColor: '#d4edda' },
  statusInativo: { backgroundColor: '#e2e3e5' },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
  actionsContainer: { flexDirection: 'row' },
  actionButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  finishButton: { backgroundColor: '#28a745' },
  deleteButton: { backgroundColor: '#dc3545' },
  emptyText: { color: 'gray', textAlign: 'center', paddingVertical: 20 },

  // Estilos do Modal
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalView: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  modalOption: { width: '100%', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalOptionText: { textAlign: 'center', fontSize: 16, color: '#005A9C' },
  modalCancelButton: { width: '100%', paddingVertical: 15, marginTop: 10 },
  modalCancelButtonText: { textAlign: 'center', fontSize: 16, color: '#dc3545', fontWeight: 'bold' },
});