import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  isFirebaseConfigured,
  subscribeAuthState,
  subscribeUserProfile,
  signInWithGoogle,
  signOutGoogle,
  checkGoogleRedirectResult,
  upsertUserProfile,
} from '../services/firebase';

// Roles: PUBLIC, ADMIN, CAPTAIN, PLAYER
export const AuthContext = createContext(null);

const SESSION_PREFIX = 'mt_role_session_';

function readRoleSession(tournamentId) {
  if (!tournamentId || typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`${SESSION_PREFIX}${tournamentId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeRoleSession(tournamentId, role, authenticatedId) {
  if (!tournamentId || typeof sessionStorage === 'undefined') return;
  try {
    if (!role || role === 'PUBLIC') {
      sessionStorage.removeItem(`${SESSION_PREFIX}${tournamentId}`);
    } else {
      sessionStorage.setItem(
        `${SESSION_PREFIX}${tournamentId}`,
        JSON.stringify({ role, authenticatedId: authenticatedId || null })
      );
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured());
  const [authError, setAuthError]     = useState('');

  const [activeTournamentId, setActiveTournamentId] = useState(null);
  const [role, setRole]                             = useState('PUBLIC');
  const [authenticatedId, setAuthenticatedId]       = useState(null);

  // Listen to Firebase Google Auth state
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setAuthLoading(false);
      return;
    }

    let unsubAuth = () => {};
    checkGoogleRedirectResult().catch(() => {});

    unsubAuth = subscribeAuthState((fbUser) => {
      if (fbUser) {
        setUser({
          uid: fbUser.uid,
          displayName: fbUser.displayName || 'User',
          email: fbUser.email || '',
          photoURL: fbUser.photoURL || '',
        });
        upsertUserProfile(fbUser);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubAuth();
  }, []);

  // Listen to Firestore users/{uid} profile
  useEffect(() => {
    if (!user?.uid || !isFirebaseConfigured()) {
      setUserProfile(null);
      return;
    }
    const unsub = subscribeUserProfile(user.uid, (profile) => {
      setUserProfile(profile);
    });
    return () => unsub();
  }, [user?.uid]);

  const signInGoogle = useCallback(async () => {
    setAuthError('');
    try {
      const fbUser = await signInWithGoogle();
      return fbUser;
    } catch (err) {
      const code = err?.code || '';
      const msg =
        code === 'auth/popup-closed-by-user'
          ? 'Sign-in window was closed.'
          : code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed'
            ? 'Google Sign-In is not enabled yet in Firebase Console → Authentication → Sign-in method.'
            : code === 'auth/unauthorized-domain'
              ? `This domain (${window.location.hostname}) must be added in Firebase Console → Authentication → Settings → Authorized domains.`
              : (err?.message || 'Google Sign-In failed.');
      setAuthError(msg);
      throw err;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setAuthError('');
    try {
      await signOutGoogle();
      setRole('PUBLIC');
      setAuthenticatedId(null);
      if (activeTournamentId) {
        writeRoleSession(activeTournamentId, 'PUBLIC', null);
      }
    } catch (err) {
      setAuthError(err?.message || 'Failed to sign out.');
    }
  }, [activeTournamentId]);

  const syncTournamentSession = useCallback((tournamentId) => {
    setActiveTournamentId(tournamentId);
    const saved = readRoleSession(tournamentId);
    if (saved?.role) {
      setRole(saved.role);
      setAuthenticatedId(saved.authenticatedId || null);
    } else {
      setRole('PUBLIC');
      setAuthenticatedId(null);
    }
  }, []);

  const login = useCallback((newRole, id = null, explicitTournamentId = null) => {
    const tid = explicitTournamentId || activeTournamentId;
    setRole(newRole);
    setAuthenticatedId(id);
    if (tid) {
      writeRoleSession(tid, newRole, id);
    }
  }, [activeTournamentId]);

  const logout = useCallback((explicitTournamentId = null) => {
    const tid = explicitTournamentId || activeTournamentId;
    setRole('PUBLIC');
    setAuthenticatedId(null);
    if (tid) {
      writeRoleSession(tid, 'PUBLIC', null);
    }
  }, [activeTournamentId]);

  const value = {
    user,
    userProfile,
    authLoading,
    authError,
    clearAuthError: useCallback(() => setAuthError(''), []),
    signInGoogle,
    signOutUser,
    role,
    authenticatedId,
    entityId: authenticatedId, // alias used by AuctionDraft
    login,
    logout,
    syncTournamentSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
