// Arquivo: app/(app)/notificacoes.tsx (VERSÃO FINAL COM NOVO DESIGN)

import { useAuth } from '@/context/AuthContext';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { firestore } from '../../src/config/firebaseConfig';
import { Notification } from '../../src/types';
import { formatTimeAgo } from '../../src/utils/formatDate';

// O tipo agora inclui todos os campos necessários
interface NotificationWithSender extends Notification {
  senderName?: string;
  senderProfilePicUrl?: string;
}

export default function NotificacoesScreen() {
  const { user, userData } = useAuth();
  const [notifications, setNotifications] = useState<NotificationWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<NotificationWithSender | null>(null);

  const isAdminOrStaff = userData?.role === 'administrador' || userData?.role === 'staff';

  const fetchNotifications = useCallback(() => {
    if (!user) return;
    const userNotificationsQuery = query(
      collection(firestore, "notifications"),
      where("userId", "in", [user.uid, "todos"]),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(userNotificationsQuery, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationWithSender));
      setNotifications(fetchedNotifications);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const markAllAsRead = async () => {
    if (!user) return;
    const userRef = doc(firestore, "usuarios", user.uid);
    updateDoc(userRef, { lastNotificationCheck: serverTimestamp() });
    const q = query(
      collection(firestore, "notifications"),
      where("userId", "==", user.uid),
      where("isRead", "==", false)
    );
    const unreadSnapshot = await getDocs(q);
    if (unreadSnapshot.empty) return;
    const batch = writeBatch(firestore);
    unreadSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isRead: true });
    });
    await batch.commit();
  };

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = fetchNotifications();
      markAllAsRead();
      return () => unsubscribe && unsubscribe();
    }, [fetchNotifications])
  );

  const handleDeleteNotification = (notification: NotificationWithSender) => {
    setNotificationToDelete(notification);
    setDeleteModalVisible(true);
  };

  const confirmDeleteNotification = async () => {
    if (!notificationToDelete) return;
    try {
      await deleteDoc(doc(firestore, 'notifications', notificationToDelete.id));
      Alert.alert("Sucesso", "A notificação foi excluída.");
    } catch (error) {
      console.error("Erro ao excluir notificação: ", error);
      Alert.alert("Erro", "Não foi possível excluir a notificação.");
    } finally {
      setDeleteModalVisible(false);
      setNotificationToDelete(null);
    }
  };

  const getIconForType = (type: Notification['type']) => {
    switch (type) {
      case 'payment': return 'check-circle';
      case 'announcement': return 'volume-2';
      default: return 'bell';
    }
  };

  const getSenderInitials = (senderName?: string) => {
    if (!senderName) return 'AD'; // Admin
    const names = senderName.split(' ');
    const firstInitial = names[0]?.[0]?.toUpperCase() || '';
    const lastInitial = names.length > 1 ? names[names.length - 1]?.[0]?.toUpperCase() || '' : '';
    return `${firstInitial}${lastInitial}`;
  };

  const renderItem = ({ item }: { item: NotificationWithSender }) => {
    const lastCheck = userData?.lastNotificationCheck?.toDate() || new Date(0);
    const isUnread = (item.userId === 'todos' && item.timestamp?.toDate() > lastCheck) || (item.userId === user?.uid && !item.isRead);

    return (
      <View style={styles.notificationCard}>
        <View style={styles.avatarContainer}>
          {item.senderProfilePicUrl ? (
            <Image source={{ uri: item.senderProfilePicUrl }} style={styles.avatarImage} />
          ) : item.senderName ? (
            <View style={styles.avatarInitialsCircle}>
              <Text style={styles.avatarInitialsText}>{getSenderInitials(item.senderName)}</Text>
            </View>
          ) : (
            <View style={styles.iconCircle}>
              <Feather name={getIconForType(item.type)} size={22} color="#005A9C" />
            </View>
          )}
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.timestamp}>{formatTimeAgo(item.timestamp)}</Text>
        </View>

        {isAdminOrStaff && (
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteNotification(item)}>
            <Feather name="trash-2" size={20} color="#B0BCC5" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificações</Text>
        {isAdminOrStaff ? (
          <TouchableOpacity onPress={() => router.push('/(app)/novo-aviso')}>
            <Feather name="plus" size={28} color="#005A9C" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#005A9C" />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="bell-off" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Nenhuma notificação por aqui.</Text>
            </View>
          }
        />
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={isDeleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <Pressable style={styles.deleteModalBackdrop} onPress={() => setDeleteModalVisible(false)}>
          <Pressable style={styles.deleteModalView}>
            <Text style={styles.deleteModalTitle}>Excluir Notificação</Text>
            <Text style={styles.deleteModalSubtitle}>Tem certeza que deseja excluir esta notificação? Esta ação não pode ser desfeita.</Text>
            <View style={styles.deleteModalButtonRow}>
              <TouchableOpacity style={[styles.deleteModalButton, styles.cancelButton]} onPress={() => setDeleteModalVisible(false)}>
                <Text style={[styles.deleteModalButtonText, styles.cancelButtonText]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.deleteModalButton, styles.confirmDeleteButton]} onPress={confirmDeleteNotification}>
                <Text style={styles.deleteModalButtonText}>Sim, excluir</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ESTILOS FINAIS BASEADOS NA IMAGEM DE EXEMPLO
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FC' },
  header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A202C' },
  listContainer: { padding: 15 },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: "#9FB1CC",
    shadowOffset: { width: 0, height: 4, },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    alignItems: 'flex-start', // Alinha itens no topo para textos de múltiplos tamanhos
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarInitialsCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialsText: {
    color: '#4A5568',
    fontSize: 16,
    fontWeight: 'bold',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 2,
  },
  message: {
    fontSize: 15,
    color: '#4A5568',
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 13,
    color: '#718096',
    marginTop: 6,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: '40%' },
  emptyText: { marginTop: 15, fontSize: 16, color: '#A0AEC0' },
  deleteModalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', },
  deleteModalView: { width: '90%', maxWidth: 340, backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center', },
  deleteModalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10, },
  deleteModalSubtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 25, lineHeight: 22, },
  deleteModalButtonRow: { flexDirection: 'row', width: '100%', },
  deleteModalButton: { flex: 1, paddingVertical: 14, borderRadius: 25, marginHorizontal: 5, alignItems: 'center', },
  confirmDeleteButton: { backgroundColor: '#dc3545', },
  cancelButton: { backgroundColor: '#f1f1f1', },
  deleteModalButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', },
  cancelButtonText: { color: '#333', fontWeight: 'bold' },
});