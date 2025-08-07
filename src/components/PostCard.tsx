// Arquivo: src/components/PostCard.tsx (VERSÃO COMPLETA COM TIMESTAMP)

import { useAuth } from '@/context/AuthContext';
import { AntDesign, Feather } from '@expo/vector-icons';
import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDocs, increment, onSnapshot, orderBy, query, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { firestore } from '../config/firebaseConfig';
import { Comment, Post } from '../types';
import { formatTimeAgo } from '../utils/formatDate'; // Importa a função de formatação de data

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { user, userData } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes.length);
  const [commentCount, setCommentCount] = useState(post.commentsCount || 0);
  const [isPinned, setIsPinned] = useState(post.isPinned || false);

  const [isCommentsModalVisible, setCommentsModalVisible] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isDeleteCommentModalVisible, setDeleteCommentModalVisible] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);

  const isOwner = user?.uid === post.userId;
  const isAdminOrStaff = userData?.role === 'administrador' || userData?.role === 'staff';
  const canDeletePost = isAdminOrStaff || isOwner;

  useEffect(() => {
    setIsLiked(user ? post.likes.includes(user.uid) : false);
    setLikeCount(post.likes.length);
    setCommentCount(post.commentsCount || 0);
    setIsPinned(post.isPinned || false);
  }, [post, user]);

  useEffect(() => {
    if (isCommentsModalVisible) {
      setLoadingComments(true);
      const commentsQuery = query(collection(firestore, 'posts', post.id, 'comments'), orderBy('timestamp', 'asc'));
      
      const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
        const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
        setComments(fetchedComments);
        setLoadingComments(false);
      }, (error) => {
          console.error("Erro ao buscar comentários: ", error);
          setLoadingComments(false);
      });

      return () => unsubscribe();
    }
  }, [isCommentsModalVisible, post.id]);

  const handleTogglePin = async () => {
    if (!isAdminOrStaff) return;
    const postRef = doc(firestore, 'posts', post.id);
    const newIsPinned = !isPinned;
    setIsPinned(newIsPinned);

    try {
      await updateDoc(postRef, { isPinned: newIsPinned });
    } catch (error) {
      console.error("Erro ao fixar post:", error);
      setIsPinned(!newIsPinned);
      Alert.alert("Erro", "Não foi possível atualizar a publicação.");
    }
  };

  const handleLike = async () => {
    if (!user) return;
    const postRef = doc(firestore, 'posts', post.id);
    const newIsLiked = !isLiked;
    setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);
    setIsLiked(newIsLiked);

    try {
      await updateDoc(postRef, {
        likes: newIsLiked ? arrayUnion(user.uid) : arrayRemove(user.uid)
      });
    } catch (error) {
      console.error("Erro ao curtir:", error);
      setLikeCount(prev => newIsLiked ? prev - 1 : prev + 1);
      setIsLiked(!newIsLiked);
    }
  };

  const confirmDeletePost = async () => {
    setDeleteModalVisible(false);
    try {
      const postRef = doc(firestore, 'posts', post.id);
      
      const commentsQuery = query(collection(firestore, 'posts', post.id, 'comments'));
      const commentsSnap = await getDocs(commentsQuery);
      const batch = writeBatch(firestore);
      commentsSnap.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      await deleteDoc(postRef);
    } catch (error) {
      console.error("Erro ao excluir post:", error);
      Alert.alert("Erro", "Não foi possível excluir a postagem.");
    }
  };
  
  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !userData) return;
    setPostingComment(true);
    
    try {
      const postRef = doc(firestore, 'posts', post.id);
      const commentsCollectionRef = collection(postRef, 'comments');

      await addDoc(commentsCollectionRef, {
        userId: user.uid,
        userName: userData.nomeCompleto,
        userProfilePicUrl: userData.profilePicUrl || '',
        text: newComment,
        timestamp: serverTimestamp(),
      });

      await updateDoc(postRef, {
        commentsCount: increment(1)
      });
      
      setNewComment('');
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      Alert.alert("Erro", "Não foi possível publicar seu comentário.");
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = (comment: Comment) => {
    setCommentToDelete(comment);
    setDeleteCommentModalVisible(true);
  };
  
  const confirmDeleteComment = async () => {
      if (!commentToDelete) return;

      try {
          const postRef = doc(firestore, 'posts', post.id);
          const commentRef = doc(postRef, 'comments', commentToDelete.id);
          
          await deleteDoc(commentRef);

          await updateDoc(postRef, {
              commentsCount: increment(-1)
          });

      } catch (error) {
          console.error("Erro ao excluir comentário:", error);
          Alert.alert("Erro", "Não foi possível excluir o comentário.");
      } finally {
          setDeleteCommentModalVisible(false);
          setCommentToDelete(null);
      }
  };

  const getInitials = (name?: string) => {
    if (!name) return '';
    const names = name.split(' ');
    const first = names[0]?.[0] || '';
    const last = names.length > 1 ? names[names.length - 1]?.[0] || '' : '';
    return `${first}${last}`.toUpperCase();
  };

  const renderCommentItem = ({ item }: { item: Comment }) => {
    const canDeleteComment = isAdminOrStaff || user?.uid === item.userId;
    return (
      <View style={styles.commentItem}>
        {item.userProfilePicUrl ? (
          <Image source={{ uri: item.userProfilePicUrl }} style={styles.commentAvatar} />
        ) : (
          <View style={styles.commentInitialsContainer}>
            <Text style={styles.commentInitialsText}>{getInitials(item.userName)}</Text>
          </View>
        )}
        <View style={styles.commentContent}>
            <View style={styles.commentHeader}>
                <Text style={styles.commentUserName}>{item.userName}</Text>
                <Text style={styles.timestampText}>{formatTimeAgo(item.timestamp)}</Text>
            </View>
            <Text style={styles.commentText}>{item.text}</Text>
        </View>
        {canDeleteComment && (
            <TouchableOpacity onPress={() => handleDeleteComment(item)} style={styles.commentDeleteButton}>
                <Feather name="trash-2" size={18} color="#aaa" />
            </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      {isPinned && (
        <View style={styles.pinnedIconContainer}>
          <Feather name="bookmark" size={16} color="#005A9C" />
        </View>
      )}
      <View style={styles.cardHeader}>
        {post.userProfilePicUrl ? (
          <Image source={{ uri: post.userProfilePicUrl }} style={styles.profilePic} />
        ) : (
          <View style={styles.initialsContainer}>
            <Text style={styles.initialsText}>{getInitials(post.userName)}</Text>
          </View>
        )}
        <View style={styles.userNameContainer}>
            <Text style={styles.userName}>{post.userName}</Text>
            <Text style={styles.timestampText}>{formatTimeAgo(post.timestamp)}</Text>
        </View>
      </View>

      {post.texto ? <Text style={styles.postText}>{post.texto}</Text> : null}
      {post.imageUrl && <Image source={{ uri: post.imageUrl }} style={styles.postImage} />}
      
      <View style={styles.cardFooter}>
        <View style={styles.footerActionsLeft}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <AntDesign name={isLiked ? 'heart' : 'hearto'} size={22} color={isLiked ? '#e74c3c' : '#333'} />
            <Text style={styles.actionText}>{likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setCommentsModalVisible(true)}>
            <Feather name="message-square" size={22} color="#333" />
            <Text style={styles.actionText}>{commentCount}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.footerActionsRight}>
          {isAdminOrStaff && (
            <TouchableOpacity style={styles.actionButton} onPress={handleTogglePin}>
              <Feather name="bookmark" size={22} color={isPinned ? '#007bff' : '#333'} />
            </TouchableOpacity>
          )}
          {canDeletePost && (
            <TouchableOpacity style={[styles.actionButton, { marginRight: 0 }]} onPress={() => setDeleteModalVisible(true)}>
              <Feather name="trash-2" size={22} color="#e74c3c" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <Modal
        animationType="fade"
        transparent={true}
        visible={isDeleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <Pressable style={styles.deleteModalBackdrop} onPress={() => setDeleteModalVisible(false)}>
            <Pressable style={styles.deleteModalView}>
                <Text style={styles.deleteModalTitle}>Excluir Postagem</Text>
                <Text style={styles.deleteModalSubtitle}>Tem certeza que deseja excluir esta postagem? Esta ação não pode ser desfeita.</Text>
                <TouchableOpacity style={[styles.deleteModalButton, styles.deleteButton]} onPress={confirmDeletePost}>
                    <Text style={styles.deleteModalButtonText}>Sim, excluir</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.deleteModalButton, styles.cancelButton]} onPress={() => setDeleteModalVisible(false)}>
                    <Text style={[styles.deleteModalButtonText, styles.cancelButtonText]}>Cancelar</Text>
                </TouchableOpacity>
            </Pressable>
        </Pressable>
      </Modal>

        <Modal
            animationType="fade"
            transparent={true}
            visible={isDeleteCommentModalVisible}
            onRequestClose={() => {
                setDeleteCommentModalVisible(false);
                setCommentToDelete(null);
            }}
        >
            <Pressable style={styles.deleteModalBackdrop} onPress={() => setDeleteCommentModalVisible(false)}>
                <Pressable style={styles.deleteModalView}>
                    <Text style={styles.deleteModalTitle}>Excluir Comentário</Text>
                    <Text style={styles.deleteModalSubtitle}>Tem certeza que deseja excluir este comentário?</Text>
                    <TouchableOpacity style={[styles.deleteModalButton, styles.deleteButton]} onPress={confirmDeleteComment}>
                        <Text style={styles.deleteModalButtonText}>Sim, excluir</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.deleteModalButton, styles.cancelButton]} onPress={() => {
                        setDeleteCommentModalVisible(false);
                        setCommentToDelete(null);
                    }}>
                        <Text style={[styles.deleteModalButtonText, styles.cancelButtonText]}>Cancelar</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isCommentsModalVisible}
        onRequestClose={() => setCommentsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setCommentsModalVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.dragIndicator} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comentários</Text>
              <TouchableOpacity onPress={() => setCommentsModalVisible(false)}>
                <Feather name="x" size={24} color="#555" />
              </TouchableOpacity>
            </View>

            {loadingComments ? (
              <ActivityIndicator style={{ flex: 1 }} size="large" color="#005A9C" />
            ) : (
              <FlatList
                data={comments}
                renderItem={renderCommentItem}
                keyExtractor={(item) => item.id}
                style={styles.commentsList}
                ListEmptyComponent={<Text style={styles.emptyCommentsText}>Nenhum comentário ainda. Seja o primeiro!</Text>}
              />
            )}
            
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Adicione um comentário..."
                value={newComment}
                onChangeText={setNewComment}
                placeholderTextColor="#888"
              />
              <TouchableOpacity style={styles.commentPostButton} onPress={handleAddComment} disabled={!newComment.trim() || postingComment}>
                {postingComment ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="send" size={20} color="#fff" />}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 10, marginVertical: 8, marginHorizontal: 15, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3, },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  profilePic: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#eee' },
  initialsContainer: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#005A9C', justifyContent: 'center', alignItems: 'center' },
  initialsText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  userNameContainer: {
    flexDirection: 'column',
  },
  userName: { fontWeight: 'bold', fontSize: 16 },
  timestampText: {
    fontSize: 12,
    color: '#888',
  },
  postText: { fontSize: 15, lineHeight: 22, color: '#333', marginBottom: 10 },
  postImage: { width: '100%', height: 350, borderRadius: 10, marginTop: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, marginTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  footerActionsLeft: { flexDirection: 'row', alignItems: 'center' },
  footerActionsRight: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  actionText: { marginLeft: 6, fontSize: 14, color: '#333' },
  pinnedIconContainer: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0, 123, 255, 0.1)', padding: 6, borderRadius: 50, },
  deleteModalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', },
  deleteModalView: { width: '90%', maxWidth: 340, backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center', },
  deleteModalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10, },
  deleteModalSubtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 25, lineHeight: 22, },
  deleteModalButton: { width: '100%', paddingVertical: 14, borderRadius: 25, marginBottom: 10, alignItems: 'center', },
  deleteButton: { backgroundColor: '#dc3545', },
  cancelButton: { backgroundColor: '#f0f2f5', },
  deleteModalButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', },
  cancelButtonText: { color: '#333', },
  modalContainer: { flex: 1, },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', },
  modalSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '90%', backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 20, },
  dragIndicator: { width: 40, height: 4, backgroundColor: '#ccc', borderRadius: 2, alignSelf: 'center', marginTop: 8, },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', },
  modalTitle: { fontSize: 18, fontWeight: 'bold', },
  commentsList: { flex: 1 },
  emptyCommentsText: { textAlign: 'center', marginTop: 50, color: 'gray', fontSize: 16, },
  commentItem: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 15, alignItems: 'flex-start' },
  commentAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 15 },
  commentInitialsContainer: { width: 40, height: 40, borderRadius: 20, marginRight: 15, backgroundColor: '#005A9C', justifyContent: 'center', alignItems: 'center' },
  commentInitialsText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  commentContent: { flex: 1, },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  commentUserName: { 
    fontWeight: 'bold', 
    fontSize: 15,
    marginRight: 8,
  },
  commentText: { color: '#333', lineHeight: 21, fontSize: 15 },
  commentDeleteButton: { paddingLeft: 10, paddingTop: 5, },
  commentInputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: '#fff', paddingBottom: Platform.OS === 'ios' ? 30 : 10, },
  commentInput: { flex: 1, height: 45, backgroundColor: '#f0f2f5', borderRadius: 22.5, paddingHorizontal: 15, marginRight: 10, fontSize: 16 },
  commentPostButton: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#007bff', justifyContent: 'center', alignItems: 'center', },
});