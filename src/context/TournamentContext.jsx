import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

// ── Default tournament state (Section 3 schema) ──
const DEFAULT_STATE = {
  organizer: {
    name: 'Local Champions League',
    hostName: 'City Sports Club',
    logoUrl: '',
    venue: 'Central Turf Arena',
    mapLink: 'https://maps.google.com',
    contactWhatsApp: '+1234567890',
    rules: ['7-a-side format', '15-minute halves', 'Rolling substitutions'],
    format: 'HYBRID',
  },
  captains: [],
  teams: [],
  players: [],
  matches: [],
  awards: [],
  adminPin: '0000',
  draftMode: 'AUCTION', // 'AUCTION' | 'FREE'
  defaultBudget: 1000,
};

// ── Storage helpers (dynamic key for multi-tournament) ──
function loadState(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Failed to load state', e);
  }
  return { ...DEFAULT_STATE };
}

function saveState(storageKey, state) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state', e);
  }
}

let idCounter = Date.now();
export function generateId(prefix) {
  return `${prefix}_${(++idCounter).toString(36)}`;
}

export function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// ── Position mapping ──
const POSITION_MAP = {
  GK: 'GK', GOALKEEPER: 'GK',
  CB: 'DEF', LB: 'DEF', RB: 'DEF', WB: 'DEF', DEF: 'DEF', DF: 'DEF',
  CM: 'MID', CDM: 'MID', CAM: 'MID', ATM: 'MID', LM: 'MID', RM: 'MID', MID: 'MID', MF: 'MID',
  ST: 'FWD', CF: 'FWD', LW: 'FWD', RW: 'FWD', FWD: 'FWD', ATT: 'FWD',
};

function mapPositionCategory(rawTag) {
  return POSITION_MAP[rawTag.toUpperCase()] || 'FLEX';
}

// ─────────────────────────────────────────────────────────────────────────
//  SMART BULK PARSER  (Mode A: plain player list)
// ─────────────────────────────────────────────────────────────────────────
export function parseBulkPlayerText(rawText) {
  const lines = rawText
    .split(/\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  return lines.map(line => {
    let s = line
      .replace(/^[\d]+[.):\-\s]+/, '')
      .replace(/^[-*]\s*/, '')
      .trim();

    const coRegex = /\(\s*(captain\s+only|cap\s+only|co)\s*\)/i;
    const isCaptainOnly = coRegex.test(s);
    if (isCaptainOnly) s = s.replace(coRegex, '').trim();

    const capRegex = /\(\s*(captain|cap|c)\s*\)/i;
    const isCaptain = isCaptainOnly || capRegex.test(s);
    s = s.replace(capRegex, '').trim();

    let rawPositions = [];
    const groupRe = /[(\[][^\)\]]+[)\]]/g;
    const groups = [...s.matchAll(groupRe)];
    groups.forEach(m => {
      const inside = m[0].replace(/[()[\]]/g, '');
      const tags = inside
        .split(/[,/\s]+/)
        .map(t => t.trim().toUpperCase())
        .filter(t => t.length > 0);
      rawPositions.push(...tags);
    });
    s = s.replace(groupRe, '').replace(/\s+/g, ' ').trim();

    const name     = s;
    const position = rawPositions.length > 0 ? mapPositionCategory(rawPositions[0]) : 'FLEX';
    if (rawPositions.length === 0) rawPositions = ['ANY'];

    return { name, isCaptain, isCaptainOnly, position, rawPositions };
  }).filter(p => p.name.length > 0);
}

