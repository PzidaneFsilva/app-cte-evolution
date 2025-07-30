// Arquivo: src/config/firebaseConfig.ts (VERSÃO "COMPAT")
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyABxpA4Wf7eOQUNANrpMj6fQMeQD8fVHek",
  authDomain: "cte-app-3e536.firebaseapp.com",
  projectId: "cte-app-3e536",
  storageBucket: "cte-app-3e536.firebasestorage.app",
  messagingSenderId: "180629918604",
  appId: "1:180629918604:web:53ab3f1367765c0144fca9",
  measurementId: "G-9GEWLZGRFB"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const firestore = firebase.firestore();