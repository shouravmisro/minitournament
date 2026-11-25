import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  deleteField,
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';

export const FIREBASE_CONFIG_KEY = 'mt_firebase_config';

// Pre-configured default project settings for mini-tournament
export const DEFAULT_FIREBASE_CONFIG = {
  projectId: "mini-tournament-45ac1",
  appId: "1:59126420385:web:23c6cb578b39f06873f1e0",
  storageBucket: "mini-tournament-45ac1.firebasestorage.app",
  apiKey: "AIzaSyDie7ksu20tsyzFeYfuxU7GUhs3iy9EORI",
  authDomain: "mini-tournament-45ac1.firebaseapp.com",
  messagingSenderId: "59126420385",
  measurementId: "G-H2R40PWBHR"
};

// Retrieve stored Firebase configuration (from localStorage, env, or default project)
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

  return DEFAULT_FIREBASE_CONFIG;
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
let authInstance = null;

export function initFirebase(customConfig = null) {
  const config = customConfig || getFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  try {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(config);
    dbInstance = getFirestore(appInstance);
    authInstance = getAuth(appInstance);
    return { app: appInstance, db: dbInstance, auth: authInstance };
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

export function getFirebaseAuth() {
  if (!authInstance) {
    const res = initFirebase();
    return res ? res.auth : null;
  }
  return authInstance;
}

export function isFirebaseConfigured() {
  return Boolean(getFirebaseConfig());
}

// ── PIN Hashing & Verification (prevents plaintext PIN exposure in public docs) ──

function fallbackHash(str) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 'fb_' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

export async function hashPin(tournamentId, role, entityId, pin) {
  const input = `${tournamentId || 'default'}:${role}:${entityId || 'root'}:${String(pin || '')}`;
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const data = new TextEncoder().encode(input);
      const buf = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Fallback if subtle crypto is unavailable in an insecure context
  }
  return fallbackHash(input);
}

export async function computePinHashes(tournamentId, state) {
  const adminHash = state?.adminPin
    ? await hashPin(tournamentId, 'ADMIN', 'root', state.adminPin)
    : '';
  const captainHashes = {};
  for (const c of (state?.captains || [])) {
    if (c?.id && c?.pin) {
      captainHashes[c.id] = await hashPin(tournamentId, 'CAPTAIN', c.id, c.pin);
    }
  }
  const playerHashes = {};
  for (const p of (state?.players || [])) {
    if (p?.id && p?.pin) {
      playerHashes[p.id] = await hashPin(tournamentId, 'PLAYER', p.id, p.pin);
    }
  }
  return { admin: adminHash, captains: captainHashes, players: playerHashes };
}

export async function verifyPinAgainstState(tournamentId, role, entityId, pinInput, state) {
  if (!pinInput) return false;
  if (role === 'ADMIN') {
    if (state?.adminPin && pinInput === state.adminPin) return true;
    const expected = state?.pinHashes?.admin;
    if (expected) {
      const candidate = await hashPin(tournamentId, 'ADMIN', 'root', pinInput);
      return candidate === expected;
    }
    return false;
  }
  if (role === 'CAPTAIN') {
    const cap = (state?.captains || []).find(c => c.id === entityId);
    if (cap?.pin && pinInput === cap.pin) return true;
    const expected = state?.pinHashes?.captains?.[entityId];
    if (expected) {
      const candidate = await hashPin(tournamentId, 'CAPTAIN', entityId, pinInput);
      return candidate === expected;
    }
    return false;
  }
  if (role === 'PLAYER') {
    const plr = (state?.players || []).find(p => p.id === entityId);
    if (plr?.pin && pinInput === plr.pin) return true;
    const expected = state?.pinHashes?.players?.[entityId];
    if (expected) {
      const candidate = await hashPin(tournamentId, 'PLAYER', entityId, pinInput);
      return candidate === expected;
    }
    return false;
  }
  return false;
}

// ── Google Authentication ──

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is not initialized.');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, provider);
    if (result?.user) {
      await upsertUserProfile(result.user);
    }
    return result.user;
  } catch (err) {
    if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw err;
  }
}

