import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import {
  subscribeTournament,
  subscribeTournamentSecrets,
  saveTournamentCloud,
  isFirebaseConfigured,
  generateJoinCode,
} from '../services/firebase';
import { useAuth } from './AuthContext';

// ── Default tournament state (Section 3 schema) ──
const DEFAULT_REGISTRATION_SETTINGS = {
  enabled: true,
  joinCode: '',
  maxPlayers: 0, // 0 = unlimited
  deadline: '',
  entryFee: '',
  paymentInstructions: '',
  allowSelfWithdraw: true,
};

const DEFAULT_ACTIVE_DRAFT = {
  phase: 'IDLE', // 'IDLE' | 'SPINNING' | 'BIDDING' | 'ASSIGNED'
  playerId: null,
  bids: {},
  highestTeamId: null,
  highestBid: 0,
  lastWinner: null,
  minSquadSize: 5,
  minBasePrice: 50,
  updatedAt: 0,
};

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
  tiebreakerMode: 'GD_GF_H2H',
  activeDraft: DEFAULT_ACTIVE_DRAFT,
  auditLog: [],
  ownerUid: null,
  ownerName: '',
  ownerEmail: '',
  coAdminUids: [],
  coAdmins: [],
  memberUids: [],
  isPublic: true,
  allowGuestPinLogin: true,
  registrationSettings: DEFAULT_REGISTRATION_SETTINGS,
  pinHashes: { admin: '', captains: {}, players: {} },
  _updatedAt: 0,
};