// ─────────────────────────────────────────────────────────────────────────
//  MODE B: Team Roster Parser
//  team GK warriors
//  Aryan (captain)
//  Shourav (ATM)
// ─────────────────────────────────────────────────────────────────────────
export function parseTeamRosterText(rawText) {
  const lines = rawText
    .split(/\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const teamsData = [];
  let currentTeam = null;

  lines.forEach(line => {
    if (/^team\s+/i.test(line)) {
      currentTeam = { name: line.replace(/^team\s+/i, '').trim(), members: [] };
      teamsData.push(currentTeam);
      return;
    }
    if (!currentTeam) return;

    let s = line
      .replace(/^[\d]+[.):\-\s]+/, '')
      .replace(/^[-*]\s*/, '')
      .trim();

    const coRegex = /\(\s*(captain\s+only|cap\s+only|co)\s*\)/i;
    const isCaptainOnly = coRegex.test(s);
    if (isCaptainOnly) s = s.replace(coRegex, '').trim();

    const capRegex = /\(\s*(captain|cap|c)\s*\)/i;
    const isCaptain = isCaptainOnly || capRegex.test(s);
    s = s.replace(capRegex, '').trim();

    let rawPositions = [];
    const groupRe = /[(\[][^\)\]]+[)\]]/g;
    const groups = [...s.matchAll(groupRe)];
    groups.forEach(m => {
      const inside = m[0].replace(/[()[\]]/g, '');
      const tags = inside.split(/[,/\s]+/).map(t => t.trim().toUpperCase()).filter(t => t.length > 0);
      rawPositions.push(...tags);
    });
    s = s.replace(groupRe, '').replace(/\s+/g, ' ').trim();

    const name     = s;
    const position = rawPositions.length > 0 ? mapPositionCategory(rawPositions[0]) : 'FLEX';
    if (rawPositions.length === 0) rawPositions = ['ANY'];

    if (name.length > 0) {
      currentTeam.members.push({ name, isCaptain, isCaptainOnly, position, rawPositions });
    }
  });

  return teamsData;
}

// ── Build from plain player list (Mode A) ──
export function buildFromParsed(parsedList, defaultBudget = 1000) {
  const players  = [];
  const captains = [];
  const teams    = [];

  const TEAM_EMOJIS = ['lightning','fire','star','target','rocket','gem','lion','dragon','eagle','wolf'];
  const EMOJI_MAP   = { lightning:'⚡', fire:'🔥', star:'🌟', target:'🎯', rocket:'🚀', gem:'💎', lion:'🦁', dragon:'🐉', eagle:'🦅', wolf:'🐺' };
  const LOGOS = ['⚡','🔥','🌟','🎯','🚀','💎','🦁','🐉','🦅','🐺'];
  const COLORS = ['#10B981','#EF4444','#3B82F6','#F59E0B','#8B5CF6','#EC4899','#14B8A6','#F97316'];

  parsedList.forEach(entry => {
    let teamId = null;

    if (entry.isCaptain) {
      const capId  = generateId('cap');
      teamId       = generateId('team');
      const capPin = generatePin();
      const idx    = teams.length;

      captains.push({ id: capId, name: entry.name, pin: capPin, teamId, avatar: '' });
      teams.push({
        id: teamId, name: `Team ${entry.name}`, captainId: capId,
        logo: LOGOS[idx % LOGOS.length], primaryColor: COLORS[idx % COLORS.length],
        motto: '', rosterIds: [], budget: defaultBudget, spent: 0,
      });
    }

    if (entry.isCaptainOnly) return;

    const player = {
      id:           generateId('plr'),
      name:         entry.name,
      pin:          generatePin(),
      position:     entry.position,
      rawPositions: entry.rawPositions,
      jerseyNumber: null,
      avatar:       '',
      bio:          '',
      status:       entry.isCaptain ? 'DRAFTED' : 'UNDRAFTED',
      teamId:       entry.isCaptain ? teamId : null,
      availability: 'AVAILABLE',
      stats:        { matches: 0, goals: 0, assists: 0, cleanSheets: 0, mvpCount: 0 },
    };

    players.push(player);

    if (entry.isCaptain && teamId) {
      const team = teams.find(t => t.id === teamId);
      if (team) team.rosterIds.push(player.id);
    }
  });

  return { players, captains, teams };
}

