// Arquivo: app/(app)/(tabs)/admin.tsx (VERSÃO COM ORDENAÇÃO INTELIGENTE)

import { firestore } from '@/config/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Calendar } from 'react-native-calendars';

interface Usuario {
  id: string;
  nomeCompleto: string;
  email: string;
  celular: string;
  role: 'aluno' | 'staff' | 'administrador';
  status: 'pendente' | 'aprovado' | 'bloqueado' | 'suspenso';
  dataEntrada?: { toDate: () => Date };
  ultimoPagamento?: { toDate: () => Date };
  dataInicioCiclo?: { toDate: () => Date };
  // Propriedade adicionada para ajudar na ordenação
  proximoVencimento?: Date | null;
}

const calcularProximoVencimento = (dataInicioCiclo?: Date, dataEntrada?: Date, ultimoPagamento?: Date): Date | null => {
    const baseDate = dataInicioCiclo || ultimoPagamento || dataEntrada;
    if (!baseDate) return null;
    const proximoVencimento = new Date(baseDate);
    proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);
    return proximoVencimento;
};

const deveExibirBotaoPagamento = (dataVencimento: Date | null): boolean => {
    if (!dataVencimento) return false;
    const hoje = new Date();
    const dataLimite = new Date(dataVencimento.getTime() + (24 * 60 * 60 * 1000)); 
    const diffEmMs = dataLimite.getTime() - hoje.getTime();
    const diffEmDias = diffEmMs / (1000 * 60 * 60 * 24);
    return diffEmDias <= 5 && diffEmDias >= 0; 
};