// ── Sanitize tournament state to prevent any undefined crashes ──
export function sanitizeTournamentState(rawState, preserveSecretsFrom = null) {
  if (!rawState || typeof rawState !== 'object') {
    return { ...DEFAULT_STATE, _updatedAt: Date.now() };
  }

  const prevPlayersById = new Map(
    (preserveSecretsFrom?.players || []).map(p => [p.id, p])
  );
  const prevCaptainsById = new Map(
    (preserveSecretsFrom?.captains || []).map(c => [c.id, c])
  );

  const rawPlayers = Array.isArray(rawState.players) ? rawState.players : [];
  const players = rawPlayers.map(p => {
    if (!p || typeof p !== 'object') return null;
    const stats = p.stats || {};
    const prev = prevPlayersById.get(p.id);
    const resolvedPin = p.pin !== undefined && p.pin !== ''
      ? String(p.pin)
      : (prev?.pin || (preserveSecretsFrom ? '' : generatePin()));
    return {
      id: p.id || generateId('plr'),
      name: p.name || 'Unknown Player',
      pin: resolvedPin,
      uid: p.uid || null,
      email: p.email || '',
      position: p.position || 'FLEX',
      rawPositions: Array.isArray(p.rawPositions)
        ? p.rawPositions
        : (p.position ? [p.position] : ['ANY']),
      jerseyNumber: (p.jerseyNumber !== undefined && p.jerseyNumber !== null && p.jerseyNumber !== '') ? Number(p.jerseyNumber) : null,
      avatar: p.avatar || '',
      bio: p.bio || '',
      status: p.status || 'UNDRAFTED',
      teamId: p.teamId || null,
      availability: p.availability || 'AVAILABLE',
      isOfficial: Boolean(p.isOfficial),
      paymentStatus: p.paymentStatus || 'UNPAID',
      paymentRef: p.paymentRef || '',
      stats: {
        matches: Number(stats.matches) || 0,
        goals: Number(stats.goals) || 0,
        assists: Number(stats.assists) || 0,
        cleanSheets: Number(stats.cleanSheets) || 0,
        saves: Number(stats.saves) || 0,
        avgRating: Number(stats.avgRating) || 0,
        mvpCount: Number(stats.mvpCount) || 0,
      },
    };
  }).filter(Boolean);

  const rawTeams = Array.isArray(rawState.teams) ? rawState.teams : [];
  const teams = rawTeams.map(t => {
    if (!t || typeof t !== 'object') return null;
    return {
      id: t.id || generateId('team'),
      name: t.name || 'Team',
      captainId: t.captainId || null,
      logo: t.logo || '⚡',
      primaryColor: t.primaryColor || '#3B82F6',
      motto: t.motto || '',
      photo: t.photo || '',
      rosterIds: Array.isArray(t.rosterIds) ? t.rosterIds : [],
      budget: (t.budget !== undefined && t.budget !== null) ? Number(t.budget) : 1000,
      spent: Number(t.spent) || 0,
    };
  }).filter(Boolean);

  const rawCaptains = Array.isArray(rawState.captains) ? rawState.captains : [];
  const captains = rawCaptains.map(c => {
    if (!c || typeof c !== 'object') return null;
    const prev = prevCaptainsById.get(c.id);
    const resolvedPin = c.pin !== undefined && c.pin !== ''
      ? String(c.pin)
      : (prev?.pin || (preserveSecretsFrom ? '' : generatePin()));
    return {
      id: c.id || generateId('cap'),
      name: c.name || 'Captain',
      pin: resolvedPin,
      uid: c.uid || null,
      email: c.email || '',
      teamId: c.teamId || null,
      avatar: c.avatar || '',
    };
  }).filter(Boolean);

  const rawMatches = Array.isArray(rawState.matches) ? rawState.matches : [];
  const matches = rawMatches.map(m => {
    if (!m || typeof m !== 'object') return null;
    return {
      ...m,
      events: Array.isArray(m.events) ? m.events : [],
      playerPerformance: Array.isArray(m.playerPerformance) ? m.playerPerformance : [],
      rsvp: m.rsvp && typeof m.rsvp === 'object' ? m.rsvp : {},
      lineups: m.lineups && typeof m.lineups === 'object' ? m.lineups : {},
    };
  }).filter(Boolean);

  const rawAwards = Array.isArray(rawState.awards) ? rawState.awards : [];
  const rawAuditLog = Array.isArray(rawState.auditLog) ? rawState.auditLog : [];
  const resolvedAdminPin = rawState.adminPin
    ? String(rawState.adminPin)
    : (preserveSecretsFrom?.adminPin || (preserveSecretsFrom ? '' : '0000'));

  return {
    ...DEFAULT_STATE,
    ...rawState,
    organizer: {
      ...DEFAULT_STATE.organizer,
      ...(rawState.organizer || {}),
    },
    captains,
    teams,
    players,
    matches,
    awards: rawAwards,
    auditLog: rawAuditLog,
    adminPin: resolvedAdminPin,
    draftMode: rawState.draftMode || 'AUCTION',
    defaultBudget: Number(rawState.defaultBudget) || 1000,
    tiebreakerMode: rawState.tiebreakerMode || 'GD_GF_H2H',
    activeDraft: {
      ...DEFAULT_ACTIVE_DRAFT,
      ...(rawState.activeDraft || {}),
      bids: rawState.activeDraft?.bids && typeof rawState.activeDraft.bids === 'object' ? rawState.activeDraft.bids : {},
    },
    ownerUid: rawState.ownerUid || null,
    ownerName: rawState.ownerName || '',
    ownerEmail: rawState.ownerEmail || '',
    coAdminUids: Array.isArray(rawState.coAdminUids) ? rawState.coAdminUids : [],
    coAdmins: Array.isArray(rawState.coAdmins) ? rawState.coAdmins : [],
    memberUids: Array.isArray(rawState.memberUids) ? rawState.memberUids : [],
    isPublic: rawState.isPublic !== false,
    allowGuestPinLogin: rawState.allowGuestPinLogin !== false,
    registrationSettings: {
      ...DEFAULT_REGISTRATION_SETTINGS,
      ...(rawState.registrationSettings || {}),
      maxPlayers: Number(rawState.registrationSettings?.maxPlayers) || 0,
    },
    pinHashes: rawState.pinHashes || { admin: '', captains: {}, players: {} },
    _updatedAt: rawState._updatedAt || 0,
  };
}

// ── Storage helpers (dynamic key for multi-tournament) ──
function loadState(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      return sanitizeTournamentState(parsed);
    }
  } catch (e) {
    console.warn('Failed to load state', e);
  }
  return { ...DEFAULT_STATE, _updatedAt: Date.now() };
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
      stats:        { matches: 0, goals: 0, assists: 0, cleanSheets: 0, saves: 0, avgRating: 0, mvpCount: 0 },
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
        stats:        { matches: 0, goals: 0, assists: 0, cleanSheets: 0, saves: 0, avgRating: 0, mvpCount: 0 },
      };

      players.push(player);
      const team = teams.find(t => t.id === teamId);
      if (team) team.rosterIds.push(player.id);
    });
  });

  return { players, captains, teams };
}