// ── Build from pre-decided team rosters (Mode B) ──
export function buildFromTeamRoster(teamsData, defaultBudget = 1000) {
  const players  = [];
  const captains = [];
  const teams    = [];

  const LOGOS  = ['⚡','🔥','🌟','🎯','🚀','💎','🦁','🐉','🦅','🐺'];
  const COLORS = ['#10B981','#EF4444','#3B82F6','#F59E0B','#8B5CF6','#EC4899','#14B8A6','#F97316'];

  teamsData.forEach((teamData, idx) => {
    const teamId = generateId('team');
    let captainId = null;

    const captainEntry = teamData.members.find(m => m.isCaptain);
    if (captainEntry) {
      const capId = generateId('cap');
      captainId = capId;
      captains.push({ id: capId, name: captainEntry.name, pin: generatePin(), teamId, avatar: '' });
    }

    teams.push({
      id: teamId, name: teamData.name, captainId,
      logo: LOGOS[idx % LOGOS.length], primaryColor: COLORS[idx % COLORS.length],
      motto: '', rosterIds: [], budget: defaultBudget, spent: 0,
    });

    teamData.members.forEach(member => {
      if (member.isCaptainOnly) return;

      const player = {
        id:           generateId('plr'),
        name:         member.name,
        pin:          generatePin(),
        position:     member.position,
        rawPositions: member.rawPositions,
        jerseyNumber: null,
        avatar:       '',
        bio:          '',
        status:       'DRAFTED',
        teamId,
        availability: 'AVAILABLE',
        stats:        { matches: 0, goals: 0, assists: 0, cleanSheets: 0, mvpCount: 0 },
      };

      players.push(player);
      const team = teams.find(t => t.id === teamId);
      if (team) team.rosterIds.push(player.id);
    });
  });

  return { players, captains, teams };
}