export async function checkGoogleRedirectResult() {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  try {
    const res = await getRedirectResult(auth);
    if (res?.user) {
      await upsertUserProfile(res.user);
      return res.user;
    }
  } catch (err) {
    console.warn('Redirect sign-in check failed:', err);
  }
  return null;
}

export async function signOutGoogle() {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

export function subscribeAuthState(callback) {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// ── User Profiles (users/{uid}) ──

export async function upsertUserProfile(user, extraPatch = {}) {
  const db = getDb();
  if (!db || !user?.uid) return null;

  const docRef = doc(db, 'users', user.uid);
  const email = (user.email || '').trim();
  const payload = {
    uid: user.uid,
    email,
    emailLower: email.toLowerCase(),
    displayName: user.displayName || extraPatch.name || 'Organizer',
    photoURL: user.photoURL || '',
    ...extraPatch,
    _updatedAt: Date.now(),
  };

  try {
    await setDoc(docRef, payload, { merge: true });
    return payload;
  } catch (err) {
    console.warn('Failed to upsert user profile:', err);
    return null;
  }
}

export function subscribeUserProfile(uid, onData) {
  const db = getDb();
  if (!db || !uid) return () => {};

  try {
    const docRef = doc(db, 'users', uid);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        onData(snap.data());
      }
    }, (err) => {
      console.warn(`Firestore subscribe error for user ${uid}:`, err);
    });
  } catch (e) {
    console.warn('Error setting up user profile listener:', e);
    return () => {};
  }
}

export async function findUserByEmail(email) {
  const db = getDb();
  const clean = (email || '').trim().toLowerCase();
  if (!db || !clean) return null;

  try {
    const q = query(collection(db, 'users'), where('emailLower', '==', clean));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data();
  } catch (err) {
    console.warn('Failed to look up user by email:', err);
    return null;
  }
}

// ── Secret Stripping & Public/Private Document Split ──

export function extractMemberUids(state) {
  const set = new Set();
  (state?.captains || []).forEach(c => { if (c?.uid) set.add(c.uid); });
  (state?.players || []).forEach(p => { if (p?.uid) set.add(p.uid); });
  return Array.from(set);
}

export async function buildPublicTournamentPayload(tournamentId, state) {
  const pinHashes = await computePinHashes(tournamentId, state);
  const memberUids = extractMemberUids(state);

  const sanitizedCaptains = (state?.captains || []).map(c => {
    const { pin, ...rest } = c;
    return rest;
  });
  const sanitizedPlayers = (state?.players || []).map(p => {
    const { pin, ...rest } = p;
    return rest;
  });

  const { adminPin, ...restState } = state || {};

  return {
    ...restState,
    captains: sanitizedCaptains,
    players: sanitizedPlayers,
    pinHashes,
    memberUids,
    coAdminUids: Array.isArray(state?.coAdminUids) ? state.coAdminUids : [],
    coAdmins: Array.isArray(state?.coAdmins) ? state.coAdmins : [],
    isPublic: state?.isPublic !== false,
    allowGuestPinLogin: state?.allowGuestPinLogin !== false,
    _updatedAt: Date.now(),
  };
}

export function extractSecretsPayload(state) {
  const captainPins = {};
  (state?.captains || []).forEach(c => {
    if (c?.id && c?.pin) captainPins[c.id] = String(c.pin);
  });
  const playerPins = {};
  (state?.players || []).forEach(p => {
    if (p?.id && p?.pin) playerPins[p.id] = String(p.pin);
  });
  return {
    adminPin: state?.adminPin ? String(state.adminPin) : '0000',
    captainPins,
    playerPins,
    _updatedAt: Date.now(),
  };
}

// ── Tournament Realtime Listeners & Cloud Writers ──

export function subscribeTournament(tournamentId, onData, onError) {
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
      if (onError) onError(err);
    });
  } catch (e) {
    console.warn('Error setting up tournament listener', e);
    return () => {};
  }
}

export function subscribeTournamentSecrets(tournamentId, onData) {
  const db = getDb();
  if (!db || !tournamentId) return () => {};

  try {
    const docRef = doc(db, 'tournaments', tournamentId, 'private', 'secrets');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        onData(snap.data());
      }
    }, (err) => {
      // Expected for non-owners/non-coadmins; fail silently
      if (err?.code !== 'permission-denied') {
        console.warn(`Firestore secrets subscribe warning for ${tournamentId}:`, err);
      }
    });
  } catch {
    return () => {};
  }
}

