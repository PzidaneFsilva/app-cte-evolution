// Arquivo: src/context/AuthContext.tsx (VERSÃO ATUALIZADA)

import { auth, firestore } from '@/config/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

// 1. ADICIONE A PROPRIEDADE DA FOTO DE PERFIL
interface UserData {
  role: string;
  status: string;
  nomeCompleto?: string;
  profilePicUrl?: string; // <-- NOVO
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, userData: null, isLoading: true });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let firestoreUnsubscribe: () => void;
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (firestoreUnsubscribe) { firestoreUnsubscribe(); }
      setUser(user);
      
      if (user) {
        setIsLoading(true);
        const userDocRef = doc(firestore, "usuarios", user.uid);
        firestoreUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({ 
              role: data.role || 'aluno', 
              status: data.status || 'pendente',
              nomeCompleto: data.nomeCompleto,
              profilePicUrl: data.profilePicUrl // <-- 2. BUSQUE A URL DA FOTO
            });
          } else {
            setUserData({ role: 'aluno', status: 'pendente' });
          }
          setIsLoading(false);
        }, (error) => {
            console.error("AuthContext: Erro ao escutar documento:", error);
            setIsLoading(false);
            setUserData(null);
        });
      } else {
        setUserData(null);
        setIsLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (firestoreUnsubscribe) { firestoreUnsubscribe(); }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}