// ── Reducer ──
function tournamentReducer(state, action) {
  switch (action.type) {
    case 'SET_STATE':
      return { ...action.payload };

    case 'UPDATE_ORGANIZER':
      return { ...state, organizer: { ...state.organizer, ...action.payload } };

    case 'SET_ADMIN_PIN':
      return { ...state, adminPin: action.payload };

    case 'SET_DRAFT_MODE':
      return { ...state, draftMode: action.payload };

    case 'SET_DEFAULT_BUDGET':
      return { ...state, defaultBudget: action.payload };

    case 'BULK_IMPORT': {
      const { players, captains, teams } = action.payload;
      return {
        ...state,
        players:  [...state.players,  ...players],
        captains: [...state.captains, ...captains],
        teams:    [...state.teams,    ...teams],
      };
    }

    case 'ADD_PLAYER':
      return { ...state, players: [...state.players, action.payload] };

    case 'UPDATE_PLAYER': {
      const updatedPlayer = action.payload;
      const oldPlayer = state.players.find(p => p.id === updatedPlayer.id);
      let newTeams = state.teams;
      if (oldPlayer && oldPlayer.teamId !== updatedPlayer.teamId) {
        newTeams = state.teams.map(t => {
          let rIds = t.rosterIds || [];
          if (t.id === oldPlayer.teamId) {
            rIds = rIds.filter(id => id !== updatedPlayer.id);
          }
          if (t.id === updatedPlayer.teamId && !rIds.includes(updatedPlayer.id)) {
            rIds = [...rIds, updatedPlayer.id];
          }
          return { ...t, rosterIds: rIds };
        });
      }
      return {
        ...state,
        teams: newTeams,
        players: state.players.map(p =>
          p.id === updatedPlayer.id ? { ...p, ...updatedPlayer } : p
        ),
      };
    }

    case 'DELETE_PLAYER':
      return {
        ...state,
        players: state.players.filter(p => p.id !== action.payload),
        teams:   state.teams.map(t => ({
          ...t,
          rosterIds: t.rosterIds.filter(id => id !== action.payload),
        })),
      };

    case 'ADD_CAPTAIN':
      return { ...state, captains: [...state.captains, action.payload] };

    case 'UPDATE_CAPTAIN': {
      const updatedCap = action.payload;
      const oldCap = state.captains.find(c => c.id === updatedCap.id);
      return {
        ...state,
        captains: state.captains.map(c =>
          c.id === updatedCap.id ? { ...c, ...updatedCap } : c
        ),
        players: state.players.map(p =>
          oldCap && p.name === oldCap.name ? { ...p, name: updatedCap.name || p.name } : p
        ),
      };
    }

    case 'DELETE_CAPTAIN': {
      const cap = state.captains.find(c => c.id === action.payload);
      return {
        ...state,
        captains: state.captains.filter(c => c.id !== action.payload),
        teams:    cap ? state.teams.filter(t => t.id !== cap.teamId) : state.teams,
      };
    }

    case 'TOGGLE_CAPTAIN': {
      const playerId    = action.payload;
      const existingCap = state.captains.find(c =>
        state.players.find(p => p.id === playerId && p.name === c.name)
      );
      if (existingCap) {
        return {
          ...state,
          captains: state.captains.filter(c => c.id !== existingCap.id),
          teams:    state.teams.filter(t    => t.id !== existingCap.teamId),
          players:  state.players.map(p =>
            p.teamId === existingCap.teamId
              ? { ...p, teamId: null, status: 'UNDRAFTED' }
              : p
          ),
        };
      } else {
        const player = state.players.find(p => p.id === playerId);
        if (!player) return state;
        const capId  = generateId('cap');
        const teamId = generateId('team');
        const idx    = state.teams.length;
        const EMOJIS = ['⚡','🔥','🌟','🎯','🚀','💎','🦁','🐉','🦅','🐺'];
        const COLORS = ['#10B981','#EF4444','#3B82F6','#F59E0B','#8B5CF6','#EC4899','#14B8A6','#F97316'];
        return {
          ...state,
          captains: [...state.captains, {
            id: capId, name: player.name, pin: generatePin(), teamId, avatar: player.avatar || '',
          }],
          teams: [...state.teams, {
            id: teamId, name: `Team ${player.name}`, captainId: capId,
            logo: EMOJIS[idx % EMOJIS.length], primaryColor: COLORS[idx % COLORS.length],
            motto: '', rosterIds: [player.id],
            budget: state.defaultBudget || 1000, spent: 0,
          }],
          players: state.players.map(p =>
            p.id === playerId ? { ...p, teamId, status: 'DRAFTED' } : p
          ),
        };
      }
    }

    case 'ADD_TEAM':
      return { ...state, teams: [...state.teams, action.payload] };

    case 'UPDATE_TEAM':
      return {
        ...state,
        teams: state.teams.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
      };

    case 'DELETE_TEAM':
      return {
        ...state,
        teams:   state.teams.filter(t => t.id !== action.payload),
        players: state.players.map(p =>
          p.teamId === action.payload ? { ...p, teamId: null, status: 'UNDRAFTED' } : p
        ),
      };

    case 'DRAFT_PLAYER': {
      const { playerId, teamId } = action.payload;
      return {
        ...state,
        players: state.players.map(p =>
          p.id === playerId ? { ...p, teamId, status: 'DRAFTED' } : p
        ),
        teams: state.teams.map(t =>
          t.id === teamId ? { ...t, rosterIds: [...t.rosterIds, playerId] } : t
        ),
      };
    }

    case 'UNDRAFT_PLAYER': {
      const { playerId } = action.payload;
      const pl = state.players.find(p => p.id === playerId);
      const oldTeamId = pl?.teamId;
      return {
        ...state,
        players: state.players.map(p =>
          p.id === playerId ? { ...p, teamId: null, status: 'UNDRAFTED' } : p
        ),
        teams: state.teams.map(t =>
          t.id === oldTeamId ? { ...t, rosterIds: t.rosterIds.filter(id => id !== playerId) } : t
        ),
      };
    }

    case 'ADD_MATCH':
      return { ...state, matches: [...state.matches, action.payload] };

    case 'UPDATE_MATCH':
      return {
        ...state,
        matches: state.matches.map(m =>
          m.id === action.payload.id ? { ...m, ...action.payload } : m
        ),
      };

    case 'DELETE_MATCH':
      return { ...state, matches: state.matches.filter(m => m.id !== action.payload) };

    case 'SET_MATCHES':
      return { ...state, matches: action.payload };

    case 'UPDATE_ROUND_MATCHES': {
      const { round, updates } = action.payload;
      return {
        ...state,
        matches: state.matches.map(m =>
          m.round === round && m.stage === 'LEAGUE'
            ? { ...m, ...updates }
            : m
        ),
      };
    }

    case 'ADD_AWARD':
      return { ...state, awards: [...state.awards, action.payload] };

    case 'UPDATE_AWARD':
      return {
        ...state,
        awards: state.awards.map(a =>
          a.id === action.payload.id ? { ...a, ...action.payload } : a
        ),
      };

    case 'DELETE_AWARD':
      return { ...state, awards: state.awards.filter(a => a.id !== action.payload) };

    case 'RESET_STATE':
      return { ...DEFAULT_STATE };

    default:
      return state;
  }
}

