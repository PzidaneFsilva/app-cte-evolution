// Arquivo: src/screens/TelaFeed.tsx (VERSÃO COMPLETA E ATUALIZADA)

import { Feather } from '@expo/vector-icons';
import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import PostCard from '../components/PostCard';
import { firestore } from '../config/firebaseConfig';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { Post } from '../types';

export default function TelaFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  // O hook agora retorna a contagem
  const unreadCount = useUnreadNotifications();

  const fetchPosts = useCallback(() => {
    const q = query(
      collection(firestore, "posts"), 
      orderBy("isPinned", "desc"), 
      orderBy("timestamp", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData: Post[] = [];
      querySnapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() } as Post);
      });
      setPosts(postsData);
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error("Erro ao buscar posts:", error);
      setLoading(false);
      setRefreshing(false);
    });
    return unsubscribe;
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      const unsubscribe = fetchPosts();
      return () => unsubscribe();
    }, [fetchPosts])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, [fetchPosts]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <Feather name="menu" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Feed</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/notificacoes')}>
            {/* O ícone de sino agora é envolto por uma View para posicionar a bolha */}
            <View>
              <Feather name="bell" size={26} color={unreadCount > 0 ? '#FFC107' : '#333'} />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
        </TouchableOpacity>
      </View>

      <View style={styles.feedContainer}>
        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} size="large" color="#005A9C" />
        ) : (
          <FlatList
            data={posts}
            renderItem={({ item }) => <PostCard post={item} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhum post ainda.</Text>}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#005A9C']}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eaf5ff' },
  header: {
    padding: 15,
    paddingTop: 50,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  list: { paddingVertical: 10 },
  emptyText: { textAlign: 'center', marginTop: 50, color: 'gray', fontSize: 16 },
  feedContainer: {
    flex: 1,
  },
  // Estilos para a bolha de notificação
  notificationBadge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: 'red',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});