export default function AdminPanelScreen() {
  const { user, userData } = useAuth();
  const [usuariosPendentes, setUsuariosPendentes] = useState<Usuario[]>([]);
  const [usuariosAtivos, setUsuariosAtivos] = useState<Usuario[]>([]);
  const [usuariosSuspensos, setUsuariosSuspensos] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [abaSelecionada, setAbaSelecionada] = useState<'pendentes' | 'ativos' | 'suspensos'>('pendentes');
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [userToEditDate, setUserToEditDate] = useState<Usuario | null>(null);

  const functions = getFunctions();

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const hoje = new Date();
      const qUsuariosParaVerificar = query(collection(firestore, "usuarios"), where("status", "==", "aprovado"), where("role", "==", "aluno"));
      const snapParaVerificar = await getDocs(qUsuariosParaVerificar);

      for (const docSnapshot of snapParaVerificar.docs) {
          const u = docSnapshot.data() as Usuario;
          const dataVencimento = calcularProximoVencimento(u.dataInicioCiclo?.toDate(), u.dataEntrada?.toDate(), u.ultimoPagamento?.toDate());
          
          if (dataVencimento && hoje > dataVencimento) {
              await updateDoc(doc(firestore, "usuarios", docSnapshot.id), { status: 'suspenso' });
          }
      }

      const qPendentes = query(collection(firestore, "usuarios"), where("status", "==", "pendente"));
      const snapPendentes = await getDocs(qPendentes);
      setUsuariosPendentes(snapPendentes.docs.map(doc => ({ id: doc.id, ...doc.data() } as Usuario)));

      const qAprovados = query(collection(firestore, "usuarios"), where("status", "==", "aprovado"));
      const snapAprovados = await getDocs(qAprovados);
      
      // ##################################################################
      // INÍCIO DA LÓGICA DE ORDENAÇÃO INTELIGENTE
      // ##################################################################
      const aprovadosData = snapAprovados.docs.map(doc => {
          const data = { id: doc.id, ...doc.data() } as Usuario;
          data.proximoVencimento = calcularProximoVencimento(
              data.dataInicioCiclo?.toDate(),
              data.dataEntrada?.toDate(),
              data.ultimoPagamento?.toDate()
          );
          return data;
      });

      aprovadosData.sort((a, b) => {
          const roleOrder = { staff: 0, administrador: 1, aluno: 2 };

          // 1. Ordena por hierarquia de cargo
          if (roleOrder[a.role] !== roleOrder[b.role]) {
              return roleOrder[a.role] - roleOrder[b.role];
          }

          // 2. Se o cargo for o mesmo
          if (a.role === 'aluno') {
              const vencA = a.proximoVencimento;
              const vencB = b.proximoVencimento;

              if (vencA && vencB) {
                  // Se as datas de vencimento forem diferentes, ordena pela mais próxima
                  if (vencA.getTime() !== vencB.getTime()) {
                      return vencA.getTime() - vencB.getTime();
                  }
              } else if (vencA) {
                  return -1; // 'a' tem data e 'b' não, 'a' vem primeiro
              } else if (vencB) {
                  return 1; // 'b' tem data e 'a' não, 'b' vem primeiro
              }
          }
          
          // 3. Para todos os outros casos (mesmo cargo ou datas iguais), ordena por nome
          return a.nomeCompleto.localeCompare(b.nomeCompleto);
      });

      setUsuariosAtivos(aprovadosData);
      // ##################################################################
      // FIM DA LÓGICA DE ORDENAÇÃO
      // ##################################################################

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

  const handleUpdateUser = async (userId: string, updates: Partial<Usuario>, isReactivating: boolean = false) => {
    const userRef = doc(firestore, "usuarios", userId);
    try {
        const userDocSnapshot = await getDocs(query(collection(firestore, "usuarios"), where("__name__", "==", userId)));
        if(userDocSnapshot.empty){
            throw new Error("Usuário não encontrado para obter dados.");
        }
        const currentUserData = userDocSnapshot.docs[0].data();

        if (updates.status === 'aprovado' && !currentUserData.dataEntrada) {
          updates.dataEntrada = new Date() as any;
        }
        
        if (isReactivating && updates.status === 'aprovado') {
            updates.ultimoPagamento = new Date() as any; 
            updates.dataInicioCiclo = new Date() as any;
        }

        await updateDoc(userRef, updates);
        let successMessage = "Usuário atualizado com sucesso!";
        if (updates.status === 'aprovado') {
            successMessage = isReactivating ? "Usuário foi reativado!" : "Usuário aprovado com sucesso!";
        }
        
        Alert.alert("Sucesso!", successMessage);
        fetchUsuarios();
    } catch (error) {
      console.error(`Erro ao atualizar usuário:`, error);
      Alert.alert("Erro", "Não foi possível atualizar o usuário.");
    }
  };

  const handleUpdateCycleDate = (day: any) => {
    if (!userToEditDate) return;
    const novaData = new Date(day.timestamp + (new Date().getTimezoneOffset() * 60000));
    
    Alert.alert(
      "Confirmar Data",
      `Deseja definir ${novaData.toLocaleDateString('pt-BR')} como a nova data de início do ciclo para ${userToEditDate.nomeCompleto}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, Definir",
          onPress: async () => {
            const userRef = doc(firestore, "usuarios", userToEditDate.id);
            try {
              await updateDoc(userRef, { 
                dataInicioCiclo: novaData,
                ultimoPagamento: novaData,
                status: 'aprovado'
              });
              Alert.alert("Sucesso!", "A data do ciclo de pagamento foi atualizada.");
              setDatePickerVisible(false);
              setUserToEditDate(null);
              fetchUsuarios();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível atualizar a data.");
            }
          },
        },
      ]
    );
  };
  
  const handleConfirmPayment = async (userId: string) => {
    try {
        const userRef = doc(firestore, "usuarios", userId);
        const newPaymentDate = new Date();
        await updateDoc(userRef, { 
          ultimoPagamento: newPaymentDate,
          dataInicioCiclo: newPaymentDate
        });
        Alert.alert("Sucesso!", "Pagamento confirmado. O ciclo foi renovado.");
        fetchUsuarios(); 
    } catch (error) {
        console.error("Erro ao confirmar pagamento:", error);
        Alert.alert("Erro", "Não foi possível confirmar o pagamento.");
    }
  };
  
  const handleDeleteUser = (usuario: Usuario) => {
    setUserToDelete(usuario);
    setDeleteModalVisible(true);
  };

  const banUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteDoc(doc(firestore, "usuarios", userToDelete.id));
      Alert.alert("Sucesso!", `O usuário "${userToDelete.nomeCompleto}" foi banido e não poderá criar uma nova conta com este e-mail.`);
      fetchUsuarios();
    } catch (error) {
      console.error("Erro ao banir usuário:", error);
      Alert.alert("Erro", "Não foi possível banir o usuário.");
    } finally {
      setDeleteModalVisible(false);
      setUserToDelete(null);
    }
  };

  const fullyDeleteUser = async () => {
    if (!userToDelete) return;
    try {
        const deleteUserFunction = httpsCallable(functions, 'deleteUser');
        await deleteUserFunction({ uid: userToDelete.id });

        Alert.alert("Sucesso!", `O usuário "${userToDelete.nomeCompleto}" foi permanentemente excluído e pode se cadastrar novamente.`);
        fetchUsuarios();
    } catch (error) {
        console.error("Erro ao excluir usuário permanentemente:", error);
        Alert.alert("Erro", "Não foi possível realizar a exclusão total. Verifique se a Cloud Function está implantada.");
    } finally {
        setDeleteModalVisible(false);
        setUserToDelete(null);
    }
  };
  
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

  const renderUsuarioAtivo = ({ item }: { item: Usuario }) => {
    const canManage = item.role !== 'staff' && item.id !== user?.uid;
    const showPaymentButton = deveExibirBotaoPagamento(item.proximoVencimento || null);
    const displayDate = item.dataInicioCiclo?.toDate() || item.dataEntrada?.toDate();
    const formattedDate = displayDate ? displayDate.toLocaleDateString('pt-BR') : 'N/D';
    const formattedVencimento = item.proximoVencimento ? item.proximoVencimento.toLocaleDateString('pt-BR') : 'N/D';
    const dateLabel = item.dataInicioCiclo ? 'Início do Ciclo:' : 'Entrada:';

    return (
      <View style={styles.userCard}>
          <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.nomeCompleto}</Text>
              <Text style={styles.entryDateText}>{dateLabel} {formattedDate}</Text>
              <Text style={styles.vencimentoText}>Próx. Vencimento: {formattedVencimento}</Text> 
              <Text style={[styles.roleBadge, styles[item.role]]}>{item.role.toUpperCase()}</Text>
          </View>
          <View style={styles.actions}>
                {item.role === 'aluno' && (
                  <TouchableOpacity style={styles.dateButton} onPress={() => { setUserToEditDate(item); setDatePickerVisible(true); }}>
                    <Feather name="calendar" size={20} color="white" />
                  </TouchableOpacity>
                )}
                {item.role === 'aluno' && showPaymentButton && (
                    <TouchableOpacity style={styles.paymentButton} onPress={() => handleConfirmPayment(item.id)}>
                        <Feather name="dollar-sign" size={20} color="white" />
                    </TouchableOpacity>
                )}
                {canManage && (
                    (userData?.role === 'staff' || (userData?.role === 'administrador' && item.role === 'aluno')) && (
                        <TouchableOpacity style={styles.suspendButton} onPress={() => handleUpdateUser(item.id, { status: 'suspenso' })}>
                            <Feather name="pause-circle" size={20} color="white" />
                        </TouchableOpacity>
                    )
                )}
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
      </View>
    );
  };
  
  const renderUsuarioSuspenso = ({ item }: { item: Usuario }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.nomeCompleto}</Text>
        <Text style={styles.userDetails}>{item.email}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteUser(item)}>
            <Feather name="trash-2" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.reactivateButton} onPress={() => handleUpdateUser(item.id, { status: 'aprovado' }, true)}>
          <Feather name="play-circle" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLista = () => {
    let data, renderFunction, emptyMessage;
    switch (abaSelecionada) {
      case 'ativos': data = usuariosAtivos; renderFunction = renderUsuarioAtivo; emptyMessage = "Nenhum usuário ativo."; break;
      case 'suspensos': data = usuariosSuspensos; renderFunction = renderUsuarioSuspenso; emptyMessage = "Nenhum usuário suspenso."; break;
      default: data = usuariosPendentes; renderFunction = renderUsuarioPendente; emptyMessage = "Nenhuma aprovação pendente.";
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
      
      <Modal animationType="fade" transparent={true} visible={isDeleteModalVisible} onRequestClose={() => setDeleteModalVisible(false)}>
        <Pressable style={styles.deleteModalBackdrop} onPress={() => setDeleteModalVisible(false)}>
            <Pressable style={styles.deleteModalView}>
                <Text style={styles.deleteModalTitle}>Gerenciar Usuário</Text>
                <Text style={styles.deleteModalSubtitle}>O que você deseja fazer com "{userToDelete?.nomeCompleto}"?</Text>
                
                <TouchableOpacity style={[styles.deleteModalButton, styles.banButton]} onPress={banUser}>
                    <Feather name="slash" size={20} color="white" style={{marginRight: 10}} />
                    <Text style={styles.deleteModalButtonText}>Banir Usuário</Text>
                </TouchableOpacity>
                <Text style={styles.buttonDescription}>Impede o login e um novo cadastro com o mesmo e-mail.</Text>

                <TouchableOpacity style={[styles.deleteModalButton, styles.confirmDeleteButton]} onPress={fullyDeleteUser}>
                    <Feather name="trash-2" size={20} color="white" style={{marginRight: 10}} />
                    <Text style={styles.deleteModalButtonText}>Excluir Permanentemente</Text>
                </TouchableOpacity>
                <Text style={styles.buttonDescription}>Apaga tudo e libera o e-mail para um novo cadastro.</Text>

                <TouchableOpacity style={styles.cancelLink} onPress={() => setDeleteModalVisible(false)}>
                    <Text style={styles.cancelLinkText}>Cancelar</Text>
                </TouchableOpacity>
            </Pressable>
        </Pressable>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={isDatePickerVisible} onRequestClose={() => setDatePickerVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setDatePickerVisible(false)}>
          <View style={styles.calendarModalView}>
            <Text style={styles.modalTitle}>Ajustar Início do Ciclo</Text>
            <Text style={styles.modalSubtitle}>
              Selecione a data que servirá como base para os próximos pagamentos de {userToEditDate?.nomeCompleto}.
            </Text>
            <Calendar
              onDayPress={handleUpdateCycleDate}
              monthFormat={'MMMM yyyy'}
              theme={{ todayTextColor: '#005A9C', arrowColor: '#005A9C', selectedDayBackgroundColor: '#005A9C' }}
            />
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setDatePickerVisible(false)}>
              <Text style={styles.modalCancelText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
    entryDateText: { fontSize: 12, color: '#888', fontStyle: 'italic', marginBottom: 2 },
    vencimentoText: { fontSize: 12, color: '#C70039', fontWeight: '500', marginBottom: 6 },
    actions: { flexDirection: 'row', alignItems: 'center' },
    approveButton: { backgroundColor: '#28a745', padding: 12, borderRadius: 50, marginLeft: 10, },
    denyButton: { backgroundColor: '#dc3545', padding: 12, borderRadius: 50, },
    deleteButton: { backgroundColor: '#dc3545', padding: 12, borderRadius: 50, },
    reactivateButton: { backgroundColor: '#28a745', padding: 12, borderRadius: 50, marginLeft: 10 },
    suspendButton: { backgroundColor: '#ffc107', padding: 12, borderRadius: 50, marginLeft: 10, },
    promoteButton: { backgroundColor: '#17a2b8', padding: 12, borderRadius: 50, marginLeft: 10, },
    demoteButton: { backgroundColor: '#6c757d', padding: 12, borderRadius: 50, marginLeft: 10, },
    dateButton: { backgroundColor: '#6f42c1', padding: 12, borderRadius: 50, marginLeft: 10, },
    paymentButton: { backgroundColor: '#17a2b8', padding: 12, borderRadius: 50, marginLeft: 10, },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, },
    emptyText: { marginTop: 15, fontSize: 16, color: '#888', textAlign: 'center' },
    roleBadge: { marginTop: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, fontSize: 10, fontWeight: 'bold', color: 'white', alignSelf: 'flex-start', },
    aluno: { backgroundColor: '#007bff' },
    staff: { backgroundColor: '#6f42c1' },
    administrador: { backgroundColor: '#fd7e14' },
    deleteModalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center',},
    deleteModalView: { width: '90%', maxWidth: 360, backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    deleteModalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10,},
    deleteModalSubtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 25, lineHeight: 22, },
    deleteModalButton: { width: '100%', paddingVertical: 14, borderRadius: 12, marginBottom: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    banButton: { backgroundColor: '#ffc107' },
    confirmDeleteButton: { backgroundColor: '#dc3545' },
    deleteModalButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    buttonDescription: { fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 20, width: '90%' },
    cancelLink: { marginTop: 15 },
    cancelLinkText: { color: '#007bff', fontSize: 16 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' },
    calendarModalView: { width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 20, },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    modalSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
    modalCancelButton: { marginTop: 15, padding: 10 },
    modalCancelText: { textAlign: 'center', color: '#dc3545', fontWeight: 'bold', fontSize: 16 },
});