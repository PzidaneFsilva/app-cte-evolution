// Arquivo: app/(app)/(tabs)/admin.tsx (VERSÃO COM HIERARQUIA CORRIGIDA)

import { firestore } from '@/config/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface Usuario {
  id: string;
  nomeCompleto: string;
  email: string;
  celular: string;
  role: 'aluno' | 'staff' | 'administrador';
  status: 'pendente' | 'aprovado' | 'bloqueado' | 'suspenso';
}

export default function AdminPanelScreen() {
  const { user, userData } = useAuth(); // ATUALIZADO: Pegar também o 'user' para o ID
  const [usuariosPendentes, setUsuariosPendentes] = useState<Usuario[]>([]);
  const [usuariosAtivos, setUsuariosAtivos] = useState<Usuario[]>([]);
  const [usuariosSuspensos, setUsuariosSuspensos] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [abaSelecionada, setAbaSelecionada] = useState<'pendentes' | 'ativos' | 'suspensos'>('pendentes');

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const qPendentes = query(collection(firestore, "usuarios"), where("status", "==", "pendente"));
      const snapPendentes = await getDocs(qPendentes);
      setUsuariosPendentes(snapPendentes.docs.map(doc => ({ id: doc.id, ...doc.data() } as Usuario)));

      const qAprovados = query(collection(firestore, "usuarios"), where("status", "==", "aprovado"));
      const snapAprovados = await getDocs(qAprovados);
      setUsuariosAtivos(snapAprovados.docs.map(doc => ({ id: doc.id, ...doc.data() } as Usuario)));

      const qSuspensos = query(collection(firestore, "usuarios"), where("status", "==", "suspenso"));
      const snapSuspensos = await getDocs(qSuspensos);
      setUsuariosSuspensos(snapSuspensos.docs.map(doc => ({ id: doc.id, ...doc.data() } as Usuario)));

    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      Alert.alert("Erro", "Não foi possível carregar as listas de usuários.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchUsuarios(); }, []));
  const onRefresh = () => { setRefreshing(true); fetchUsuarios(); };

  const handleUpdateUser = async (userId: string, updates: Partial<Usuario>) => {
    const userRef = doc(firestore, "usuarios", userId);
    try {
      await updateDoc(userRef, updates);
      let successMessage = "Usuário atualizado com sucesso!";
      if (updates.status === 'aprovado') successMessage = "Usuário foi reativado!";
      else if (updates.status === 'bloqueado') successMessage = "Usuário foi bloqueado.";
      else if (updates.status === 'suspenso') successMessage = "A conta do usuário foi suspensa.";
      else if (updates.role === 'administrador') successMessage = "Usuário promovido para Administrador.";
      else if (updates.role === 'aluno') successMessage = "Usuário rebaixado para Aluno.";
      Alert.alert("Sucesso!", successMessage);
      fetchUsuarios();
    } catch (error) {
      console.error(`Erro ao atualizar usuário:`, error);
      Alert.alert("Erro", "Não foi possível atualizar o usuário.");
    }
  };

  // --- FUNÇÃO ATUALIZADA COM A LÓGICA DE HIERARQUIA COMPLETA ---
  const renderUsuarioAtivo = ({ item }: { item: Usuario }) => {
    // Nenhuma ação deve ser visível se:
    // 1. O usuário alvo for 'staff'.
    // 2. O usuário alvo for a mesma pessoa que está logada.
    const canManage = item.role !== 'staff' && item.id !== user?.uid;

    return (
      <View style={styles.userCard}>
          <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.nomeCompleto}</Text>
              <Text style={styles.userDetails}>{item.email}</Text>
              <Text style={[styles.roleBadge, styles[item.role]]}>{item.role.toUpperCase()}</Text>
          </View>
          
          {canManage && (
            <View style={styles.actions}>
                {/* LÓGICA DO BOTÃO SUSPENDER */}
                {(
                  // Staff pode suspender admins e alunos
                  userData?.role === 'staff' ||
                  // Admin SÓ pode suspender alunos
                  (userData?.role === 'administrador' && item.role === 'aluno')
                ) && (
                  <TouchableOpacity style={styles.suspendButton} onPress={() => handleUpdateUser(item.id, { status: 'suspenso' })}>
                      <Feather name="pause-circle" size={20} color="white" />
                  </TouchableOpacity>
                )}

                {/* LÓGICA DOS BOTÕES PROMOVER/REBAIXAR (SÓ PARA STAFF) */}
                {userData?.role === 'staff' && (
                    <>
                        {item.role === 'aluno' && (
                             <TouchableOpacity style={styles.promoteButton} onPress={() => handleUpdateUser(item.id, { role: 'administrador' })}>
                                <Feather name="arrow-up-circle" size={20} color="white" />
                            </TouchableOpacity>
                        )}
                        {item.role === 'administrador' && (
                            <TouchableOpacity style={styles.demoteButton} onPress={() => handleUpdateUser(item.id, { role: 'aluno' })}>
                                <Feather name="arrow-down-circle" size={20} color="white" />
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </View>
          )}
      </View>
    );
  };
  
  // As outras funções de renderização e a estrutura principal permanecem as mesmas.
  const renderUsuarioPendente = ({ item }: { item: Usuario }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.nomeCompleto}</Text>
        <Text style={styles.userDetails}>{item.email}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.denyButton} onPress={() => handleUpdateUser(item.id, { status: 'bloqueado' })}>
          <Feather name="x" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.approveButton} onPress={() => handleUpdateUser(item.id, { status: 'aprovado' })}>
          <Feather name="check" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderUsuarioSuspenso = ({ item }: { item: Usuario }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.nomeCompleto}</Text>
        <Text style={styles.userDetails}>{item.email}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.approveButton} onPress={() => handleUpdateUser(item.id, { status: 'aprovado' })}>
          <Feather name="play-circle" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLista = () => {
    let data, renderFunction, emptyMessage;
    switch (abaSelecionada) {
      case 'ativos':
        data = usuariosAtivos;
        renderFunction = renderUsuarioAtivo;
        emptyMessage = "Nenhum usuário ativo.";
        break;
      case 'suspensos':
        data = usuariosSuspensos;
        renderFunction = renderUsuarioSuspenso;
        emptyMessage = "Nenhum usuário suspenso.";
        break;
      case 'pendentes':
      default:
        data = usuariosPendentes;
        renderFunction = renderUsuarioPendente;
        emptyMessage = "Nenhuma aprovação pendente.";
    }

    if (loading && !refreshing) return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#005A9C" />;
    if (data.length === 0) return <View style={styles.emptyContainer}><Feather name="inbox" size={60} color="#ccc" /><Text style={styles.emptyText}>{emptyMessage}</Text></View>;

    return <FlatList data={data} renderItem={renderFunction} keyExtractor={(item) => item.id} contentContainerStyle={styles.listContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>Painel do Administrador</Text></View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, abaSelecionada === 'pendentes' && styles.tabButtonActive]} onPress={() => setAbaSelecionada('pendentes')}>
          <Text style={[styles.tabText, abaSelecionada === 'pendentes' && styles.tabTextActive]}>Pendentes ({usuariosPendentes.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, abaSelecionada === 'ativos' && styles.tabButtonActive]} onPress={() => setAbaSelecionada('ativos')}>
          <Text style={[styles.tabText, abaSelecionada === 'ativos' && styles.tabTextActive]}>Ativos ({usuariosAtivos.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, abaSelecionada === 'suspensos' && styles.tabButtonActive]} onPress={() => setAbaSelecionada('suspensos')}>
          <Text style={[styles.tabText, abaSelecionada === 'suspensos' && styles.tabTextActive]}>Suspensos ({usuariosSuspensos.length})</Text>
        </TouchableOpacity>
      </View>
      {renderLista()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    header: { backgroundColor: '#fff', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#ddd', },
    headerTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
    tabContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ddd', },
    tabButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, },
    tabButtonActive: { backgroundColor: '#005A9C' },
    tabText: { fontSize: 13, fontWeight: '600', color: '#005A9C' },
    tabTextActive: { color: '#fff' },
    listContainer: { padding: 10 },
    userCard: { backgroundColor: 'white', borderRadius: 8, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, },
    userInfo: { flex: 1, marginRight: 10 },
    userName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    userDetails: { fontSize: 14, color: '#666' },
    actions: { flexDirection: 'row', alignItems: 'center' },
    approveButton: { backgroundColor: '#28a745', padding: 12, borderRadius: 50, marginLeft: 10, },
    denyButton: { backgroundColor: '#dc3545', padding: 12, borderRadius: 50, },
    suspendButton: { backgroundColor: '#ffc107', padding: 12, borderRadius: 50, },
    promoteButton: { backgroundColor: '#17a2b8', padding: 12, borderRadius: 50, marginLeft: 10, },
    demoteButton: { backgroundColor: '#6c757d', padding: 12, borderRadius: 50, marginLeft: 10, },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, },
    emptyText: { marginTop: 15, fontSize: 16, color: '#888', textAlign: 'center' },
    roleBadge: { marginTop: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, fontSize: 10, fontWeight: 'bold', color: 'white', alignSelf: 'flex-start', },
    aluno: { backgroundColor: '#007bff' },
    staff: { backgroundColor: '#6f42c1' },
    administrador: { backgroundColor: '#fd7e14' },
});