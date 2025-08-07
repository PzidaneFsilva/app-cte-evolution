// Arquivo: src/types/index.tsx (VERSÃO ATUALIZADA)

// Tipo para um comentário
export type Comment = {
  id: string;
  userId: string;
  userName: string;
  userProfilePicUrl?: string;
  text: string;
  timestamp: any;
};

// Tipo para um post (adicionando a contagem de comentários)
export type Post = {
  id: string;
  userId: string;
  userName: string;
  userProfilePicUrl?: string;
  texto: string;
  imageUrl?: string;
  timestamp: any; // O timestamp do Firebase tem um tipo próprio, mas 'any' funciona bem aqui
  likes: string[];
  commentsCount: number; // Garanta que esta linha exista
  isPinned?: boolean; // <-- NOVA PROPRIEDADE PARA FIXAR POSTS
};