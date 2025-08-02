// Arquivo: src/types/index.ts (NOVO ARQUIVO)

// Aqui guardaremos os tipos que serão usados em várias partes do app.
export type Post = {
  id: string;
  userId: string;
  userName: string;
  userProfilePicUrl?: string; // <-- ADICIONE ESTA LINHA
  texto: string;
  imageUrl?: string;
  timestamp: any; // O timestamp do Firebase tem um tipo próprio, mas 'any' funciona bem aqui
  likes: string[];
};