export async function saveTournamentSecrets(tournamentId, state) {
  const db = getDb();
  if (!db || !tournamentId) return false;
  try {
    const docRef = doc(db, 'tournaments', tournamentId, 'private', 'secrets');
    await setDoc(docRef, extractSecretsPayload(state), { merge: true });
    return true;
  } catch (err) {
    if (err?.code !== 'permission-denied') {
      console.warn(`Failed to save secrets for ${tournamentId}:`, err);
    }
    return false;
  }
}

export async function saveTournamentCloud(tournamentId, state, options = {}) {
  const db = getDb();
  if (!db || !tournamentId) return false;

  try {
    const docRef = doc(db, 'tournaments', tournamentId);
    const payload = await buildPublicTournamentPayload(tournamentId, state);
    await setDoc(docRef, { ...payload, adminPin: deleteField() }, { merge: true });

    if (options.saveSecrets !== false) {
      await saveTournamentSecrets(tournamentId, state);
    }
    return true;
  } catch (err) {
    console.error(`Failed to save tournament ${tournamentId} to Firestore:`, err);
    return false;
  }
}

export async function updateTournamentMetaCloud(tournamentId, { name, format }) {
  const db = getDb();
  if (!db || !tournamentId) return false;
  try {
    const docRef = doc(db, 'tournaments', tournamentId);
    await setDoc(docRef, {
      adminPin: deleteField(),
      organizer: { name, format },
      _updatedAt: Date.now(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn(`Failed to update tournament meta ${tournamentId}:`, err);
    return false;
  }
}

export async function deleteTournamentCloud(tournamentId) {
  const db = getDb();
  if (!db || !tournamentId) return false;

  try {
    try {
      await deleteDoc(doc(db, 'tournaments', tournamentId, 'private', 'secrets'));
    } catch {
      // Secrets doc might not exist
    }
    await deleteDoc(doc(db, 'tournaments', tournamentId));
    return true;
  } catch (err) {
    console.error(`Failed to delete tournament ${tournamentId}:`, err);
    return false;
  }
}

// ── Multi-Tenant Tournament Discovery & User Queries ──

function mapTournamentDocToMeta(docSnap) {
  const d = docSnap.data() || {};
  return {
    id: docSnap.id,
    name: d.organizer?.name || d.name || 'Tournament',
    format: d.organizer?.format || d.format || 'HYBRID',
    hostName: d.organizer?.hostName || '',
    venue: d.organizer?.venue || '',
    ownerUid: d.ownerUid || null,
    ownerName: d.ownerName || '',
    coAdminUids: Array.isArray(d.coAdminUids) ? d.coAdminUids : [],
    memberUids: Array.isArray(d.memberUids) ? d.memberUids : [],
    isPublic: d.isPublic !== false,
    playerCount: Array.isArray(d.players) ? d.players.length : 0,
    teamCount: Array.isArray(d.teams) ? d.teams.length : 0,
    createdAt: d.createdAt || (d._updatedAt ? new Date(d._updatedAt).toISOString() : new Date().toISOString()),
  };
}

export function subscribeUserTournaments(uid, onData) {
  const db = getDb();
  if (!db || !uid) {
    onData({ owned: [], coAdmin: [], member: [] });
    return () => {};
  }

  let owned = [];
  let coAdmin = [];
  let member = [];

  const emit = () => onData({ owned, coAdmin, member });

  const unsubOwned = onSnapshot(
    query(collection(db, 'tournaments'), where('ownerUid', '==', uid)),
    (snap) => {
      owned = snap.docs.map(mapTournamentDocToMeta);
      emit();
    },
    (err) => console.warn('Owned tournaments listener error:', err)
  );

  const unsubCoAdmin = onSnapshot(
    query(collection(db, 'tournaments'), where('coAdminUids', 'array-contains', uid)),
    (snap) => {
      coAdmin = snap.docs.map(mapTournamentDocToMeta);
      emit();
    },
    (err) => console.warn('Co-admin tournaments listener error:', err)
  );

  const unsubMember = onSnapshot(
    query(collection(db, 'tournaments'), where('memberUids', 'array-contains', uid)),
    (snap) => {
      member = snap.docs.map(mapTournamentDocToMeta);
      emit();
    },
    (err) => console.warn('Member tournaments listener error:', err)
  );

  return () => {
    unsubOwned();
    unsubCoAdmin();
    unsubMember();
  };
}

export async function fetchPublicTournaments() {
  const db = getDb();
  if (!db) return [];
  try {
    const q = query(collection(db, 'tournaments'), where('isPublic', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map(mapTournamentDocToMeta);
  } catch (err) {
    console.warn('Failed to fetch public tournaments:', err);
    return [];
  }
}

export async function fetchTournamentMetaById(tournamentId) {
  const db = getDb();
  if (!db || !tournamentId) return null;
  try {
    const snap = await getDoc(doc(db, 'tournaments', tournamentId));
    if (!snap.exists()) return null;
    return mapTournamentDocToMeta(snap);
  } catch (err) {
    console.warn(`Failed to fetch tournament meta ${tournamentId}:`, err);
    return null;
  }
}

// ── Join Code & Player Registration (tournaments/{id}/registrations/{uid}) ──

const JOIN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateJoinCode(seed = '') {
  if (seed) {
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += JOIN_CHARS[Math.abs(hash + i * 31) % JOIN_CHARS.length];
      hash = Math.imul(hash ^ (i + 7), 16777619);
    }
    return code;
  }
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += JOIN_CHARS[Math.floor(Math.random() * JOIN_CHARS.length)];
  }
  return code;
}

export async function findTournamentByJoinCode(rawCode) {
  const db = getDb();
  const code = (rawCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!db || !code) return null;
  try {
    const q = query(collection(db, 'tournaments'), where('registrationSettings.joinCode', '==', code));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return mapTournamentDocToMeta(snap.docs[0]);
  } catch (err) {
    console.warn('Join code lookup failed:', err);
    return null;
  }
}

export function subscribeMyRegistration(tournamentId, uid, onData) {
  const db = getDb();
  if (!db || !tournamentId || !uid) {
    onData(null);
    return () => {};
  }
  try {
    const docRef = doc(db, 'tournaments', tournamentId, 'registrations', uid);
    return onSnapshot(docRef, (snap) => {
      onData(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    }, (err) => {
      if (err?.code !== 'permission-denied') {
        console.warn('My registration listener error:', err);
      }
    });
  } catch {
    return () => {};
  }
}

export function subscribeAllRegistrations(tournamentId, onData) {
  const db = getDb();
  if (!db || !tournamentId) {
    onData([]);
    return () => {};
  }
  try {
    const colRef = collection(db, 'tournaments', tournamentId, 'registrations');
    return onSnapshot(colRef, (snap) => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      onData(list);
    }, (err) => {
      if (err?.code !== 'permission-denied') {
        console.warn('All registrations listener error:', err);
      }
    });
  } catch {
    return () => {};
  }
}

export async function submitPlayerRegistration(tournamentId, uid, regData) {
  const db = getDb();
  if (!db || !tournamentId || !uid) {
    throw new Error('Sign in with Google and connect to Cloud to register.');
  }
  const docRef = doc(db, 'tournaments', tournamentId, 'registrations', uid);
  const existing = await getDoc(docRef);
  const now = Date.now();
  const payload = {
    ...regData,
    uid,
    createdAt: existing.exists() ? (existing.data()?.createdAt || now) : now,
    _updatedAt: now,
  };
  await setDoc(docRef, payload, { merge: true });
  return payload;
}

export async function withdrawPlayerRegistration(tournamentId, uid) {
  const db = getDb();
  if (!db || !tournamentId || !uid) return false;
  await deleteDoc(doc(db, 'tournaments', tournamentId, 'registrations', uid));
  return true;
}

export async function updateRegistrationRecord(tournamentId, regUid, patch) {
  const db = getDb();
  if (!db || !tournamentId || !regUid) return false;
  const docRef = doc(db, 'tournaments', tournamentId, 'registrations', regUid);
  await setDoc(docRef, { ...patch, _updatedAt: Date.now() }, { merge: true });
  return true;
}

// ── Existing Player/Captain Google Account Claim Requests ──

export function subscribeMyClaimRequest(tournamentId, uid, onData) {
  const db = getDb();
  if (!db || !tournamentId || !uid) {
    onData(null);
    return () => {};
  }
  try {
    const docRef = doc(db, 'tournaments', tournamentId, 'claimRequests', uid);
    return onSnapshot(docRef, (snap) => {
      onData(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    }, (err) => {
      if (err?.code !== 'permission-denied') {
        console.warn('My claim request listener error:', err);
      }
    });
  } catch {
    return () => {};
  }
}

export function subscribeAllClaimRequests(tournamentId, onData) {
  const db = getDb();
  if (!db || !tournamentId) {
    onData([]);
    return () => {};
  }
  try {
    const colRef = collection(db, 'tournaments', tournamentId, 'claimRequests');
    return onSnapshot(colRef, (snap) => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      onData(list);
    }, (err) => {
      if (err?.code !== 'permission-denied') {
        console.warn('All claim requests listener error:', err);
      }
    });
  } catch {
    return () => {};
  }
}

export async function submitClaimRequest(tournamentId, uid, claimData) {
  const db = getDb();
  if (!db || !tournamentId || !uid) {
    throw new Error('Sign in with Google and connect to Cloud first.');
  }
  const docRef = doc(db, 'tournaments', tournamentId, 'claimRequests', uid);
  const now = Date.now();
  const payload = {
    ...claimData,
    uid,
    status: 'PENDING',
    createdAt: now,
    _updatedAt: now,
  };
  await setDoc(docRef, payload, { merge: true });
  return payload;
}

export async function withdrawClaimRequest(tournamentId, uid) {
  const db = getDb();
  if (!db || !tournamentId || !uid) return false;
  await deleteDoc(doc(db, 'tournaments', tournamentId, 'claimRequests', uid));
  return true;
}

export async function updateClaimRequestRecord(tournamentId, reqUid, patch) {
  const db = getDb();
  if (!db || !tournamentId || !reqUid) return false;
  const docRef = doc(db, 'tournaments', tournamentId, 'claimRequests', reqUid);
  await setDoc(docRef, { ...patch, _updatedAt: Date.now() }, { merge: true });
  return true;
}

// Legacy read-only fallback for existing system/global tournaments
export async function fetchLegacyGlobalTournaments() {
  const db = getDb();
  if (!db) return [];
  try {
    const snap = await getDoc(doc(db, 'system', 'global'));
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.tournaments)) {
        return data.tournaments;
      }
    }
  } catch {
    // Ignore if blocked or missing
  }
  return [];
}