// ── Context ──
const TournamentContext = createContext(null);

export function TournamentProvider({ children, storageKey = 'mt_state_default' }) {
  const [state, dispatch] = useReducer(
    tournamentReducer,
    null,
    () => loadState(storageKey)
  );

  useEffect(() => { saveState(storageKey, state); }, [state, storageKey]);

  const value = {
    state,
    dispatch,
    updateOrganizer:  useCallback((d)    => dispatch({ type: 'UPDATE_ORGANIZER',   payload: d }),                        []),
    bulkImport:       useCallback((d)    => dispatch({ type: 'BULK_IMPORT',        payload: d }),                        []),
    addPlayer:        useCallback((p)    => dispatch({ type: 'ADD_PLAYER',         payload: p }),                        []),
    updatePlayer:     useCallback((p)    => dispatch({ type: 'UPDATE_PLAYER',      payload: p }),                        []),
    deletePlayer:     useCallback((id)   => dispatch({ type: 'DELETE_PLAYER',      payload: id }),                       []),
    addCaptain:       useCallback((c)    => dispatch({ type: 'ADD_CAPTAIN',        payload: c }),                        []),
    updateCaptain:    useCallback((c)    => dispatch({ type: 'UPDATE_CAPTAIN',     payload: c }),                        []),
    deleteCaptain:    useCallback((id)   => dispatch({ type: 'DELETE_CAPTAIN',     payload: id }),                       []),
    toggleCaptain:    useCallback((id)   => dispatch({ type: 'TOGGLE_CAPTAIN',     payload: id }),                       []),
    addTeam:          useCallback((t)    => dispatch({ type: 'ADD_TEAM',           payload: t }),                        []),
    updateTeam:       useCallback((t)    => dispatch({ type: 'UPDATE_TEAM',        payload: t }),                        []),
    deleteTeam:       useCallback((id)   => dispatch({ type: 'DELETE_TEAM',        payload: id }),                       []),
    draftPlayer:      useCallback((pid, tid) => dispatch({ type: 'DRAFT_PLAYER',   payload: { playerId: pid, teamId: tid } }), []),
    undraftPlayer:    useCallback((pid)  => dispatch({ type: 'UNDRAFT_PLAYER',     payload: { playerId: pid } }),         []),
    addMatch:           useCallback((m)              => dispatch({ type: 'ADD_MATCH',             payload: m }),                        []),
    updateMatch:        useCallback((m)              => dispatch({ type: 'UPDATE_MATCH',          payload: m }),                        []),
    deleteMatch:        useCallback((id)             => dispatch({ type: 'DELETE_MATCH',          payload: id }),                       []),
    setMatches:         useCallback((matches)        => dispatch({ type: 'SET_MATCHES',           payload: matches }),                  []),
    updateRoundMatches: useCallback((round, updates) => dispatch({ type: 'UPDATE_ROUND_MATCHES', payload: { round, updates } }),       []),
    addAward:         useCallback((a)    => dispatch({ type: 'ADD_AWARD',          payload: a }),                        []),
    updateAward:      useCallback((a)    => dispatch({ type: 'UPDATE_AWARD',       payload: a }),                        []),
    deleteAward:      useCallback((id)   => dispatch({ type: 'DELETE_AWARD',       payload: id }),                       []),
    setAdminPin:      useCallback((pin)  => dispatch({ type: 'SET_ADMIN_PIN',      payload: pin }),                      []),
    setDraftMode:     useCallback((mode) => dispatch({ type: 'SET_DRAFT_MODE',     payload: mode }),                     []),
    setDefaultBudget: useCallback((n)    => dispatch({ type: 'SET_DEFAULT_BUDGET', payload: n }),                        []),
    resetState:       useCallback(()     => dispatch({ type: 'RESET_STATE' }),                                           []),
    exportState:      useCallback(()     => JSON.stringify(state, null, 2), [state]),
    importState:      useCallback((json) => {
      try {
        dispatch({ type: 'SET_STATE', payload: { ...DEFAULT_STATE, ...JSON.parse(json) } });
        return true;
      } catch { return false; }
    }, []),
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error('useTournament must be used within TournamentProvider');
  return ctx;
}
