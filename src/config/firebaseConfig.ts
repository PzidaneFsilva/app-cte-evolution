// Arquivo: src/config/firebaseConfig.ts (VERSÃO CORRIGIDA E MODERNA)

// 1. As importações agora vêm de pacotes modulares específicos
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// Adicionada a importação para Cloud Functions, que será útil
import { getFunctions } from 'firebase/functions';


// 2. Suas credenciais permanecem exatamente as mesmas, lidas do .env
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// 3. A inicialização agora é feita em duas etapas
// Primeiro, inicializamos o app principal
const app = initializeApp(firebaseConfig);

// Depois, obtemos cada serviço individualmente a partir do app inicializado
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app); // Também inicializamos as functions

// 4. Exportamos os serviços para serem usados em outras partes do seu app
export { auth, firestore, functions, storage };
