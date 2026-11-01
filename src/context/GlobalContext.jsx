import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import {
  subscribeGlobal, saveGlobalCloud,
  subscribeOrganizer, saveOrganizerCloud,
  isFirebaseConfigured
} from '../services/firebase';

/* ─────────────────────────────────────────────
   Global state that lives OUTSIDE tournaments:
   - Organizer profile (one person, all tournaments)
   - List of tournaments meta-data
   - Which tournament is currently active
───────────────────────────────────────────── */

const GM_KEY = 'mt_global';           // localStorage key for global meta
const ORG_KEY = 'mt_organizer';        // localStorage key for organizer profile

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

const DEFAULT_ORGANIZER = {
  name: '',
  avatar: '',
  bio: '',
  contactWhatsApp: '',
  email: '',
};

const DEFAULT_GLOBAL = {
  tournaments: [
    {
      id: 'default',
      name: 'Local Champions League',
      format: 'HYBRID',
      createdAt: '2026-11-01T00:00:00.000Z',
    }
  ],
  activeTournamentId: 'default',
  showManager: false,
};

function loadGlobal() {
  try {
    const urlId = getUrlTournamentId();
    const raw = localStorage.getItem(GM_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const tournaments = Array.isArray(parsed.tournaments) && parsed.tournaments.length > 0
        ? parsed.tournaments
        : DEFAULT_GLOBAL.tournaments;
      const activeTournamentId = urlId || parsed.activeTournamentId || tournaments[0]?.id || 'default';
      return {
        ...DEFAULT_GLOBAL,
        ...parsed,
        tournaments,
        activeTournamentId,
        showManager: parsed.showManager || false,
      };
    }
    if (urlId) {
      return {
        ...DEFAULT_GLOBAL,
        activeTournamentId: urlId,
        tournaments: [{ id: urlId, name: 'Local Champions League', format: 'HYBRID', createdAt: new Date().toISOString() }],
      };
    }
  } catch {
    return DEFAULT_GLOBAL;
  }
  return DEFAULT_GLOBAL;
}

function loadOrganizer() {
  try {
    const raw = localStorage.getItem(ORG_KEY);
    return raw ? { ...DEFAULT_ORGANIZER, ...JSON.parse(raw) } : DEFAULT_ORGANIZER;
  } catch { return DEFAULT_ORGANIZER; }
}

function saveGlobal(g)   { try { localStorage.setItem(GM_KEY,  JSON.stringify(g)); }   catch {} }
function saveOrganizer(o){ try { localStorage.setItem(ORG_KEY, JSON.stringify(o)); }   catch {} }

// Reducer
function globalReducer(state, action) {
  switch (action.type) {
    case 'SET_GLOBAL_STATE': {
      const incomingTournaments = Array.isArray(action.payload.tournaments) ? action.payload.tournaments : [];
      const currentTournaments = state.tournaments || [];
      const tournaments = incomingTournaments.length > 0 ? incomingTournaments : currentTournaments;

      // URL tournament ID has highest priority, then cloud active, then current, then first
      const urlId = getUrlTournamentId();
      let activeId = urlId || action.payload.activeTournamentId || state.activeTournamentId;
      if (!activeId && tournaments.length > 0) {
        activeId = tournaments[0].id;
      }

      return {
        ...state,
        tournaments,
        activeTournamentId: activeId || 'default',
        _updatedAt: action.payload._updatedAt || Date.now(),
      };
    }

    case 'CREATE_TOURNAMENT': {
      const t = {
        id:        `t_${Date.now().toString(36)}`,
        name:      action.payload.name,
        format:    action.payload.format || 'HYBRID',
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        tournaments: [...state.tournaments.filter(item => item.id !== t.id), t],
        activeTournamentId: t.id,
        showManager: false,
      };
    }
    case 'DELETE_TOURNAMENT': {
      try { localStorage.removeItem(`mt_state_${action.payload}`); } catch {}
      const remaining = state.tournaments.filter(t => t.id !== action.payload);
      return {
        ...state,
        tournaments: remaining,
        activeTournamentId: state.activeTournamentId === action.payload ? (remaining[0]?.id || 'default') : state.activeTournamentId,
      };
    }
    case 'SELECT_TOURNAMENT':
      return { ...state, activeTournamentId: action.payload, showManager: false };
    case 'DESELECT_TOURNAMENT':
      return { ...state, showManager: true };
    case 'UPDATE_TOURNAMENT_META':
      return {
        ...state,
        tournaments: state.tournaments.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
      };
    default:
      return state;
  }
}

