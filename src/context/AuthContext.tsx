// Arquivo: src/context/AuthContext.tsx (VERSÃO ATUALIZADA)

import { auth, firestore } from '@/config/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore'; // ATENÇÃO: getDoc foi trocado por onSnapshot
import React, { createContext, useContext, useEffect, useState } from 'react';

interface UserData {
  role: string;
  status: string;
  nomeCompleto?: string;
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
      // Limpa o listener anterior sempre que o usuário mudar (login/logout)
      if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
      }

      setUser(user);
      
      if (user) {
        setIsLoading(true);
        const userDocRef = doc(firestore, "usuarios", user.uid);

        // --- MUDANÇA PRINCIPAL: DE getDoc PARA onSnapshot ---
        // onSnapshot "escuta" por mudanças no documento em tempo real.
        firestoreUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const role = data.role || 'aluno';
            let status = data.status;

            // A mesma lógica de antes para definir status
            if (role === 'staff' || role === 'administrador') {
              if (status !== 'bloqueado' && status !== 'suspenso') {
                status = 'aprovado';
              }
            } else {
              status = status || 'pendente';
            }

            setUserData({ 
              role: role, 
              status: status,
              nomeCompleto: data.nomeCompleto 
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
        // Se não há usuário, zera os dados.
        setUserData(null);
        setIsLoading(false);
      }
    });

    // Função de limpeza: será chamada quando o componente for desmontado
    return () => {
      authUnsubscribe();
      if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}