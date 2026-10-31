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

const DEFAULT_ORGANIZER = {
  name: '',
  avatar: '',
  bio: '',
  contactWhatsApp: '',
  email: '',
};

const DEFAULT_GLOBAL = {
  tournaments: [],        // [{ id, name, createdAt, format }]
  activeTournamentId: null,
};

function loadGlobal() {
  try {
    const raw = localStorage.getItem(GM_KEY);
    return raw ? { ...DEFAULT_GLOBAL, ...JSON.parse(raw) } : DEFAULT_GLOBAL;
  } catch { return DEFAULT_GLOBAL; }
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
    case 'SET_GLOBAL_STATE':
      return {
        ...state,
        ...action.payload,
        // preserve activeTournamentId if not provided in cloud
        activeTournamentId: action.payload.activeTournamentId ?? state.activeTournamentId,
      };

    case 'CREATE_TOURNAMENT': {
      const t = {
        id:        `t_${Date.now().toString(36)}`,
        name:      action.payload.name,
        format:    action.payload.format || 'HYBRID',
        createdAt: new Date().toISOString(),
      };
      return { ...state, tournaments: [...state.tournaments, t], activeTournamentId: t.id };
    }
    case 'DELETE_TOURNAMENT': {
      try { localStorage.removeItem(`mt_state_${action.payload}`); } catch {}
      return {
        ...state,
        tournaments: state.tournaments.filter(t => t.id !== action.payload),
        activeTournamentId:
          state.activeTournamentId === action.payload ? null : state.activeTournamentId,
      };
    }
    case 'SELECT_TOURNAMENT':
      return { ...state, activeTournamentId: action.payload };
    case 'DESELECT_TOURNAMENT':
      return { ...state, activeTournamentId: null };
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
  const isRemoteOrganizerUpdate = useRef(false);

  // Realtime Cloud Listener for Global tournaments
  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    const unsubscribe = subscribeGlobal((cloudData) => {
      if (cloudData && Array.isArray(cloudData.tournaments)) {
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
      if (cloudData) {
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
      } else {
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
      } else {
        saveOrganizerCloud(organizer);
      }
    }
  }, [organizer]);

  const updateOrganizer = useCallback((patch) => {
    setOrganizer(prev => ({ ...prev, ...patch }));
  }, []);

  const globalValue = {
    global,
    createTournament:      useCallback((name, format) => dispatch({ type: 'CREATE_TOURNAMENT', payload: { name, format } }), []),
    deleteTournament:      useCallback((id)            => dispatch({ type: 'DELETE_TOURNAMENT',  payload: id }),             []),
    selectTournament:      useCallback((id)            => dispatch({ type: 'SELECT_TOURNAMENT',  payload: id }),             []),
    deselectTournament:    useCallback(()              => dispatch({ type: 'DESELECT_TOURNAMENT' }),                         []),
    updateTournamentMeta:  useCallback((meta)          => dispatch({ type: 'UPDATE_TOURNAMENT_META', payload: meta }),       []),
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

export function useGlobal()     { return useContext(GlobalContext); }
export function useOrganizer()  { return useContext(OrganizerContext); }