// Contexts
const GlobalContext    = createContext(null);
const OrganizerContext = createContext(null);

export function GlobalProvider({ children }) {
  const [global, dispatch]        = useReducer(globalReducer, null, loadGlobal);
  const [organizer, setOrganizer] = React.useState(loadOrganizer);

  const isRemoteGlobalUpdate    = useRef(false);
  const hasLocalGlobalChanges   = useRef(false);
  const isRemoteOrganizerUpdate = useRef(false);
  const hasLocalOrganizerChanges = useRef(false);

  // Wrapped local dispatch that marks changes as local
  const dispatchLocal = useCallback((action) => {
    hasLocalGlobalChanges.current = true;
    dispatch(action);
  }, []);

  const updateOrganizerLocal = useCallback((patch) => {
    hasLocalOrganizerChanges.current = true;
    setOrganizer(prev => ({ ...prev, ...patch }));
  }, []);

  // Realtime Cloud Listener for Global tournaments
  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    const unsubscribe = subscribeGlobal((cloudData) => {
      if (cloudData && Array.isArray(cloudData.tournaments) && cloudData.tournaments.length > 0) {
        isRemoteGlobalUpdate.current = true;
        dispatch({ type: 'SET_GLOBAL_STATE', payload: cloudData });
      }
    });

    return () => unsubscribe();
  }, []);

  // Realtime Cloud Listener for Organizer profile
  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    const unsubscribe = subscribeOrganizer((cloudData) => {
      if (cloudData && typeof cloudData === 'object' && cloudData.name) {
        isRemoteOrganizerUpdate.current = true;
        setOrganizer(prev => ({ ...prev, ...cloudData }));
      }
    });

    return () => unsubscribe();
  }, []);

  // Persist Global State
  useEffect(() => {
    saveGlobal(global);
    if (isFirebaseConfigured()) {
      if (isRemoteGlobalUpdate.current) {
        isRemoteGlobalUpdate.current = false;
        hasLocalGlobalChanges.current = false;
      } else if (hasLocalGlobalChanges.current) {
        hasLocalGlobalChanges.current = false;
        saveGlobalCloud(global);
      }
    }
  }, [global]);

  // Persist Organizer State
  useEffect(() => {
    saveOrganizer(organizer);
    if (isFirebaseConfigured()) {
      if (isRemoteOrganizerUpdate.current) {
        isRemoteOrganizerUpdate.current = false;
        hasLocalOrganizerChanges.current = false;
      } else if (hasLocalOrganizerChanges.current) {
        hasLocalOrganizerChanges.current = false;
        saveOrganizerCloud(organizer);
      }
    }
  }, [organizer]);

  // Sync URL parameter if activeTournamentId changes
  useEffect(() => {
    if (global.activeTournamentId && typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get('t') !== global.activeTournamentId) {
          url.searchParams.set('t', global.activeTournamentId);
          window.history.replaceState(null, '', url.toString());
        }
      } catch {}
    }
  }, [global.activeTournamentId]);

  const globalValue = {
    global,
    createTournament:      useCallback((name, format) => dispatchLocal({ type: 'CREATE_TOURNAMENT', payload: { name, format } }), [dispatchLocal]),
    deleteTournament:      useCallback((id)            => dispatchLocal({ type: 'DELETE_TOURNAMENT',  payload: id }),             [dispatchLocal]),
    selectTournament:      useCallback((id)            => dispatchLocal({ type: 'SELECT_TOURNAMENT',  payload: id }),             [dispatchLocal]),
    deselectTournament:    useCallback(()              => dispatchLocal({ type: 'DESELECT_TOURNAMENT' }),                         [dispatchLocal]),
    updateTournamentMeta:  useCallback((meta)          => dispatchLocal({ type: 'UPDATE_TOURNAMENT_META', payload: meta }),       [dispatchLocal]),
  };

  const orgValue = { organizer, updateOrganizer: updateOrganizerLocal };

  return (
    <GlobalContext.Provider value={globalValue}>
      <OrganizerContext.Provider value={orgValue}>
        {children}
      </OrganizerContext.Provider>
    </GlobalContext.Provider>
  );
}

export function useGlobal()     { return useContext(GlobalContext); }
export function useOrganizer()  { return useContext(OrganizerContext); }
