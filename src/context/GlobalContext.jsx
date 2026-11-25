import React, { createContext, useContext, useReducer, useEffect, useCallback, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  isFirebaseConfigured,
  subscribeUserTournaments,
  fetchPublicTournaments,
  fetchLegacyGlobalTournaments,
  fetchTournamentMetaById,
  findTournamentByJoinCode,
  generateJoinCode,
  saveTournamentCloud,
  updateTournamentMetaCloud,
  deleteTournamentCloud,
  upsertUserProfile,
} from '../services/firebase';

/* ─────────────────────────────────────────────
   Global state (Multi-Organizer Isolated):
   - Per-user Organizer profile (users/{uid})
   - Owned / Co-Admin tournaments
   - Joined (member) tournaments
   - Public discoverable tournaments
   - Active tournament selection & URL ?t= deep-link
───────────────────────────────────────────── */

const GM_KEY = 'mt_global';
const ORG_KEY = 'mt_organizer';

export function getUrlTournamentId() {
  try {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const paramId = params.get('t') || params.get('tournament');
    if (paramId) return paramId;

    const hash = window.location.hash.replace(/^#\/?/, '').replace(/^tournament\//, '');
    if (hash && (hash.startsWith('t_') || hash === 'default')) return hash;
  } catch {}
  return null;
}

const INITIAL_EXPLICIT_URL_TOURNAMENT_ID = typeof window !== 'undefined' ? getUrlTournamentId() : null;

const DEFAULT_ORGANIZER = {
  name: '',
  avatar: '',
  bio: '',
  contactWhatsApp: '',
  email: '',
};

const DEFAULT_TOURNAMENT_ID = 't_mvwya9yi';

const DEFAULT_GLOBAL = {
  localTournaments: [],
  activeTournamentId: INITIAL_EXPLICIT_URL_TOURNAMENT_ID || DEFAULT_TOURNAMENT_ID,
  showManager: !INITIAL_EXPLICIT_URL_TOURNAMENT_ID,
};

function loadGlobal() {
  try {
    const raw = localStorage.getItem(GM_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const localList = Array.isArray(parsed.localTournaments)
        ? parsed.localTournaments
        : (Array.isArray(parsed.tournaments) ? parsed.tournaments : []);

      const activeTournamentId =
        INITIAL_EXPLICIT_URL_TOURNAMENT_ID ||
        parsed.activeTournamentId ||
        localList[0]?.id ||
        DEFAULT_TOURNAMENT_ID;

      const showManager = !INITIAL_EXPLICIT_URL_TOURNAMENT_ID;

      return {
        ...DEFAULT_GLOBAL,
        localTournaments: localList,
        activeTournamentId,
        showManager,
      };
    }
    if (INITIAL_EXPLICIT_URL_TOURNAMENT_ID) {
      return {
        localTournaments: [
          {
            id: INITIAL_EXPLICIT_URL_TOURNAMENT_ID,
            name: 'Tournament Arena',
            format: 'HYBRID',
            createdAt: new Date().toISOString(),
          },
        ],
        activeTournamentId: INITIAL_EXPLICIT_URL_TOURNAMENT_ID,
        showManager: false,
      };
    }
  } catch {
    return DEFAULT_GLOBAL;
  }
  return DEFAULT_GLOBAL;
}

function loadOrganizer(uid = null) {
  try {
    const key = uid ? `${ORG_KEY}_${uid}` : ORG_KEY;
    const raw = localStorage.getItem(key) || localStorage.getItem(ORG_KEY);
    return raw ? { ...DEFAULT_ORGANIZER, ...JSON.parse(raw) } : DEFAULT_ORGANIZER;
  } catch {
    return DEFAULT_ORGANIZER;
  }
}

function saveGlobal(g) {
  try {
    localStorage.setItem(GM_KEY, JSON.stringify(g));
  } catch {}
}

function saveOrganizer(o, uid = null) {
  try {
    const key = uid ? `${ORG_KEY}_${uid}` : ORG_KEY;
    localStorage.setItem(key, JSON.stringify(o));
  } catch {}
}

function globalReducer(state, action) {
  switch (action.type) {
    case 'CREATE_TOURNAMENT': {
      const t = action.payload;
      return {
        ...state,
        localTournaments: [...state.localTournaments.filter(item => item.id !== t.id), t],
        activeTournamentId: t.id,
        showManager: false,
      };
    }
    case 'DELETE_TOURNAMENT': {
      try { localStorage.removeItem(`mt_state_${action.payload}`); } catch {}
      const remaining = state.localTournaments.filter(t => t.id !== action.payload);
      return {
        ...state,
        localTournaments: remaining,
        activeTournamentId:
          state.activeTournamentId === action.payload
            ? (remaining[0]?.id || DEFAULT_TOURNAMENT_ID)
            : state.activeTournamentId,
      };
    }
    case 'SELECT_TOURNAMENT':
      return { ...state, activeTournamentId: action.payload, showManager: false };
    case 'DESELECT_TOURNAMENT':
      return { ...state, showManager: true };
    case 'UPDATE_TOURNAMENT_META':
      return {
        ...state,
        localTournaments: state.localTournaments.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
      };
    case 'UPSERT_LOCAL_META': {
      const meta = action.payload;
      if (!meta?.id) return state;
      const exists = state.localTournaments.some(t => t.id === meta.id);
      return {
        ...state,
        localTournaments: exists
          ? state.localTournaments.map(t => (t.id === meta.id ? { ...t, ...meta } : t))
          : [...state.localTournaments, meta],
      };
    }
    default:
      return state;
  }
}

const GlobalContext = createContext(null);
const OrganizerContext = createContext(null);

export function GlobalProvider({ children }) {
  const { user, userProfile } = useAuth();
  const [globalState, dispatch] = useReducer(globalReducer, null, loadGlobal);
  const [organizer, setOrganizer] = useState(() => loadOrganizer(null));

  const [cloudUserTournaments, setCloudUserTournaments] = useState({ owned: [], coAdmin: [], member: [] });
  const [publicTournaments, setPublicTournaments] = useState([]);
  const [loadingPublic, setLoadingPublic] = useState(false);

  // Sync per-user Organizer profile from Auth + users/{uid}
  useEffect(() => {
    if (!user?.uid) {
      setOrganizer(loadOrganizer(null));
      return;
    }

    const baseLocal = loadOrganizer(user.uid);
    const merged = {
      ...DEFAULT_ORGANIZER,
      ...baseLocal,
      name: userProfile?.name || userProfile?.displayName || baseLocal.name || user.displayName || '',
      avatar: userProfile?.avatar || userProfile?.photoURL || baseLocal.avatar || user.photoURL || '',
      bio: userProfile?.bio ?? baseLocal.bio ?? '',
      contactWhatsApp: userProfile?.contactWhatsApp ?? baseLocal.contactWhatsApp ?? '',
      email: userProfile?.email || baseLocal.email || user.email || '',
    };
    setOrganizer(merged);
    saveOrganizer(merged, user.uid);
  }, [user, userProfile]);

  const updateOrganizer = useCallback((patch) => {
    setOrganizer(prev => {
      const next = { ...prev, ...patch };
      saveOrganizer(next, user?.uid || null);
      if (user?.uid && isFirebaseConfigured()) {
        upsertUserProfile(user, {
          name: next.name,
          avatar: next.avatar,
          bio: next.bio,
          contactWhatsApp: next.contactWhatsApp,
          email: next.email || user.email || '',
        });
      }
      return next;
    });
  }, [user]);

  // Subscribe to tournaments owned / co-administered / joined by signed-in user
  useEffect(() => {
    if (!isFirebaseConfigured() || !user?.uid) {
      setCloudUserTournaments({ owned: [], coAdmin: [], member: [] });
      return;
    }
    const unsub = subscribeUserTournaments(user.uid, (data) => {
      setCloudUserTournaments(data);
    });
    return () => unsub();
  }, [user?.uid]);

  // Refresh public tournaments list (and read-only legacy fallback)
  const refreshPublicTournaments = useCallback(async () => {
    if (!isFirebaseConfigured()) return;
    setLoadingPublic(true);
    try {
      const [pubList, legacyList] = await Promise.all([
        fetchPublicTournaments(),
        fetchLegacyGlobalTournaments(),
      ]);
      const byId = new Map();
      legacyList.forEach(t => { if (t?.id) byId.set(t.id, { ...t, isLegacy: true, isPublic: true }); });
      pubList.forEach(t => { if (t?.id) byId.set(t.id, t); });
      setPublicTournaments(Array.from(byId.values()));
    } finally {
      setLoadingPublic(false);
    }
  }, []);

  useEffect(() => {
    refreshPublicTournaments();
  }, [refreshPublicTournaments, user?.uid]);

  // Persist local global navigation state
  useEffect(() => {
    saveGlobal(globalState);
  }, [globalState]);

  // Sync URL ?t= parameter when viewing an active tournament
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      if (globalState.showManager) {
        if (url.searchParams.has('t')) {
          url.searchParams.delete('t');
          window.history.replaceState(null, '', url.toString());
        }
      } else if (globalState.activeTournamentId) {
        if (url.searchParams.get('t') !== globalState.activeTournamentId) {
          url.searchParams.set('t', globalState.activeTournamentId);
          window.history.replaceState(null, '', url.toString());
        }
      }
    } catch {}
  }, [globalState.activeTournamentId, globalState.showManager]);

  // Deduplicated lists for UI & backward compatibility
  const myTournaments = useMemo(() => {
    const map = new Map();
    if (user?.uid) {
      cloudUserTournaments.owned.forEach(t => map.set(t.id, t));
      cloudUserTournaments.coAdmin.forEach(t => {
        if (!map.has(t.id)) map.set(t.id, t);
      });
    }
    // Include local tournaments belonging to this user or created offline (no ownerUid or matching uid)
    globalState.localTournaments.forEach(t => {
      if (!t?.id) return;
      if (!t.ownerUid || (user?.uid && t.ownerUid === user.uid)) {
        if (!map.has(t.id)) map.set(t.id, t);
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }, [cloudUserTournaments.owned, cloudUserTournaments.coAdmin, globalState.localTournaments, user?.uid]);

  const joinedTournaments = useMemo(() => {
    if (!user?.uid) return [];
    const myIds = new Set(myTournaments.map(t => t.id));
    return cloudUserTournaments.member.filter(t => !myIds.has(t.id));
  }, [cloudUserTournaments.member, myTournaments, user?.uid]);

  const discoverTournaments = useMemo(() => {
    const exclude = new Set([
      ...myTournaments.map(t => t.id),
      ...joinedTournaments.map(t => t.id),
    ]);
    return publicTournaments.filter(t => !exclude.has(t.id));
  }, [publicTournaments, myTournaments, joinedTournaments]);

  const allTournaments = useMemo(() => {
    const map = new Map();
    [...myTournaments, ...joinedTournaments, ...publicTournaments].forEach(t => {
      if (t?.id) map.set(t.id, t);
    });
    return Array.from(map.values());
  }, [myTournaments, joinedTournaments, publicTournaments]);

  const createTournament = useCallback(async (name, format = 'HYBRID', options = {}) => {
    const id = `t_${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const isPublic = options.isPublic !== false;

    const meta = {
      id,
      name,
      format,
      createdAt: now,
      ownerUid: user?.uid || null,
      ownerName: organizer?.name || user?.displayName || '',
      ownerEmail: user?.email || '',
      isPublic,
    };

    const initialState = {
      organizer: {
        name,
        hostName: organizer?.name || user?.displayName || 'Local Organizer',
        logoUrl: organizer?.avatar || '',
        venue: '',
        mapLink: '',
        contactWhatsApp: organizer?.contactWhatsApp || '',
        rules: ['7-a-side format', '15-minute halves', 'Rolling substitutions'],
        format,
      },
      captains: [],
      teams: [],
      players: [],
      matches: [],
      awards: [],
      adminPin: '0000',
      draftMode: 'AUCTION',
      defaultBudget: 1000,
      auditLog: [],
      ownerUid: user?.uid || null,
      ownerName: organizer?.name || user?.displayName || '',
      ownerEmail: user?.email || '',
      coAdminUids: [],
      coAdmins: [],
      isPublic,
      allowGuestPinLogin: true,
      registrationSettings: {
        enabled: true,
        joinCode: generateJoinCode(id),
        maxPlayers: 0,
        deadline: '',
        entryFee: '',
        paymentInstructions: '',
        allowSelfWithdraw: true,
      },
      createdAt: now,
      _updatedAt: Date.now(),
    };

    try {
      localStorage.setItem(`mt_state_${id}`, JSON.stringify(initialState));
    } catch {}

    dispatch({ type: 'CREATE_TOURNAMENT', payload: meta });

    if (user?.uid && isFirebaseConfigured()) {
      await saveTournamentCloud(id, initialState);
    }

    return id;
  }, [user, organizer]);

  const deleteTournament = useCallback(async (id) => {
    dispatch({ type: 'DELETE_TOURNAMENT', payload: id });
    if (user?.uid && isFirebaseConfigured()) {
      await deleteTournamentCloud(id);
    }
  }, [user?.uid]);

  const selectTournament = useCallback((id) => {
    dispatch({ type: 'SELECT_TOURNAMENT', payload: id });
  }, []);

  const deselectTournament = useCallback(() => {
    dispatch({ type: 'DESELECT_TOURNAMENT' });
  }, []);

  const updateTournamentMeta = useCallback((meta) => {
    dispatch({ type: 'UPDATE_TOURNAMENT_META', payload: meta });
    if (user?.uid && isFirebaseConfigured() && meta?.id && meta?.name) {
      updateTournamentMetaCloud(meta.id, { name: meta.name, format: meta.format || 'HYBRID' });
    }
  }, [user?.uid]);

  const openTournamentByIdOrUrl = useCallback(async (rawInput) => {
    const trimmed = (rawInput || '').trim();
    if (!trimmed) return { ok: false, error: 'Enter a tournament ID or invite link.' };

    let extractedId = trimmed;
    try {
      if (trimmed.includes('://') || trimmed.includes('?')) {
        const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://example.com/${trimmed}`);
        extractedId = parsed.searchParams.get('t') || parsed.searchParams.get('tournament') || trimmed;
      }
    } catch {}

    extractedId = extractedId.replace(/^#\/?/, '').replace(/^tournament\//, '').trim();
    if (!extractedId) return { ok: false, error: 'Could not read tournament ID.' };

    if (isFirebaseConfigured()) {
      let meta = await fetchTournamentMetaById(extractedId);
      if (!meta && extractedId.length <= 10 && !extractedId.startsWith('t_')) {
        meta = await findTournamentByJoinCode(extractedId);
        if (meta?.id) {
          extractedId = meta.id;
        }
      }
      if (meta) {
        dispatch({ type: 'UPSERT_LOCAL_META', payload: meta });
        dispatch({ type: 'SELECT_TOURNAMENT', payload: extractedId });
        return { ok: true, id: extractedId };
      }
      const hasLocal = Boolean(localStorage.getItem(`mt_state_${extractedId}`));
      if (!hasLocal) {
        return { ok: false, error: 'Tournament not found. Check the ID, join code, or link.' };
      }
    }

    dispatch({ type: 'SELECT_TOURNAMENT', payload: extractedId });
    return { ok: true, id: extractedId };
  }, []);

  const cloneTournament = useCallback(async (sourceId, customName = '') => {
    if (!sourceId) return null;
    let source = null;
    try {
      const raw = localStorage.getItem(`mt_state_${sourceId}`);
      if (raw) source = JSON.parse(raw);
    } catch {}

    if (!source && isFirebaseConfigured()) {
      try {
        const meta = await fetchTournamentMetaById(sourceId);
        if (meta) source = { organizer: { name: meta.name, format: meta.format }, players: [], teams: [], captains: [] };
      } catch {}
    }

    const baseName = customName || `${source?.organizer?.name || 'Tournament'} (Season 2)`;
    const id = `t_${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const clonedPlayers = (source?.players || []).map(p => ({
      ...p,
      stats: { matches: 0, goals: 0, assists: 0, cleanSheets: 0, saves: 0, avgRating: 0, mvpCount: 0 },
    }));

    const clonedState = {
      organizer: { ...(source?.organizer || {}), name: baseName },
      captains: source?.captains || [],
      teams: (source?.teams || []).map(t => ({ ...t, spent: 0 })),
      players: clonedPlayers,
      matches: [],
      awards: [],
      adminPin: source?.adminPin || '0000',
      draftMode: source?.draftMode || 'AUCTION',
      defaultBudget: source?.defaultBudget || 1000,
      auditLog: [],
      ownerUid: user?.uid || null,
      ownerName: organizer?.name || user?.displayName || '',
      ownerEmail: user?.email || '',
      coAdminUids: [],
      coAdmins: [],
      isPublic: true,
      allowGuestPinLogin: true,
      registrationSettings: {
        enabled: true,
        joinCode: generateJoinCode(id),
        maxPlayers: source?.registrationSettings?.maxPlayers || 0,
        deadline: '',
        entryFee: source?.registrationSettings?.entryFee || '',
        paymentInstructions: source?.registrationSettings?.paymentInstructions || '',
        allowSelfWithdraw: true,
      },
      createdAt: now,
      _updatedAt: Date.now(),
    };

    try { localStorage.setItem(`mt_state_${id}`, JSON.stringify(clonedState)); } catch {}
    dispatch({
      type: 'CREATE_TOURNAMENT',
      payload: {
        id,
        name: baseName,
        format: clonedState.organizer?.format || 'HYBRID',
        createdAt: now,
        ownerUid: user?.uid || null,
        ownerName: organizer?.name || user?.displayName || '',
        ownerEmail: user?.email || '',
        isPublic: true,
      },
    });
    if (user?.uid && isFirebaseConfigured()) {
      await saveTournamentCloud(id, clonedState);
    }
    return id;
  }, [user, organizer]);

  const globalValue = {
    global: {
      ...globalState,
      tournaments: allTournaments,
    },
    myTournaments,
    joinedTournaments,
    discoverTournaments,
    loadingPublic,
    refreshPublicTournaments,
    createTournament,
    cloneTournament,
    deleteTournament,
    selectTournament,
    deselectTournament,
    updateTournamentMeta,
    openTournamentByIdOrUrl,
  };

  const orgValue = { organizer, updateOrganizer };

  return (
    <GlobalContext.Provider value={globalValue}>
      <OrganizerContext.Provider value={orgValue}>
        {children}
      </OrganizerContext.Provider>
    </GlobalContext.Provider>
  );
}

export function useGlobal() {
  return useContext(GlobalContext);
}

export function useOrganizer() {
  return useContext(OrganizerContext);
}
