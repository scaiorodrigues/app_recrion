/**
 * Inicialização do Firebase.
 *
 * As credenciais vêm de variáveis de ambiente (arquivo .env, não versionado).
 * Enquanto elas não estiverem configuradas, o app roda em modo demonstração:
 * as telas funcionam com dados locais e nada é enviado para o servidor.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** true quando há credenciais reais; false roda tudo localmente. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

function ensureApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null;
  if (!app) {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig as Required<typeof firebaseConfig>);
  }
  return app;
}

export function getFirebaseAuth(): Auth | null {
  const instance = ensureApp();
  if (!instance) return null;
  if (!authInstance) authInstance = getAuth(instance);
  return authInstance;
}

export function getDb(): Firestore | null {
  const instance = ensureApp();
  if (!instance) return null;
  if (!dbInstance) dbInstance = getFirestore(instance);
  return dbInstance;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  const instance = ensureApp();
  if (!instance) return null;
  if (!storageInstance) storageInstance = getStorage(instance);
  return storageInstance;
}
