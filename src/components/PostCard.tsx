// Arquivo: src/components/PostCard.tsx (VERSÃO COM BOTÕES RESTAURADOS)

import { useAuth } from '@/context/AuthContext';
import { AntDesign, Feather } from '@expo/vector-icons';
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { firestore } from '../config/firebaseConfig';
import { Post } from '../types';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Sincroniza o estado do card com os dados do post
  useEffect(() => {
    if (post.likes) {
      setLikeCount(post.likes.length);
      setIsLiked(user ? post.likes.includes(user.uid) : false);
    }
  }, [post.likes, user]);

  const getInitials = () => {
    if (!post.userName) return '';
    const names = post.userName.split(' ');
    const firstInitial = names[0]?.[0] || '';
    const lastInitial = names.length > 1 ? names[names.length - 1]?.[0] || '' : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  const handleLike = async () => {
    if (!user) return;
    const postRef = doc(firestore, 'posts', post.id);
    
    // Atualização otimista para a UI responder na hora
    const newIsLiked = !isLiked;
    setLikeCount(likeCount + (newIsLiked ? 1 : -1));
    setIsLiked(newIsLiked);

    try {
      if (newIsLiked) {
        await updateDoc(postRef, { likes: arrayUnion(user.uid) });
      } else {
        await updateDoc(postRef, { likes: arrayRemove(user.uid) });
      }
    } catch (error) {
      console.error("Erro ao curtir:", error);
      // Reverte a UI em caso de erro no servidor
      setIsLiked(!newIsLiked);
      setLikeCount(likeCount);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {post.userProfilePicUrl ? (
          <Image source={{ uri: post.userProfilePicUrl }} style={styles.profilePic} />
        ) : (
          <View style={styles.initialsContainer}>
            <Text style={styles.initialsText}>{getInitials()}</Text>
          </View>
        )}
        <Text style={styles.userName}>{post.userName}</Text>
      </View>

      {post.texto ? <Text style={styles.postText}>{post.texto}</Text> : null}
      {post.imageUrl && <Image source={{ uri: post.imageUrl }} style={styles.postImage} />}

      {/* BOTÕES DE CURTIR E COMENTAR RESTAURADOS AQUI */}
      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <AntDesign 
            name={isLiked ? 'heart' : 'hearto'}
            size={22} 
            color={isLiked ? '#e74c3c' : '#333'} 
          />
          <Text style={styles.actionText}>{likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Feather name="message-square" size={22} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 10, marginVertical: 8, marginHorizontal: 15, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3, },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  profilePic: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#eee' },
  initialsContainer: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#005A9C', justifyContent: 'center', alignItems: 'center' },
  initialsText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  userName: { fontWeight: 'bold', fontSize: 16 },
  postText: { fontSize: 15, lineHeight: 22, color: '#333', marginBottom: 10 },
  postImage: { width: '100%', height: 350, borderRadius: 10, marginTop: 10 },
  cardFooter: { flexDirection: 'row', paddingTop: 15, marginTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  actionText: { marginLeft: 6, fontSize: 14, color: '#333' }
});