// ── Recompute Player Stats from All Completed Matches ──
export function recomputePlayerStats(players, matches) {
  const statsMap = {};
  players.forEach(p => {
    statsMap[p.id] = {
      matches: 0,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      saves: 0,
      ratings: [],
      mvpCount: 0,
    };
  });

  const completedMatches = matches.filter(m => m.status === 'COMPLETED');

  completedMatches.forEach(match => {
    // 1. Process goal events
    if (Array.isArray(match.events)) {
      match.events.forEach(ev => {
        if (!ev.type || ev.type === 'GOAL') {
          if (ev.scorerId && statsMap[ev.scorerId]) {
            statsMap[ev.scorerId].goals += 1;
          }
          if (ev.assistId && statsMap[ev.assistId]) {
            statsMap[ev.assistId].assists += 1;
          }
        }
      });
    }

    // 2. Process player performance records
    const countedAppearanceIds = new Set();
    if (Array.isArray(match.playerPerformance) && match.playerPerformance.length > 0) {
      match.playerPerformance.forEach(perf => {
        const pStats = statsMap[perf.playerId];
        if (!pStats) return;

        if (perf.played !== false) {
          pStats.matches += 1;
          countedAppearanceIds.add(perf.playerId);
        }
        if (perf.saves !== undefined && perf.saves !== null && perf.saves !== '') {
          pStats.saves += Number(perf.saves);
        }
        if (perf.cleanSheet) {
          pStats.cleanSheets += 1;
        }
        if (perf.rating !== undefined && perf.rating !== null && perf.rating !== '' && Number(perf.rating) > 0) {
          pStats.ratings.push(Number(perf.rating));
        }
      });
    }

    // 2b. Fallback appearance count from submitted matchday lineups if not logged in playerPerformance
    if (match.lineups && typeof match.lineups === 'object') {
      Object.values(match.lineups).forEach(lineup => {
        const playedIds = [
          ...(Array.isArray(lineup?.starters) ? lineup.starters : []),
          ...(Array.isArray(lineup?.subs) ? lineup.subs : []),
        ];
        playedIds.forEach(pid => {
          if (statsMap[pid] && !countedAppearanceIds.has(pid)) {
            statsMap[pid].matches += 1;
            countedAppearanceIds.add(pid);
          }
        });
      });
    }

    // 3. Match MVP
    if (match.mvpPlayerId && statsMap[match.mvpPlayerId]) {
      statsMap[match.mvpPlayerId].mvpCount += 1;
    }
  });

  const hasAnyLoggedMatchData = completedMatches.some(m =>
    (Array.isArray(m.events) && m.events.length > 0) ||
    (Array.isArray(m.playerPerformance) && m.playerPerformance.length > 0) ||
    (m.lineups && Object.keys(m.lineups).length > 0)
  );

  return players.map(p => {
    const calc = statsMap[p.id];
    if (!calc) return p;

    const currentStats = p.stats || {};
    const avgRating = calc.ratings.length > 0
      ? Number((calc.ratings.reduce((a, b) => a + b, 0) / calc.ratings.length).toFixed(1))
      : (currentStats.avgRating || 0);

    // If match events or performance records have been logged, use recalculated metrics.
    // Otherwise preserve baseline/manual values.
    const newStats = hasAnyLoggedMatchData ? {
      matches: calc.matches > 0 ? calc.matches : (currentStats.matches || 0),
      goals: calc.goals,
      assists: calc.assists,
      cleanSheets: calc.cleanSheets,
      saves: calc.saves,
      avgRating,
      mvpCount: calc.mvpCount > 0 ? calc.mvpCount : (currentStats.mvpCount || 0),
    } : {
      matches: currentStats.matches || 0,
      goals: currentStats.goals || 0,
      assists: currentStats.assists || 0,
      cleanSheets: currentStats.cleanSheets || 0,
      saves: currentStats.saves || 0,
      avgRating: currentStats.avgRating || 0,
      mvpCount: currentStats.mvpCount || 0,
    };

    return {
      ...p,
      stats: newStats,
    };
  });
}

