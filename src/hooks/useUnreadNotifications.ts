// Arquivo: src/hooks/useUnreadNotifications.ts (VERSÃO CORRIGIDA E COMPLETA)

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { firestore } from "../config/firebaseConfig";
import { useAuth } from "../context/AuthContext";

export function useUnreadNotifications() {
  const { user, userData } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    // 1. VERIFICA NOTIFICAÇÕES PESSOAIS (ex: pagamento)
    const personalQuery = query(
      collection(firestore, "notifications"),
      where("userId", "==", user.uid),
      where("isRead", "==", false)
    );

    const unsubscribePersonal = onSnapshot(personalQuery, (personalSnapshot) => {
      const personalUnread = personalSnapshot.size;

      // 2. VERIFICA NOTIFICAÇÕES GERAIS (avisos)
      // Pega a data da última checagem do usuário
      const lastCheck = userData?.lastNotificationCheck?.toDate() || new Date(0); 

      const generalQuery = query(
        collection(firestore, "notifications"),
        where("userId", "==", "todos"),
        where("timestamp", ">", lastCheck) // Busca avisos criados DEPOIS da última checagem
      );

      const unsubscribeGeneral = onSnapshot(generalQuery, (generalSnapshot) => {
        const generalUnread = generalSnapshot.size;
        
        // 3. SOMA OS TOTAIS
        setUnreadCount(personalUnread + generalUnread);
      });

      // Retorna a função de limpeza para os dois listeners
      return () => {
        unsubscribeGeneral();
        unsubscribePersonal();
      };
    });

    return () => {
        unsubscribePersonal();
    };

  }, [user, userData?.lastNotificationCheck]); // Re-executa se a data de checagem mudar

  return unreadCount;
}