// ── Legacy Global Helpers (kept read-only/compat for FirebaseSyncModal) ──

export function subscribeGlobal(onData) {
  const db = getDb();
  if (!db) return () => {};
  try {
    const docRef = doc(db, 'system', 'global');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) onData(snap.data());
    }, () => {});
  } catch {
    return () => {};
  }
}

export async function pushAllLocalToCloud(activeTournamentId, tournamentState, _globalState, organizerState, currentUser = null) {
  const db = getDb();
  if (!db) throw new Error('Firebase is not initialized');

  if (currentUser?.uid && organizerState) {
    await upsertUserProfile(currentUser, {
      name: organizerState.name || currentUser.displayName || '',
      avatar: organizerState.avatar || currentUser.photoURL || '',
      bio: organizerState.bio || '',
      contactWhatsApp: organizerState.contactWhatsApp || '',
      email: organizerState.email || currentUser.email || '',
    });
  }

  if (activeTournamentId && tournamentState) {
    const enrichedState = currentUser?.uid && !tournamentState.ownerUid
      ? {
          ...tournamentState,
          ownerUid: currentUser.uid,
          ownerName: currentUser.displayName || organizerState?.name || '',
          ownerEmail: currentUser.email || '',
        }
      : tournamentState;
    const ok = await saveTournamentCloud(activeTournamentId, enrichedState);
    if (!ok) throw new Error('Could not write tournament to Firestore. Check your sign-in and Firestore rules.');
  }
  return true;
}