// ── Reducer ──
function tournamentReducer(state, action) {
  switch (action.type) {
    case 'SET_STATE':
      return sanitizeTournamentState({ ...action.payload, _updatedAt: Date.now() });

    case 'SYNC_REMOTE_STATE': {
      const incoming = action.payload;
      if (!incoming || typeof incoming !== 'object') return state;

      const remotePlayers = Array.isArray(incoming.players) ? incoming.players : [];
      const localPlayers = Array.isArray(state.players) ? state.players : [];

      // Critical protection: If local state has players and cloud document has 0 players,
      // DO NOT wipe local state!
      if (localPlayers.length > 0 && remotePlayers.length === 0) {
        console.warn('Preserving local tournament data because remote has 0 players');
        return state;
      }

      // Check timestamps: if local state is newer, keep local state
      const remoteTime = incoming._updatedAt || 0;
      const localTime = state._updatedAt || 0;
      if (localTime > remoteTime && localPlayers.length >= remotePlayers.length && remoteTime > 0) {
        return state;
      }

      return sanitizeTournamentState({ ...incoming, _updatedAt: remoteTime || Date.now() }, state);
    }

    case 'SYNC_SECRETS': {
      const secrets = action.payload;
      if (!secrets || typeof secrets !== 'object') return state;
      const capPins = secrets.captainPins || {};
      const plrPins = secrets.playerPins || {};
      return {
        ...state,
        adminPin: secrets.adminPin ? String(secrets.adminPin) : state.adminPin,
        captains: state.captains.map(c =>
          capPins[c.id] ? { ...c, pin: String(capPins[c.id]) } : c
        ),
        players: state.players.map(p =>
          plrPins[p.id] ? { ...p, pin: String(plrPins[p.id]) } : p
        ),
      };
    }

    case 'SET_OWNERSHIP':
      return {
        ...state,
        ownerUid: action.payload.ownerUid || null,
        ownerName: action.payload.ownerName || '',
        ownerEmail: action.payload.ownerEmail || '',
        _updatedAt: Date.now(),
      };

    case 'ADD_CO_ADMIN': {
      const entry = action.payload;
      if (!entry?.uid || entry.uid === state.ownerUid) return state;
      const uids = Array.isArray(state.coAdminUids) ? state.coAdminUids : [];
      const list = Array.isArray(state.coAdmins) ? state.coAdmins : [];
      if (uids.includes(entry.uid)) return state;
      return {
        ...state,
        coAdminUids: [...uids, entry.uid],
        coAdmins: [...list, entry],
        _updatedAt: Date.now(),
      };
    }

    case 'REMOVE_CO_ADMIN': {
      const targetUid = action.payload;
      return {
        ...state,
        coAdminUids: (state.coAdminUids || []).filter(id => id !== targetUid),
        coAdmins: (state.coAdmins || []).filter(a => a.uid !== targetUid),
        _updatedAt: Date.now(),
      };
    }

    case 'SET_VISIBILITY':
      return {
        ...state,
        isPublic: Boolean(action.payload),
        _updatedAt: Date.now(),
      };

    case 'SET_GUEST_PIN_LOGIN':
      return {
        ...state,
        allowGuestPinLogin: Boolean(action.payload),
        _updatedAt: Date.now(),
      };

    case 'UPDATE_REGISTRATION_SETTINGS':
      return {
        ...state,
        registrationSettings: {
          ...DEFAULT_REGISTRATION_SETTINGS,
          ...(state.registrationSettings || {}),
          ...action.payload,
        },
        _updatedAt: Date.now(),
      };

    case 'LINK_MEMBER_UID': {
      const { role, entityId, uid, email } = action.payload;
      if (role === 'CAPTAIN') {
        const captains = state.captains.map(c =>
          c.id === entityId ? { ...c, uid: uid || null, email: email || '' } : c
        );
        return { ...state, captains, _updatedAt: Date.now() };
      }
      if (role === 'PLAYER') {
        const players = state.players.map(p =>
          p.id === entityId ? { ...p, uid: uid || null, email: email || '' } : p
        );
        return { ...state, players, _updatedAt: Date.now() };
      }
      return state;
    }

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

      // If player changed name, avatar, or PIN, and is also captain, keep captain in sync
      const syncedCaptains = state.captains.map(c => {
        if (oldPlayer && (c.name === oldPlayer.name || c.id === oldPlayer.id)) {
          return {
            ...c,
            name: updatedPlayer.name || c.name,
            pin: updatedPlayer.pin || c.pin,
            avatar: updatedPlayer.avatar !== undefined ? updatedPlayer.avatar : c.avatar,
          };
        }
        return c;
      });

      return {
        ...state,
        teams: newTeams,
        captains: syncedCaptains,
        players: state.players.map(p =>
          p.id === updatedPlayer.id ? { ...p, ...updatedPlayer } : p
        ),
        _updatedAt: Date.now(),
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
        _updatedAt: Date.now(),
      };

    case 'ADD_CAPTAIN':
      return { ...state, captains: [...state.captains, action.payload], _updatedAt: Date.now() };

    case 'UPDATE_CAPTAIN': {
      const updatedCap = action.payload;
      const oldCap = state.captains.find(c => c.id === updatedCap.id);
      return {
        ...state,
        captains: state.captains.map(c =>
          c.id === updatedCap.id ? { ...c, ...updatedCap } : c
        ),
        players: state.players.map(p =>
          oldCap && (p.name === oldCap.name || p.id === updatedCap.id)
            ? {
                ...p,
                name: updatedCap.name || p.name,
                pin: updatedCap.pin || p.pin,
                avatar: updatedCap.avatar !== undefined ? updatedCap.avatar : p.avatar,
              }
            : p
        ),
        _updatedAt: Date.now(),
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
            id: capId, name: player.name, pin: player.pin || generatePin(), teamId, avatar: player.avatar || '',
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

    case 'ADD_MATCH': {
      const newMatches = [...state.matches, action.payload];
      return {
        ...state,
        matches: newMatches,
        players: recomputePlayerStats(state.players, newMatches),
      };
    }

    case 'UPDATE_MATCH': {
      const updatedMatches = state.matches.map(m =>
        m.id === action.payload.id ? { ...m, ...action.payload } : m
      );
      return {
        ...state,
        matches: updatedMatches,
        players: recomputePlayerStats(state.players, updatedMatches),
      };
    }

    case 'DELETE_MATCH': {
      const remainingMatches = state.matches.filter(m => m.id !== action.payload);
      return {
        ...state,
        matches: remainingMatches,
        players: recomputePlayerStats(state.players, remainingMatches),
      };
    }

    case 'SET_MATCHES': {
      return {
        ...state,
        matches: action.payload,
        players: recomputePlayerStats(state.players, action.payload),
      };
    }

    case 'UPDATE_ROUND_MATCHES': {
      const { round, updates } = action.payload;
      const updated = state.matches.map(m =>
        m.round === round && m.stage === 'LEAGUE'
          ? { ...m, ...updates }
          : m
      );
      return {
        ...state,
        matches: updated,
        players: recomputePlayerStats(state.players, updated),
      };
    }

    case 'RECOMPUTE_STATS':
      return {
        ...state,
        players: recomputePlayerStats(state.players, state.matches),
      };

    case 'SET_TIEBREAKER_MODE':
      return {
        ...state,
        tiebreakerMode: action.payload || 'GD_GF_H2H',
        _updatedAt: Date.now(),
      };

    case 'SET_ACTIVE_DRAFT':
      return {
        ...state,
        activeDraft: {
          ...DEFAULT_ACTIVE_DRAFT,
          ...(state.activeDraft || {}),
          ...action.payload,
          updatedAt: Date.now(),
        },
        _updatedAt: Date.now(),
      };

    case 'PLACE_DRAFT_BID': {
      const { teamId, amount, byUid } = action.payload;
      const cur = state.activeDraft || DEFAULT_ACTIVE_DRAFT;
      const cleanAmt = Math.max(0, Number(amount) || 0);
      const nextBids = {
        ...(cur.bids || {}),
        [teamId]: { amount: cleanAmt, updatedAt: Date.now(), byUid: byUid || null },
      };

      let highestTeamId = null;
      let highestBid = 0;
      Object.entries(nextBids).forEach(([tid, entry]) => {
        const val = typeof entry === 'number' ? entry : (entry?.amount || 0);
        if (val > highestBid) {
          highestBid = val;
          highestTeamId = tid;
        }
      });

      return {
        ...state,
        activeDraft: {
          ...cur,
          bids: nextBids,
          highestTeamId,
          highestBid,
          updatedAt: Date.now(),
        },
        _updatedAt: Date.now(),
      };
    }

    case 'AUTO_FILL_UNDRAFTED': {
      if (state.teams.length === 0) return state;
      const posOrder = { GK: 0, DEF: 1, MID: 2, FWD: 3, FLEX: 4 };
      const undrafted = state.players
        .filter(p => p.status !== 'DRAFTED' && !p.teamId)
        .sort((a, b) => (posOrder[a.position] ?? 4) - (posOrder[b.position] ?? 4));
      if (undrafted.length === 0) return state;

      const teamCounts = new Map(state.teams.map(t => [t.id, (t.rosterIds || []).length]));
      const additions = new Map(state.teams.map(t => [t.id, []]));
      const playerTeamAssign = new Map();

      undrafted.forEach(p => {
        // Assign to the team with the fewest players currently
        let targetTeamId = state.teams[0].id;
        let minCount = Infinity;
        state.teams.forEach(t => {
          const c = teamCounts.get(t.id) ?? 0;
          if (c < minCount) {
            minCount = c;
            targetTeamId = t.id;
          }
        });
        teamCounts.set(targetTeamId, minCount + 1);
        additions.get(targetTeamId).push(p.id);
        playerTeamAssign.set(p.id, targetTeamId);
      });

      return {
        ...state,
        players: state.players.map(p =>
          playerTeamAssign.has(p.id)
            ? { ...p, teamId: playerTeamAssign.get(p.id), status: 'DRAFTED' }
            : p
        ),
        teams: state.teams.map(t => ({
          ...t,
          rosterIds: [...(t.rosterIds || []), ...(additions.get(t.id) || [])],
        })),
        activeDraft: {
          ...(state.activeDraft || DEFAULT_ACTIVE_DRAFT),
          phase: 'IDLE',
          playerId: null,
          bids: {},
          highestTeamId: null,
          highestBid: 0,
        },
        _updatedAt: Date.now(),
      };
    }

    case 'SET_MATCH_RSVP': {
      const { matchId, playerId, status } = action.payload;
      return {
        ...state,
        matches: state.matches.map(m =>
          m.id === matchId
            ? { ...m, rsvp: { ...(m.rsvp || {}), [playerId]: status } }
            : m
        ),
        _updatedAt: Date.now(),
      };
    }

    case 'SET_MATCH_LINEUP': {
      const { matchId, teamId, starters, subs } = action.payload;
      const updatedMatches = state.matches.map(m =>
        m.id === matchId
          ? { ...m, lineups: { ...(m.lineups || {}), [teamId]: { starters, subs } } }
          : m
      );
      return {
        ...state,
        matches: updatedMatches,
        players: recomputePlayerStats(state.players, updatedMatches),
        _updatedAt: Date.now(),
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

    case 'TOGGLE_OFFICIAL': {
      const playerId = action.payload;
      return {
        ...state,
        players: state.players.map(p =>
          p.id === playerId ? { ...p, isOfficial: !p.isOfficial } : p
        ),
        _updatedAt: Date.now(),
      };
    }

    case 'ADD_AUDIT_LOG': {
      const newLog = action.payload;
      const existingLogs = Array.isArray(state.auditLog) ? state.auditLog : [];
      return {
        ...state,
        auditLog: [newLog, ...existingLogs].slice(0, 150),
        _updatedAt: Date.now(),
      };
    }

    case 'CLEAR_AUDIT_LOG':
      return {
        ...state,
        auditLog: [],
        _updatedAt: Date.now(),
      };

    case 'RESET_STATE':
      return { ...DEFAULT_STATE };

    default:
      return state;
  }
}

// ── Context ──
const TournamentContext = createContext(null);

export function TournamentProvider({ children, storageKey = 'mt_state_default' }) {
  const { user } = useAuth();
  const tournamentId = storageKey.startsWith('mt_state_')
    ? storageKey.replace('mt_state_', '')
    : storageKey;

  const [state, dispatch] = useReducer(
    tournamentReducer,
    null,
    () => {
      const loaded = loadState(storageKey);
      if (!loaded.registrationSettings?.joinCode) {
        return {
          ...loaded,
          registrationSettings: {
            ...DEFAULT_REGISTRATION_SETTINGS,
            ...(loaded.registrationSettings || {}),
            joinCode: generateJoinCode(tournamentId),
          },
        };
      }
      return loaded;
    }
  );

  const isRemoteUpdate = useRef(false);
  const hasLocalChanges = useRef(false);

  const isOwner = Boolean(user?.uid && state.ownerUid && state.ownerUid === user.uid);
  const isCoAdmin = Boolean(user?.uid && Array.isArray(state.coAdminUids) && state.coAdminUids.includes(user.uid));
  const isLinkedMember = Boolean(
    user?.uid && (
      state.captains?.some(c => c.uid === user.uid) ||
      state.players?.some(p => p.uid === user.uid)
    )
  );
  const canWriteCloud = Boolean(
    user?.uid && (!state.ownerUid || isOwner || isCoAdmin || isLinkedMember)
  );

  // Local dispatch wrapper: only local user-initiated actions trigger a Firestore upload
  const dispatchLocal = useCallback((action) => {
    hasLocalChanges.current = true;
    dispatch(action);
  }, []);

  // Realtime Cloud Listener for active tournament public state
  useEffect(() => {
    if (!isFirebaseConfigured() || !tournamentId) return;

    const unsubscribe = subscribeTournament(tournamentId, (cloudData) => {
      if (cloudData && typeof cloudData === 'object' && cloudData.organizer) {
        isRemoteUpdate.current = true;
        dispatch({ type: 'SYNC_REMOTE_STATE', payload: cloudData });
      }
    });

    return () => unsubscribe();
  }, [tournamentId]);

  // Realtime Cloud Listener for private secrets (owner & co-admins only)
  useEffect(() => {
    if (!isFirebaseConfigured() || !tournamentId || !(isOwner || isCoAdmin)) return;

    const unsubscribe = subscribeTournamentSecrets(tournamentId, (secrets) => {
      isRemoteUpdate.current = true;
      dispatch({ type: 'SYNC_SECRETS', payload: secrets });
    });

    return () => unsubscribe();
  }, [tournamentId, isOwner, isCoAdmin]);

  // Persist state to local storage and Cloud (only when modified locally)
  useEffect(() => {
    saveState(storageKey, state);

    if (isFirebaseConfigured() && tournamentId) {
      if (isRemoteUpdate.current) {
        isRemoteUpdate.current = false;
        hasLocalChanges.current = false;
      } else if (hasLocalChanges.current) {
        hasLocalChanges.current = false;
        if (canWriteCloud) {
          saveTournamentCloud(tournamentId, state, {
            saveSecrets: isOwner || isCoAdmin || !state.ownerUid,
          });
        }
      }
    }
  }, [state, storageKey, tournamentId, canWriteCloud, isOwner, isCoAdmin]);

  const value = {
    state,
    tournamentId,
    isOwner,
    isCoAdmin,
    isLinkedMember,
    canWriteCloud,
    dispatch: dispatchLocal,
    updateOrganizer:  useCallback((d)    => dispatchLocal({ type: 'UPDATE_ORGANIZER',   payload: d }),                        [dispatchLocal]),
    bulkImport:       useCallback((d)    => dispatchLocal({ type: 'BULK_IMPORT',        payload: d }),                        [dispatchLocal]),
    addPlayer:        useCallback((p)    => dispatchLocal({ type: 'ADD_PLAYER',         payload: p }),                        [dispatchLocal]),
    updatePlayer:     useCallback((p)    => dispatchLocal({ type: 'UPDATE_PLAYER',      payload: p }),                        [dispatchLocal]),
    deletePlayer:     useCallback((id)   => dispatchLocal({ type: 'DELETE_PLAYER',      payload: id }),                       [dispatchLocal]),
    addCaptain:       useCallback((c)    => dispatchLocal({ type: 'ADD_CAPTAIN',        payload: c }),                        [dispatchLocal]),
    updateCaptain:    useCallback((c)    => dispatchLocal({ type: 'UPDATE_CAPTAIN',     payload: c }),                        [dispatchLocal]),
    deleteCaptain:    useCallback((id)   => dispatchLocal({ type: 'DELETE_CAPTAIN',     payload: id }),                       [dispatchLocal]),
    toggleCaptain:    useCallback((id)   => dispatchLocal({ type: 'TOGGLE_CAPTAIN',     payload: id }),                       [dispatchLocal]),
    addTeam:          useCallback((t)    => dispatchLocal({ type: 'ADD_TEAM',           payload: t }),                        [dispatchLocal]),
    updateTeam:       useCallback((t)    => dispatchLocal({ type: 'UPDATE_TEAM',        payload: t }),                        [dispatchLocal]),
    deleteTeam:       useCallback((id)   => dispatchLocal({ type: 'DELETE_TEAM',        payload: id }),                       [dispatchLocal]),
    draftPlayer:      useCallback((pid, tid) => dispatchLocal({ type: 'DRAFT_PLAYER',   payload: { playerId: pid, teamId: tid } }), [dispatchLocal]),
    undraftPlayer:    useCallback((pid)  => dispatchLocal({ type: 'UNDRAFT_PLAYER',     payload: { playerId: pid } }),         [dispatchLocal]),
    addMatch:           useCallback((m)              => dispatchLocal({ type: 'ADD_MATCH',             payload: m }),                        [dispatchLocal]),
    updateMatch:        useCallback((m)              => dispatchLocal({ type: 'UPDATE_MATCH',          payload: m }),                        [dispatchLocal]),
    deleteMatch:        useCallback((id)             => dispatchLocal({ type: 'DELETE_MATCH',          payload: id }),                       [dispatchLocal]),
    setMatches:         useCallback((matches)        => dispatchLocal({ type: 'SET_MATCHES',           payload: matches }),                  [dispatchLocal]),
    updateRoundMatches: useCallback((round, updates) => dispatchLocal({ type: 'UPDATE_ROUND_MATCHES', payload: { round, updates } }),       [dispatchLocal]),
    recomputeStats:     useCallback(()               => dispatchLocal({ type: 'RECOMPUTE_STATS' }),                           [dispatchLocal]),
    addAward:         useCallback((a)    => dispatchLocal({ type: 'ADD_AWARD',          payload: a }),                        [dispatchLocal]),
    updateAward:      useCallback((a)    => dispatchLocal({ type: 'UPDATE_AWARD',       payload: a }),                        [dispatchLocal]),
    deleteAward:      useCallback((id)   => dispatchLocal({ type: 'DELETE_AWARD',       payload: id }),                       [dispatchLocal]),
    toggleOfficial:   useCallback((id)   => dispatchLocal({ type: 'TOGGLE_OFFICIAL',    payload: id }),                       [dispatchLocal]),
    addAuditLog:      useCallback((log)  => dispatchLocal({ type: 'ADD_AUDIT_LOG',     payload: log }),                      [dispatchLocal]),
    clearAuditLog:    useCallback(()     => dispatchLocal({ type: 'CLEAR_AUDIT_LOG' }),                                       [dispatchLocal]),
    setAdminPin:      useCallback((pin)  => dispatchLocal({ type: 'SET_ADMIN_PIN',      payload: pin }),                      [dispatchLocal]),
    setDraftMode:     useCallback((mode) => dispatchLocal({ type: 'SET_DRAFT_MODE',     payload: mode }),                     [dispatchLocal]),
    setDefaultBudget: useCallback((n)    => dispatchLocal({ type: 'SET_DEFAULT_BUDGET', payload: n }),                        [dispatchLocal]),
    setTiebreakerMode: useCallback((m)   => dispatchLocal({ type: 'SET_TIEBREAKER_MODE', payload: m }),                       [dispatchLocal]),
    setActiveDraft:   useCallback((d)    => dispatchLocal({ type: 'SET_ACTIVE_DRAFT',   payload: d }),                        [dispatchLocal]),
    placeDraftBid:    useCallback((b)    => dispatchLocal({ type: 'PLACE_DRAFT_BID',    payload: b }),                        [dispatchLocal]),
    autoFillUndrafted: useCallback(()    => dispatchLocal({ type: 'AUTO_FILL_UNDRAFTED' }),                                   [dispatchLocal]),
    setMatchRsvp:     useCallback((data) => dispatchLocal({ type: 'SET_MATCH_RSVP',     payload: data }),                     [dispatchLocal]),
    setMatchLineup:   useCallback((data) => dispatchLocal({ type: 'SET_MATCH_LINEUP',   payload: data }),                     [dispatchLocal]),
    setOwnership:     useCallback((own)  => dispatchLocal({ type: 'SET_OWNERSHIP',      payload: own }),                      [dispatchLocal]),
    addCoAdmin:       useCallback((adm)  => dispatchLocal({ type: 'ADD_CO_ADMIN',       payload: adm }),                      [dispatchLocal]),
    removeCoAdmin:    useCallback((uid)  => dispatchLocal({ type: 'REMOVE_CO_ADMIN',    payload: uid }),                      [dispatchLocal]),
    setVisibility:    useCallback((pub)  => dispatchLocal({ type: 'SET_VISIBILITY',     payload: pub }),                      [dispatchLocal]),
    setGuestPinLogin: useCallback((allow)=> dispatchLocal({ type: 'SET_GUEST_PIN_LOGIN',payload: allow }),                    [dispatchLocal]),
    updateRegistrationSettings: useCallback((patch) => dispatchLocal({ type: 'UPDATE_REGISTRATION_SETTINGS', payload: patch }), [dispatchLocal]),
    linkMemberUid:    useCallback((data) => dispatchLocal({ type: 'LINK_MEMBER_UID',    payload: data }),                     [dispatchLocal]),
    resetState:       useCallback(()     => dispatchLocal({ type: 'RESET_STATE' }),                                           [dispatchLocal]),
    exportState:      useCallback(()     => JSON.stringify(state, null, 2), [state]),
    importState:      useCallback((json) => {
      try {
        dispatchLocal({ type: 'SET_STATE', payload: { ...DEFAULT_STATE, ...JSON.parse(json) } });
        return true;
      } catch { return false; }
    }, [dispatchLocal]),
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
