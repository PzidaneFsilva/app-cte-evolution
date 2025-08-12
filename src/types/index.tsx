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

// Tipo para um post
export type Post = {
  id: string;
  userId: string;
  userName: string;
  userProfilePicUrl?: string;
  texto: string;
  imageUrl?: string;
  timestamp: any;
  likes: string[];
  commentsCount: number;
  isPinned?: boolean;
};

// --- TIPO ATUALIZADO PARA NOTIFICAÇÕES ---
export type Notification = {
  id: string;
  title: string;
  message: string;
  timestamp: any;
  isRead: boolean;
  userId: string;
  type: 'announcement' | 'payment' | 'system';
  senderName?: string;
  senderProfilePicUrl?: string; // <-- NOVO: URL da foto de quem enviou
};