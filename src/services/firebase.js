import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from 'firebase/firestore';

export const FIREBASE_CONFIG_KEY = 'mt_firebase_config';

// Retrieve stored Firebase configuration (from localStorage or import.meta.env)
export function getFirebaseConfig() {
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored Firebase config', e);
  }

  // Fallback to Vite environment variables if configured
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };
  }

  return null;
}

export function saveFirebaseConfig(config) {
  if (!config) {
    localStorage.removeItem(FIREBASE_CONFIG_KEY);
  } else {
    localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
  }
}

let appInstance = null;
let dbInstance = null;

export function initFirebase(customConfig = null) {
  const config = customConfig || getFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  try {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(config);
    dbInstance = getFirestore(appInstance);
    return { app: appInstance, db: dbInstance };
  } catch (err) {
    console.error('Firebase initialization failed:', err);
    return null;
  }
}

export function getDb() {
  if (!dbInstance) {
    const res = initFirebase();
    return res ? res.db : null;
  }
  return dbInstance;
}

export function isFirebaseConfigured() {
  return Boolean(getFirebaseConfig());
}

// ── Tournament Realtime Listeners & Cloud Writers ──

export function subscribeTournament(tournamentId, onData) {
  const db = getDb();
  if (!db || !tournamentId) return () => {};

  try {
    const docRef = doc(db, 'tournaments', tournamentId);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        onData(snap.data());
      }
    }, (err) => {
      console.warn(`Firestore subscribe error for tournament ${tournamentId}:`, err);
    });
  } catch (e) {
    console.warn('Error setting up tournament listener', e);
    return () => {};
  }
}

export async function saveTournamentCloud(tournamentId, state) {
  const db = getDb();
  if (!db || !tournamentId) return false;

  try {
    const docRef = doc(db, 'tournaments', tournamentId);
    await setDoc(docRef, {
      ...state,
      _updatedAt: Date.now(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error(`Failed to save tournament ${tournamentId} to Firestore:`, err);
    return false;
  }
}

// ── Global System Realtime Listeners & Cloud Writers ──

export function subscribeGlobal(onData) {
  const db = getDb();
  if (!db) return () => {};

  try {
    const docRef = doc(db, 'system', 'global');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        onData(snap.data());
      }
    }, (err) => {
      console.warn('Firestore subscribe error for system/global:', err);
    });
  } catch (e) {
    console.warn('Error setting up global listener', e);
    return () => {};
  }
}

export async function saveGlobalCloud(globalState) {
  const db = getDb();
  if (!db) return false;

  try {
    const docRef = doc(db, 'system', 'global');
    await setDoc(docRef, {
      ...globalState,
      _updatedAt: Date.now(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('Failed to save global to Firestore:', err);
    return false;
  }
}

// ── Organizer Profile Realtime Listeners & Cloud Writers ──

export function subscribeOrganizer(onData) {
  const db = getDb();
  if (!db) return () => {};

  try {
    const docRef = doc(db, 'system', 'organizer');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        onData(snap.data());
      }
    }, (err) => {
      console.warn('Firestore subscribe error for system/organizer:', err);
    });
  } catch (e) {
    console.warn('Error setting up organizer listener', e);
    return () => {};
  }
}

export async function saveOrganizerCloud(organizerState) {
  const db = getDb();
  if (!db) return false;

  try {
    const docRef = doc(db, 'system', 'organizer');
    await setDoc(docRef, {
      ...organizerState,
      _updatedAt: Date.now(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('Failed to save organizer to Firestore:', err);
    return false;
  }
}

// ── Bulk Push Local Data to Firebase ──
export async function pushAllLocalToCloud(activeTournamentId, tournamentState, globalState, organizerState) {
  const db = getDb();
  if (!db) throw new Error('Firebase is not initialized');

  if (globalState) {
    await saveGlobalCloud(globalState);
  }
  if (organizerState) {
    await saveOrganizerCloud(organizerState);
  }
  if (activeTournamentId && tournamentState) {
    await saveTournamentCloud(activeTournamentId, tournamentState);
  }
  return true;
}

