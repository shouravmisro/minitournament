import React, { useState, useMemo } from 'react';
import { useTournament, generateId } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import {
  Calendar, Play, CheckCircle, Edit3, Save, X, Shuffle, ShieldCheck,
  AlertCircle, RefreshCw, ChevronDown, ChevronUp, Clock, Plus,
  Trash2, MapPin, Settings2, Target, Zap, Shield, Trophy, Star,
  Award, Activity, Users, ChevronRight, Eye
} from 'lucide-react';

/* ── Standard round-robin pairing algorithm ── */
function generateRoundRobinPairings(teamIds) {
  const n = teamIds.length;
  const list = n % 2 === 0 ? [...teamIds] : [...teamIds, null];
  const total = list.length;
  const numRounds = total - 1;
  const rounds = [];

  for (let r = 0; r < numRounds; r++) {
    const roundPairs = [];
    for (let i = 0; i < total / 2; i++) {
      const a = list[i];
      const b = list[total - 1 - i];
      if (a !== null && b !== null) {
        roundPairs.push({ teamAId: a, teamBId: b });
      }
    }
    rounds.push(roundPairs);
    const last = list.pop();
    list.splice(1, 0, last);
  }
  return rounds;
}

const POS_BADGE = {
  GK: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  DEF: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  MID: 'bg-green-500/20 text-green-300 border-green-500/40',
  FWD: 'bg-red-500/20 text-red-300 border-red-500/40',
  FLEX: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
};

function getRatingBadge(rating) {
  const num = Number(rating);
  if (!num || isNaN(num)) return 'bg-[#050814] text-amber-500/40 border-amber-900/40';
  if (num >= 8.5) return 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
  if (num >= 7.0) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold';
  if (num >= 6.0) return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
  return 'bg-[#0b132b] text-amber-500/60 border-amber-900/50';
}

/* ── Modal for Generating Dynamic League Fixtures ── */
function FixtureGeneratorModal({ onClose, onGenerate, teamCount }) {
  const [scheduleType, setScheduleType] = useState('WEEKS'); // 'WEEKS' | 'DAILY' | 'ROUNDS'
  const [duration, setDuration] = useState(scheduleType === 'WEEKS' ? 4 : scheduleType === 'DAILY' ? 3 : 1);
  const [matchesStyle, setMatchesStyle] = useState('FULL_CYCLE'); // 'FULL_CYCLE' | 'DISTRIBUTED'
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('18:00');
  const [intervalMins, setIntervalMins] = useState(45);
  const [defaultVenue, setDefaultVenue] = useState('Turf Arena - Pitch 1');

  function handleTypeChange(type) {
    setScheduleType(type);
    if (type === 'WEEKS') setDuration(4);
    else if (type === 'DAILY') setDuration(3);
    else setDuration(1);
  }

  function handleSubmit(e) {
    e.preventDefault();
    onGenerate({
      scheduleType,
      duration: Math.max(1, Math.min(10, Number(duration))),
      matchesStyle,
      startDate,
      startTime,
      intervalMins: Number(intervalMins),
      defaultVenue,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-[#050814]/85 backdrop-blur-md z-[150] flex items-center justify-center p-4">
      <div className="sketch-border bg-[#0b132b] rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 space-y-5 text-amber-50 shadow-2xl">
        <div className="flex items-center justify-between border-b border-amber-900/30 border-dashed pb-3">
          <h3 className="text-2xl font-serif text-amber-200 flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-purple-400" />
            Generate Dynamic League Schedule
          </h3>
          <button onClick={onClose} className="text-amber-500/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60 block mb-1.5">
              Tournament Cadence
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'WEEKS', label: '📅 Weekly League', desc: 'Plays for weeks' },
                { id: 'DAILY', label: '⚡ Daily Tourney', desc: 'Plays every day' },
                { id: 'ROUNDS', label: '🔄 Classic Rounds', desc: 'Round-robin legs' },
              ].map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => handleTypeChange(opt.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    scheduleType === opt.id
                      ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                      : 'border-amber-900/30 border-dashed bg-[#050814]/60 text-amber-500/60 hover:border-amber-900/40'
                  }`}
                >
                  <p className="font-bold text-xs">{opt.label}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-amber-100">
                {scheduleType === 'WEEKS' ? 'Number of Weeks (2 - 10 Weeks)' :
                 scheduleType === 'DAILY' ? 'Number of Days (1 - 10 Days)' :
                 'Number of Legs / Cycles (1 - 10)'}
              </label>
              <span className="font-mono text-xs font-bold text-purple-400">
                {duration} {scheduleType === 'WEEKS' ? 'Weeks' : scheduleType === 'DAILY' ? 'Days' : 'Legs'}
              </span>
            </div>
            <input
              type="range"
              min={scheduleType === 'WEEKS' ? 2 : 1}
              max={10}
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-amber-500/40 font-mono mt-0.5">
              <span>{scheduleType === 'WEEKS' ? '2w' : '1d'}</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          {(scheduleType === 'WEEKS' || scheduleType === 'DAILY') && (
            <div>
              <label className="text-xs font-semibold text-amber-100 block mb-1.5">
                Matches Pairing Format per {scheduleType === 'WEEKS' ? 'Week' : 'Day'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMatchesStyle('FULL_CYCLE')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    matchesStyle === 'FULL_CYCLE'
                      ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                      : 'border-amber-900/30 border-dashed bg-[#050814]/60 text-amber-500/60'
                  }`}
                >
                  <p className="font-bold">⚡ Full Round Each {scheduleType === 'WEEKS' ? 'Week' : 'Day'}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">Every team plays every team each matchday</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMatchesStyle('DISTRIBUTED')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    matchesStyle === 'DISTRIBUTED'
                      ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                      : 'border-amber-900/30 border-dashed bg-[#050814]/60 text-amber-500/60'
                  }`}
                >
                  <p className="font-bold">📅 1 Match per Team</p>
                  <p className="text-[10px] opacity-70 mt-0.5">Fixtures spread evenly across days/weeks</p>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full mt-1 bg-[#050814] border border-amber-900/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60">First Match Kickoff Time</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full mt-1 bg-[#050814] border border-amber-900/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60">Match Gap Interval</label>
              <select
                value={intervalMins}
                onChange={e => setIntervalMins(Number(e.target.value))}
                className="w-full mt-1 bg-[#050814] border border-amber-900/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="0">Same time (parallel pitches)</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60">Default Venue</label>
              <input
                type="text"
                value={defaultVenue}
                onChange={e => setDefaultVenue(e.target.value)}
                placeholder="Pitch / Arena"
                className="w-full mt-1 bg-[#050814] border border-amber-900/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-amber-900/40 text-amber-500/60 hover:bg-[#050814] text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={teamCount < 2}
              className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-[#050814] disabled:text-gray-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Shuffle className="w-4 h-4" />
              Generate Fixtures
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Modal for Fixture Rescheduling (Date, Time, Venue, Teams) ── */
function EditMatchModal({ match, onClose, onSave, onDelete }) {
  const { state } = useTournament();
  const [form, setForm] = useState({
    round: match.round,
    roundLabel: match.roundLabel || `Round ${match.round}`,
    teamAId: match.teamAId,
    teamBId: match.teamBId,
    date: match.date || '',
    time: match.time || '',
    venue: match.venue || '',
    scoreA: match.scoreA !== null && match.scoreA !== undefined ? String(match.scoreA) : '',
    scoreB: match.scoreB !== null && match.scoreB !== undefined ? String(match.scoreB) : '',
    status: match.status || 'SCHEDULED',
  });

  function handleSubmit(e) {
    e.preventDefault();
    const scA = form.scoreA === '' ? null : parseInt(form.scoreA, 10);
    const scB = form.scoreB === '' ? null : parseInt(form.scoreB, 10);
    const finalStatus =
      scA !== null && scB !== null && !isNaN(scA) && !isNaN(scB)
        ? 'COMPLETED'
        : form.status;

    onSave({
      ...match,
      round: Number(form.round),
      roundLabel: form.roundLabel,
      teamAId: form.teamAId,
      teamBId: form.teamBId,
      date: form.date,
      time: form.time,
      venue: form.venue,
      scoreA: isNaN(scA) ? null : scA,
      scoreB: isNaN(scB) ? null : scB,
      status: finalStatus,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-[#050814]/85 backdrop-blur-md z-[160] flex items-center justify-center p-4">
      <div className="sketch-border bg-[#0b132b] rounded-2xl w-full max-w-md p-6 space-y-4 text-amber-50 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl text-amber-200 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-amber-400" />
            Edit Match Fixture Details
          </h3>
          <button onClick={onClose} className="text-amber-500/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60">Team A</label>
              <select
                value={form.teamAId}
                onChange={e => setForm({ ...form, teamAId: e.target.value })}
                className="w-full mt-1 bg-[#050814] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-white text-sm"
              >
                {state.teams.map(t => (
                  <option key={t.id} value={t.id} disabled={t.id === form.teamBId}>
                    {t.logo} {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60">Team B</label>
              <select
                value={form.teamBId}
                onChange={e => setForm({ ...form, teamBId: e.target.value })}
                className="w-full mt-1 bg-[#050814] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-white text-sm"
              >
                {state.teams.map(t => (
                  <option key={t.id} value={t.id} disabled={t.id === form.teamAId}>
                    {t.logo} {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60">Match Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full mt-1 bg-[#050814] border border-amber-900/40 rounded-lg px-3 py-1.5 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60">Kickoff Time</label>
              <input
                type="time"
                value={form.time}
                onChange={e => setForm({ ...form, time: e.target.value })}
                className="w-full mt-1 bg-[#050814] border border-amber-900/40 rounded-lg px-3 py-1.5 text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60">Venue / Pitch</label>
              <input
                type="text"
                value={form.venue}
                onChange={e => setForm({ ...form, venue: e.target.value })}
                placeholder="Pitch 1"
                className="w-full mt-1 bg-[#050814] border border-amber-900/40 rounded-lg px-3 py-1.5 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60">Round Label</label>
              <input
                type="text"
                value={form.roundLabel}
                onChange={e => setForm({ ...form, roundLabel: e.target.value })}
                placeholder="e.g. Week 1 or Day 1"
                className="w-full mt-1 bg-[#050814] border border-amber-900/40 rounded-lg px-3 py-1.5 text-white text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-amber-900/30 border-dashed">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Delete this match fixture?')) {
                  onDelete(match.id);
                  onClose();
                }
              }}
              className="text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1 p-1.5 rounded hover:bg-red-400/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Match
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg border border-amber-900/40 text-amber-100 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ADVANCED MATCH PERFORMANCE & SCORE SHEET MODAL
   - Score entry (Team A vs Team B)
   - Goal scorers & assists logger
   - GK saves & Auto Clean Sheet calculation
   - Player match ratings for MID, DEF, FWD, GK
   - Match MVP selection
   ───────────────────────────────────────────────────────────────────────── */
function MatchPerformanceModal({ match, onClose, onSave }) {
  const { state } = useTournament();
  const teamA = state.teams.find(t => t.id === match.teamAId);
  const teamB = state.teams.find(t => t.id === match.teamBId);

  const rosterA = useMemo(() =>
    state.players.filter(p => teamA && (teamA.rosterIds.includes(p.id) || p.teamId === teamA.id)),
    [state.players, teamA]
  );
  const rosterB = useMemo(() =>
    state.players.filter(p => teamB && (teamB.rosterIds.includes(p.id) || p.teamId === teamB.id)),
    [state.players, teamB]
  );

  const [scoreA, setScoreA] = useState(match.scoreA !== null && match.scoreA !== undefined ? String(match.scoreA) : '');
  const [scoreB, setScoreB] = useState(match.scoreB !== null && match.scoreB !== undefined ? String(match.scoreB) : '');
  const [status, setStatus] = useState(match.status || 'COMPLETED');
  const [activeTab, setActiveTab] = useState('GOALS'); // 'GOALS' | 'SQUADS' | 'GK'

  // Goal events: [{ id, teamId, scorerId, assistId, minute }]
  const [events, setEvents] = useState(match.events || []);

  // Performance map: { [playerId]: { playerId, teamId, rating, saves, cleanSheet, played } }
  const [perfMap, setPerfMap] = useState(() => {
    const map = {};
    const existing = match.playerPerformance || [];
    existing.forEach(p => {
      map[p.playerId] = { ...p };
    });

    // Pre-populate players from rosterA and rosterB if not existing
    rosterA.forEach(p => {
      if (!map[p.id]) {
        map[p.id] = { playerId: p.id, teamId: teamA?.id, rating: '', saves: 0, cleanSheet: false, played: true };
      }
    });
    rosterB.forEach(p => {
      if (!map[p.id]) {
        map[p.id] = { playerId: p.id, teamId: teamB?.id, rating: '', saves: 0, cleanSheet: false, played: true };
      }
    });

    return map;
  });

  const [mvpPlayerId, setMvpPlayerId] = useState(match.mvpPlayerId || '');

  // Auto clean sheet calculation
  const numScoreA = scoreA === '' ? 0 : parseInt(scoreA, 10);
  const numScoreB = scoreB === '' ? 0 : parseInt(scoreB, 10);
  const teamACleanSheet = !isNaN(numScoreB) && numScoreB === 0 && scoreA !== '';
  const teamBCleanSheet = !isNaN(numScoreA) && numScoreA === 0 && scoreB !== '';

  // Add a goal
  function handleAddGoal(teamId) {
    const newGoal = {
      id: generateId('ev'),
      type: 'GOAL',
      teamId: teamId || teamA?.id,
      scorerId: '',
      assistId: '',
      minute: '',
    };
    setEvents([...events, newGoal]);
  }

  function handleRemoveGoal(evId) {
    setEvents(events.filter(e => e.id !== evId));
  }

  function handleUpdateGoal(evId, field, val) {
    setEvents(events.map(e => e.id === evId ? { ...e, [field]: val } : e));
  }

  function updatePlayerPerf(playerId, updates) {
    setPerfMap(prev => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || { playerId, rating: '', saves: 0, cleanSheet: false, played: true }),
        ...updates,
      },
    }));
  }

  // Pre-generate goal slots matching current score
  function handleAutoFillGoalSlots() {
    const targetA = Math.max(0, parseInt(scoreA, 10) || 0);
    const targetB = Math.max(0, parseInt(scoreB, 10) || 0);
    const newEvs = [];

    for (let i = 0; i < targetA; i++) {
      newEvs.push({
        id: generateId('ev'),
        type: 'GOAL',
        teamId: teamA?.id,
        scorerId: rosterA[i % (rosterA.length || 1)]?.id || '',
        assistId: '',
        minute: '',
      });
    }
    for (let i = 0; i < targetB; i++) {
      newEvs.push({
        id: generateId('ev'),
        type: 'GOAL',
        teamId: teamB?.id,
        scorerId: rosterB[i % (rosterB.length || 1)]?.id || '',
        assistId: '',
        minute: '',
      });
    }
    setEvents(newEvs);
  }

  function handleSaveAll(e) {
    e.preventDefault();
    const finalScoreA = scoreA === '' ? null : parseInt(scoreA, 10);
    const finalScoreB = scoreB === '' ? null : parseInt(scoreB, 10);

    // Build finalized playerPerformance array with auto clean sheets applied for GKs
    const finalizedPerformance = Object.values(perfMap).map(perf => {
      const isTeamA = perf.teamId === teamA?.id;
      const isTeamB = perf.teamId === teamB?.id;
      const playerObj = state.players.find(p => p.id === perf.playerId);
      const isGK = playerObj?.position === 'GK';

      // Auto clean sheet applies if player is GK and opponent scored 0
      let autoCS = false;
      if (isGK && isTeamA && teamACleanSheet) autoCS = true;
      if (isGK && isTeamB && teamBCleanSheet) autoCS = true;

      return {
        ...perf,
        rating: perf.rating ? Number(perf.rating) : null,
        saves: perf.saves ? Number(perf.saves) : 0,
        cleanSheet: autoCS || Boolean(perf.cleanSheet),
      };
    });

    // Auto-detect highest rating for MVP if not set
    let chosenMvp = mvpPlayerId;
    if (!chosenMvp) {
      let topRating = 0;
      finalizedPerformance.forEach(p => {
        if (p.rating && p.rating > topRating) {
          topRating = p.rating;
          chosenMvp = p.playerId;
        }
      });
    }

    const updatedMatch = {
      ...match,
      scoreA: isNaN(finalScoreA) ? null : finalScoreA,
      scoreB: isNaN(finalScoreB) ? null : finalScoreB,
      status: (finalScoreA !== null && finalScoreB !== null) ? 'COMPLETED' : status,
      events,
      playerPerformance: finalizedPerformance,
      mvpPlayerId: chosenMvp || null,
    };

    onSave(updatedMatch);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-[#050814]/85 backdrop-blur-md z-[170] flex items-center justify-center p-3 sm:p-4">
      <div className="sketch-border bg-[#0b132b] rounded-2xl w-full max-w-2xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-amber-50">
        {/* Header */}
        <div className="px-5 py-4 border-b border-amber-900/30 border-dashed bg-[#0b132b]/95 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-serif text-xl text-amber-200 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Match Center & Performance Sheet
            </h3>
            <p className="text-xs text-amber-500/60 mt-0.5">
              Log score, goal scorers, assists, GK saves, clean sheets & player ratings.
            </p>
          </div>
          <button onClick={onClose} className="text-amber-500/60 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body (scrollable) */}
        <form onSubmit={handleSaveAll} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* ── 1. Match Scoreboard ── */}
          <div className="sketch-border bg-[#050814]/80 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3 text-center">
              {/* Team A */}
              <div className="flex-1 min-w-0">
                <span className="text-2xl block mb-1">{teamA?.logo || '🛡️'}</span>
                <p className="font-serif text-amber-100 text-sm sm:text-base truncate">{teamA?.name || 'Team A'}</p>
                {teamACleanSheet && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full mt-1">
                    <Shield className="w-2.5 h-2.5" /> Clean Sheet
                  </span>
                )}
              </div>

              {/* Score Inputs */}
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={scoreA}
                  onChange={e => setScoreA(e.target.value)}
                  placeholder="0"
                  className="w-14 sm:w-16 h-12 bg-[#050814] border-2 border-amber-600/50 focus:border-amber-400 rounded-xl text-center text-2xl font-black font-mono text-amber-200 focus:outline-none shadow-inner"
                  autoFocus
                />
                <span className="text-amber-500/40 font-bold text-lg">–</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={scoreB}
                  onChange={e => setScoreB(e.target.value)}
                  placeholder="0"
                  className="w-14 sm:w-16 h-12 bg-[#050814] border-2 border-amber-600/50 focus:border-amber-400 rounded-xl text-center text-2xl font-black font-mono text-amber-200 focus:outline-none shadow-inner"
                />
              </div>

              {/* Team B */}
              <div className="flex-1 min-w-0">
                <span className="text-2xl block mb-1">{teamB?.logo || '🛡️'}</span>
                <p className="font-serif text-amber-100 text-sm sm:text-base truncate">{teamB?.name || 'Team B'}</p>
                {teamBCleanSheet && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full mt-1">
                    <Shield className="w-2.5 h-2.5" /> Clean Sheet
                  </span>
                )}
              </div>
            </div>

            {/* Status and Match Details */}
            <div className="flex items-center justify-between border-t border-amber-900/30 border-dashed mt-4 pt-3 text-xs text-amber-500/60 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span>Match Status:</span>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="bg-[#050814] border border-amber-900/40 rounded-lg px-2 py-1 text-white text-xs"
                >
                  <option value="COMPLETED">Completed</option>
                  <option value="LIVE">Live 🔴</option>
                  <option value="SCHEDULED">Scheduled</option>
                </select>
              </div>

              <div className="flex items-center gap-3 font-mono">
                {match.date && <span>📅 {match.date}</span>}
                {match.time && <span>⏰ {match.time}</span>}
                {match.venue && <span>📍 {match.venue}</span>}
              </div>
            </div>
          </div>

          {/* ── Sub Navigation Tabs ── */}
          <div className="flex border-b border-amber-900/30 border-dashed gap-2">
            {[
              { id: 'GOALS', label: `⚽ Goals & Assists (${events.length})`, icon: Target },
              { id: 'GK', label: '🧤 GK Saves & Clean Sheet', icon: Shield },
              { id: 'SQUADS', label: '⭐ Squad Ratings (MID / DEF / FWD)', icon: Star },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-amber-500/60 hover:text-amber-100'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ── TAB 1: Goals & Assists ── */}
          {activeTab === 'GOALS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-500/60">
                  Record individual goals, scorers, assists, and minutes.
                </span>
                <div className="flex gap-2">
                  {(parseInt(scoreA, 10) > 0 || parseInt(scoreB, 10) > 0) && (
                    <button
                      type="button"
                      onClick={handleAutoFillGoalSlots}
                      className="text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-colors"
                      title="Generate slots matching current score"
                    >
                      ⚡ Auto-Fill Slots ({numScoreA + numScoreB})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddGoal(teamA?.id)}
                    className="text-xs bg-[#050814] hover:bg-[#0b132b] text-white px-2.5 py-1 rounded-lg border border-amber-900/40 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-emerald-400" /> Add Goal
                  </button>
                </div>
              </div>

              {events.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-amber-900/30 border-dashed rounded-xl text-amber-500/40 text-xs space-y-1">
                  <p>No goals logged yet for this match.</p>
                  <p className="text-[11px] text-gray-600">Click "+ Add Goal" or "Auto-Fill Slots" after entering score.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {events.map((ev, idx) => {
                    const isTeamA = ev.teamId === teamA?.id;
                    const availableRoster = isTeamA ? rosterA : rosterB;
                    return (
                      <div
                        key={ev.id || idx}
                        className="flex items-center gap-2 bg-[#050814]/60 border border-amber-900/40 rounded-xl p-2.5 flex-wrap sm:flex-nowrap"
                      >
                        {/* Goal number & icon */}
                        <span className="text-xs font-mono font-bold text-amber-500/40 w-5 text-center shrink-0">
                          #{idx + 1}
                        </span>

                        {/* Team selector */}
                        <select
                          value={ev.teamId}
                          onChange={e => handleUpdateGoal(ev.id, 'teamId', e.target.value)}
                          className="bg-[#0b132b] border border-amber-900/50 rounded-lg px-2 py-1 text-xs text-white shrink-0"
                        >
                          <option value={teamA?.id}>{teamA?.logo} {teamA?.name}</option>
                          <option value={teamB?.id}>{teamB?.logo} {teamB?.name}</option>
                        </select>

                        {/* Scorer selector */}
                        <div className="flex-1 min-w-[130px]">
                          <select
                            value={ev.scorerId || ''}
                            onChange={e => handleUpdateGoal(ev.id, 'scorerId', e.target.value)}
                            className="w-full bg-[#0b132b] border border-amber-900/50 rounded-lg px-2 py-1 text-xs text-emerald-300 font-semibold"
                          >
                            <option value="">⚽ Select Scorer</option>
                            {availableRoster.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.position})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Assist selector */}
                        <div className="flex-1 min-w-[130px]">
                          <select
                            value={ev.assistId || ''}
                            onChange={e => handleUpdateGoal(ev.id, 'assistId', e.target.value)}
                            className="w-full bg-[#0b132b] border border-amber-900/50 rounded-lg px-2 py-1 text-xs text-amber-300"
                          >
                            <option value="">⚡ Assist: None / Solo</option>
                            {availableRoster.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.position})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Minute input */}
                        <div className="w-16 shrink-0">
                          <input
                            type="text"
                            placeholder="Min '"
                            value={ev.minute || ''}
                            onChange={e => handleUpdateGoal(ev.id, 'minute', e.target.value)}
                            className="w-full bg-[#0b132b] border border-amber-900/50 rounded-lg px-2 py-1 text-xs text-white text-center font-mono"
                          />
                        </div>

                        {/* Delete goal */}
                        <button
                          type="button"
                          onClick={() => handleRemoveGoal(ev.id)}
                          className="text-amber-500/40 hover:text-red-400 p-1 rounded"
                          title="Remove goal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: Goalkeepers, Saves & Auto Clean Sheets ── */}
          {activeTab === 'GK' && (
            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-300 flex items-start gap-2">
                <Shield className="w-4 h-4 shrink-0 mt-0.5 text-yellow-400" />
                <div>
                  <p className="font-semibold">Automatic Clean Sheet Detection</p>
                  <p className="text-[11px] text-yellow-400/80 mt-0.5">
                    When the opponent scores 0 goals, the team's goalkeeper automatically earns a verified Clean Sheet for the match!
                  </p>
                </div>
              </div>

              {/* Team A Goalkeepers */}
              <div className="bg-[#050814]/40 border border-amber-900/40 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    {teamA?.logo} {teamA?.name} Goalkeeping
                  </span>
                  {teamACleanSheet ? (
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Auto Clean Sheet Active
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-500/40">Conceded {numScoreB} goals</span>
                  )}
                </div>

                <div className="space-y-2">
                  {rosterA.filter(p => p.position === 'GK' || (p.rawPositions && p.rawPositions.includes('GK'))).length === 0 ? (
                    <p className="text-xs text-amber-500/40 italic">No designated GK in squad roster. Any squad member can record saves in Squad tab.</p>
                  ) : (
                    rosterA.filter(p => p.position === 'GK' || (p.rawPositions && p.rawPositions.includes('GK'))).map(gk => (
                      <div key={gk.id} className="flex items-center justify-between bg-[#050814] rounded-lg p-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-1.5 py-0.5 rounded font-mono font-bold bg-yellow-500/20 text-yellow-300">GK</span>
                          <span className="text-sm font-semibold text-white">{gk.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <label className="text-xs text-amber-500/60">Saves Made:</label>
                            <input
                              type="number"
                              min="0"
                              value={perfMap[gk.id]?.saves ?? 0}
                              onChange={e => updatePlayerPerf(gk.id, { saves: e.target.value })}
                              className="w-16 bg-[#0b132b] border border-amber-900/50 rounded px-2 py-1 text-white text-center font-bold text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Team B Goalkeepers */}
              <div className="bg-[#050814]/40 border border-amber-900/40 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    {teamB?.logo} {teamB?.name} Goalkeeping
                  </span>
                  {teamBCleanSheet ? (
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Auto Clean Sheet Active
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-500/40">Conceded {numScoreA} goals</span>
                  )}
                </div>

                <div className="space-y-2">
                  {rosterB.filter(p => p.position === 'GK' || (p.rawPositions && p.rawPositions.includes('GK'))).length === 0 ? (
                    <p className="text-xs text-amber-500/40 italic">No designated GK in squad roster. Any squad member can record saves in Squad tab.</p>
                  ) : (
                    rosterB.filter(p => p.position === 'GK' || (p.rawPositions && p.rawPositions.includes('GK'))).map(gk => (
                      <div key={gk.id} className="flex items-center justify-between bg-[#050814] rounded-lg p-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-1.5 py-0.5 rounded font-mono font-bold bg-yellow-500/20 text-yellow-300">GK</span>
                          <span className="text-sm font-semibold text-white">{gk.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <label className="text-xs text-amber-500/60">Saves Made:</label>
                            <input
                              type="number"
                              min="0"
                              value={perfMap[gk.id]?.saves ?? 0}
                              onChange={e => updatePlayerPerf(gk.id, { saves: e.target.value })}
                              className="w-16 bg-[#0b132b] border border-amber-900/50 rounded px-2 py-1 text-white text-center font-bold text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: Squad Ratings (MID, DEF, FWD, GK) ── */}
          {activeTab === 'SQUADS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-500/60">
                  Rate each player's performance (1.0 - 10.0 scale) for MID, DEF, FWD & GK.
                </span>
                <span className="text-[11px] text-amber-400 font-mono">
                  Scale: 1.0 (Low) to 10.0 (Masterclass)
                </span>
              </div>

              {/* Team A Squad */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 border-b border-amber-900/30 border-dashed pb-1">
                  <span className="text-base">{teamA?.logo}</span>
                  <span className="font-bold text-white text-xs">{teamA?.name} Squad Ratings</span>
                </div>

                <div className="space-y-1.5">
                  {rosterA.length === 0 ? (
                    <p className="text-xs text-amber-500/40 py-2">No players assigned to {teamA?.name}.</p>
                  ) : (
                    rosterA.map(p => {
                      const perf = perfMap[p.id] || {};
                      const ratingVal = perf.rating ?? '';
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between bg-[#050814]/40 border border-amber-900/40/60 rounded-xl px-3 py-2 gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={perf.played !== false}
                              onChange={e => updatePlayerPerf(p.id, { played: e.target.checked })}
                              title="Played in this match"
                              className="rounded accent-emerald-500"
                            />
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${POS_BADGE[p.position] || POS_BADGE.FLEX}`}>
                              {p.position}
                            </span>
                            <span className="text-xs font-semibold text-white truncate">{p.name}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Quick rating shortcuts */}
                            <div className="hidden sm:flex items-center gap-1">
                              {['6.0', '7.0', '8.0', '9.0'].map(r => (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => updatePlayerPerf(p.id, { rating: r })}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-[#0b132b] hover:bg-gray-600 text-amber-100 font-mono"
                                >
                                  {r}
                                </button>
                              ))}
                            </div>

                            <input
                              type="number"
                              step="0.1"
                              min="1"
                              max="10"
                              placeholder="–"
                              value={ratingVal}
                              onChange={e => updatePlayerPerf(p.id, { rating: e.target.value })}
                              className={`w-14 text-center font-bold text-xs py-1 rounded border ${getRatingBadge(ratingVal)}`}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Team B Squad */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 border-b border-amber-900/30 border-dashed pb-1">
                  <span className="text-base">{teamB?.logo}</span>
                  <span className="font-bold text-white text-xs">{teamB?.name} Squad Ratings</span>
                </div>

                <div className="space-y-1.5">
                  {rosterB.length === 0 ? (
                    <p className="text-xs text-amber-500/40 py-2">No players assigned to {teamB?.name}.</p>
                  ) : (
                    rosterB.map(p => {
                      const perf = perfMap[p.id] || {};
                      const ratingVal = perf.rating ?? '';
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between bg-[#050814]/40 border border-amber-900/40/60 rounded-xl px-3 py-2 gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={perf.played !== false}
                              onChange={e => updatePlayerPerf(p.id, { played: e.target.checked })}
                              title="Played in this match"
                              className="rounded accent-emerald-500"
                            />
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${POS_BADGE[p.position] || POS_BADGE.FLEX}`}>
                              {p.position}
                            </span>
                            <span className="text-xs font-semibold text-white truncate">{p.name}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="hidden sm:flex items-center gap-1">
                              {['6.0', '7.0', '8.0', '9.0'].map(r => (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => updatePlayerPerf(p.id, { rating: r })}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-[#0b132b] hover:bg-gray-600 text-amber-100 font-mono"
                                >
                                  {r}
                                </button>
                              ))}
                            </div>

                            <input
                              type="number"
                              step="0.1"
                              min="1"
                              max="10"
                              placeholder="–"
                              value={ratingVal}
                              onChange={e => updatePlayerPerf(p.id, { rating: e.target.value })}
                              className={`w-14 text-center font-bold text-xs py-1 rounded border ${getRatingBadge(ratingVal)}`}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Match MVP Selector ── */}
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-300">Match MVP / Player of the Match</p>
                <p className="text-[10px] text-amber-500/60">Awarded to the most impactful player</p>
              </div>
            </div>

            <select
              value={mvpPlayerId}
              onChange={e => setMvpPlayerId(e.target.value)}
              className="bg-[#050814] border border-amber-500/40 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">⭐ Select Match MVP (Optional)</option>
              <optgroup label={`${teamA?.name || 'Team A'}`}>
                {rosterA.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.position}) {perfMap[p.id]?.rating ? `[${perfMap[p.id].rating}★]` : ''}
                  </option>
                ))}
              </optgroup>
              <optgroup label={`${teamB?.name || 'Team B'}`}>
                {rosterB.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.position}) {perfMap[p.id]?.rating ? `[${perfMap[p.id].rating}★]` : ''}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-900/30 border-dashed">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-amber-900/40 text-amber-100 text-xs hover:bg-[#050814] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all"
            >
              <Save className="w-4 h-4" /> Save Score & Performance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PUBLIC MATCH DETAILS / MATCH CENTER MODAL
   - Openable by anyone (Public, Captain, Player, Admin)
   - Shows goals, assists, GK saves, clean sheets & player ratings
   ───────────────────────────────────────────────────────────────────────── */
function MatchDetailsModal({ match, onClose }) {
  const { state } = useTournament();
  const teamA = state.teams.find(t => t.id === match.teamAId);
  const teamB = state.teams.find(t => t.id === match.teamBId);

  const rosterA = useMemo(() =>
    state.players.filter(p => teamA && (teamA.rosterIds.includes(p.id) || p.teamId === teamA.id)),
    [state.players, teamA]
  );
  const rosterB = useMemo(() =>
    state.players.filter(p => teamB && (teamB.rosterIds.includes(p.id) || p.teamId === teamB.id)),
    [state.players, teamB]
  );

  const mvp = state.players.find(p => p.id === match.mvpPlayerId);
  const events = match.events || [];
  const perfs = match.playerPerformance || [];

  return (
    <div className="fixed inset-0 bg-[#050814]/85 backdrop-blur-md z-[180] flex items-center justify-center p-3 sm:p-4">
      <div className="sketch-border bg-[#0b132b] rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-amber-50">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-amber-900/30 border-dashed flex items-center justify-between shrink-0 bg-[#050814]/70">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full">
              {match.roundLabel || `Round ${match.round}`}
            </span>
            <span className="text-xs text-amber-500/60">Match Center</span>
          </div>
          <button onClick={onClose} className="text-amber-500/60 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Big Score Header */}
          <div className="sketch-border bg-[#050814]/80 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-between">
              {/* Team A */}
              <div className="flex-1">
                <span className="text-3xl block mb-1">{teamA?.logo || '🛡️'}</span>
                <p className="font-serif text-amber-100 text-sm sm:text-base">{teamA?.name}</p>
              </div>

              {/* Score */}
              <div className="px-4">
                {match.status === 'COMPLETED' ? (
                  <div className="font-black text-3xl sm:text-4xl text-white font-mono tracking-tight">
                    {match.scoreA} <span className="text-gray-600">–</span> {match.scoreB}
                  </div>
                ) : match.status === 'LIVE' ? (
                  <div>
                    <span className="text-xs font-bold text-red-500 animate-pulse block">● LIVE</span>
                    <div className="font-black text-2xl text-white font-mono">
                      {match.scoreA ?? 0} – {match.scoreB ?? 0}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-amber-500/60 font-mono bg-[#050814] px-3 py-1 rounded-full">
                    Upcoming
                  </span>
                )}
              </div>

              {/* Team B */}
              <div className="flex-1">
                <span className="text-3xl block mb-1">{teamB?.logo || '🛡️'}</span>
                <p className="font-serif text-amber-100 text-sm sm:text-base">{teamB?.name}</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-amber-500/60 border-t border-amber-900/30 border-dashed/80 pt-2 font-mono">
              {match.date && <span>📅 {match.date}</span>}
              {match.time && <span>⏰ {match.time}</span>}
              {match.venue && <span>📍 {match.venue}</span>}
            </div>
          </div>

          {/* MVP Showcase */}
          {mvp && (
            <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent border border-amber-500/30 rounded-xl p-3 flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold block">
                  Player of the Match (MVP)
                </span>
                <p className="text-sm font-bold text-white truncate">{mvp.name}</p>
                <p className="text-xs text-amber-300/80">{mvp.position}</p>
              </div>
            </div>
          )}

          {/* Goal Scorers Timeline */}
          {events.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-amber-500/60 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" /> Goal Scorers & Assists
              </h4>
              <div className="bg-[#050814]/60 border border-amber-900/40/60 rounded-xl divide-y divide-amber-900/20">
                {events.map((ev, i) => {
                  const team = state.teams.find(t => t.id === ev.teamId);
                  const scorer = state.players.find(p => p.id === ev.scorerId);
                  const assist = state.players.find(p => p.id === ev.assistId);
                  return (
                    <div key={i} className="flex items-center justify-between px-3.5 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">⚽</span>
                        <span className="font-semibold text-white">{scorer?.name || 'Unassigned Scorer'}</span>
                        {assist && (
                          <span className="text-amber-500/60 text-[11px]">(assist: {assist.name})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500/60 font-mono text-[11px]">{team?.logo} {team?.name}</span>
                        {ev.minute && (
                          <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded text-[10px]">
                            {ev.minute}'
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Player Ratings & Lineups */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-amber-500/60 uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400" /> Squad Match Ratings
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Team A Roster & Ratings */}
              <div className="bg-[#050814]/40 border border-amber-900/40 rounded-xl p-3 space-y-2">
                <p className="font-bold text-xs text-white flex items-center gap-1.5 border-b border-amber-900/40/60 pb-1.5">
                  <span>{teamA?.logo}</span> {teamA?.name}
                </p>
                <div className="space-y-1">
                  {rosterA.map(p => {
                    const perf = perfs.find(pf => pf.playerId === p.id);
                    return (
                      <div key={p.id} className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${POS_BADGE[p.position] || POS_BADGE.FLEX}`}>
                            {p.position}
                          </span>
                          <span className="text-amber-50 truncate">{p.name}</span>
                          {perf?.cleanSheet && <Shield className="w-3 h-3 text-emerald-400 shrink-0" title="Clean Sheet" />}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {perf?.saves > 0 && (
                            <span className="text-[10px] text-yellow-400 font-mono bg-yellow-500/10 px-1 rounded">
                              {perf.saves} sv
                            </span>
                          )}
                          <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${getRatingBadge(perf?.rating)}`}>
                            {perf?.rating ? `${perf.rating}★` : '–'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Team B Roster & Ratings */}
              <div className="bg-[#050814]/40 border border-amber-900/40 rounded-xl p-3 space-y-2">
                <p className="font-bold text-xs text-white flex items-center gap-1.5 border-b border-amber-900/40/60 pb-1.5">
                  <span>{teamB?.logo}</span> {teamB?.name}
                </p>
                <div className="space-y-1">
                  {rosterB.map(p => {
                    const perf = perfs.find(pf => pf.playerId === p.id);
                    return (
                      <div key={p.id} className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${POS_BADGE[p.position] || POS_BADGE.FLEX}`}>
                            {p.position}
                          </span>
                          <span className="text-amber-50 truncate">{p.name}</span>
                          {perf?.cleanSheet && <Shield className="w-3 h-3 text-emerald-400 shrink-0" title="Clean Sheet" />}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {perf?.saves > 0 && (
                            <span className="text-[10px] text-yellow-400 font-mono bg-yellow-500/10 px-1 rounded">
                              {perf.saves} sv
                            </span>
                          )}
                          <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${getRatingBadge(perf?.rating)}`}>
                            {perf?.rating ? `${perf.rating}★` : '–'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Single Match Row ── */
function MatchRow({ match, editable, onOpenPerformance, onEditMatch, onOpenDetails }) {
  const { state } = useTournament();
  const teamA = state.teams.find(t => t.id === match.teamAId);
  const teamB = state.teams.find(t => t.id === match.teamBId);

  const isCompleted = match.status === 'COMPLETED';
  const aWon = isCompleted && match.scoreA > match.scoreB;
  const bWon = isCompleted && match.scoreB > match.scoreA;

  // Goals and clean sheets
  const events = match.events || [];
  const mvp = state.players.find(p => p.id === match.mvpPlayerId);

  // Group goals by team
  const goalsA = events.filter(e => e.teamId === match.teamAId);
  const goalsB = events.filter(e => e.teamId === match.teamBId);

  return (
    <div
      className={`flex flex-col gap-2 px-3.5 py-3 rounded-xl border transition-all ${
        isCompleted
          ? 'bg-[#0b132b]/50 border-amber-900/40/40 hover:border-amber-900/50'
          : match.status === 'LIVE'
          ? 'bg-red-950/20 border-red-500/40'
          : 'bg-[#050814]/60 border-amber-900/40 hover:border-amber-900/50'
      }`}
    >
      {/* Top Strip: Date, Time & Venue */}
      <div className="flex items-center justify-between text-xs text-amber-500/60 font-mono">
        <div className="flex items-center gap-3">
          {match.date && (
            <span className="flex items-center gap-1 text-amber-100">
              <Calendar className="w-3 h-3 text-purple-400" />
              {match.date}
            </span>
          )}
          {match.time && (
            <span className="flex items-center gap-1 text-amber-100">
              <Clock className="w-3 h-3 text-amber-400" />
              {match.time}
            </span>
          )}
          {match.venue && (
            <span className="hidden sm:flex items-center gap-1 text-amber-500/40 truncate max-w-[140px]">
              <MapPin className="w-3 h-3 text-emerald-400" />
              {match.venue}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {match.status === 'LIVE' && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white animate-pulse">
              LIVE
            </span>
          )}
          {mvp && (
            <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.2 rounded-full flex items-center gap-1">
              <Trophy className="w-2.5 h-2.5" /> MVP: {mvp.name}
            </span>
          )}
        </div>
      </div>

      {/* Main Teams and Score Bar */}
      <div className="flex items-center justify-between gap-3">
        {/* Team A */}
        <div className={`flex items-center gap-2 flex-1 min-w-0 ${aWon ? '' : isCompleted ? 'opacity-60' : ''}`}>
          <span className="text-xl shrink-0">{teamA?.logo || '🛡️'}</span>
          <span className={`text-sm font-semibold truncate ${aWon ? 'text-white' : 'text-amber-100'}`}>
            {teamA?.name ?? 'TBD'}
          </span>
        </div>

        {/* Score Display */}
        <div className="flex items-center gap-2 shrink-0 px-2">
          {isCompleted ? (
            <div className="flex items-center gap-2 font-mono bg-gray-900/80 px-3 py-1 rounded-xl border border-amber-900/40/80">
              <span className={`text-lg font-black ${aWon ? 'text-emerald-400' : 'text-amber-100'}`}>
                {match.scoreA}
              </span>
              <span className="text-gray-600 text-xs">–</span>
              <span className={`text-lg font-black ${bWon ? 'text-emerald-400' : 'text-amber-100'}`}>
                {match.scoreB}
              </span>
            </div>
          ) : (
            <span className="text-amber-500/60 text-xs font-mono px-2.5 py-1 rounded-lg bg-[#050814] border border-amber-900/40">
              vs
            </span>
          )}
        </div>

        {/* Team B */}
        <div className={`flex items-center gap-2 flex-1 min-w-0 justify-end ${bWon ? '' : isCompleted ? 'opacity-60' : ''}`}>
          <span className={`text-sm font-semibold truncate text-right ${bWon ? 'text-white' : 'text-amber-100'}`}>
            {teamB?.name ?? 'TBD'}
          </span>
          <span className="text-xl shrink-0">{teamB?.logo || '🛡️'}</span>
        </div>
      </div>

      {/* Goal Summary Pills (if any goals logged) */}
      {isCompleted && (goalsA.length > 0 || goalsB.length > 0) && (
        <div className="flex items-start justify-between text-[11px] text-amber-500/60 pt-1 border-t border-amber-900/30 border-dashed/60 gap-4">
          {/* Team A Goals */}
          <div className="flex-1 space-y-0.5">
            {goalsA.map((g, i) => {
              const p = state.players.find(x => x.id === g.scorerId);
              return (
                <p key={i} className="truncate text-amber-100">
                  ⚽ {p?.name || 'Goal'} {g.minute ? `${g.minute}'` : ''}
                </p>
              );
            })}
          </div>

          {/* Team B Goals */}
          <div className="flex-1 space-y-0.5 text-right">
            {goalsB.map((g, i) => {
              const p = state.players.find(x => x.id === g.scorerId);
              return (
                <p key={i} className="truncate text-amber-100">
                  {p?.name || 'Goal'} {g.minute ? `${g.minute}'` : ''} ⚽
                </p>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Actions Toolbar */}
      <div className="flex items-center justify-between pt-1 border-t border-amber-900/30 border-dashed/40">
        <button
          onClick={() => onOpenDetails(match)}
          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 hover:underline"
        >
          <Eye className="w-3.5 h-3.5" /> Match Details & Lineup Ratings
        </button>

        {editable && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPerformance(match)}
              className="text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
            >
              <Activity className="w-3 h-3" />
              <span>{isCompleted ? 'Edit Score & Stats' : 'Enter Score & Stats'}</span>
            </button>
            <button
              onClick={() => onEditMatch(match)}
              className="p-1 text-amber-500/40 hover:text-amber-400 rounded hover:bg-[#0b132b]/50 transition-colors"
              title="Reschedule match date, time, venue"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main MatchEngine Component ── */
export default function MatchEngine() {
  const {
    state,
    addMatch,
    updateMatch,
    deleteMatch,
    setMatches,
    updateRoundMatches,
    addAuditLog,
  } = useTournament();
  const { role, authenticatedId } = useAuth();
  const isAdmin = role === 'ADMIN';
  const currentPlayer = state.players.find(p => p.id === authenticatedId);
  const isOfficial = role === 'PLAYER' && Boolean(currentPlayer?.isOfficial);
  const canManageScores = isAdmin || isOfficial;

  const updaterInfo = isAdmin
    ? { id: 'admin', name: state.organizer?.hostName || 'Magistrate (Admin)', role: 'ADMIN' }
    : isOfficial
    ? { id: currentPlayer?.id || 'official', name: `${currentPlayer?.name || 'Player'} (Official Scribe)`, role: 'OFFICIAL' }
    : { id: 'unknown', name: 'Unknown', role: 'PUBLIC' };

  function handleSavePerformance(updatedMatch) {
    updateMatch(updatedMatch);
    const teamA = state.teams.find(t => t.id === updatedMatch.teamAId);
    const teamB = state.teams.find(t => t.id === updatedMatch.teamBId);
    const scoreStr = `${updatedMatch.scoreA ?? '-'} - ${updatedMatch.scoreB ?? '-'}`;
    const goalsCount = (updatedMatch.events || []).length;
    if (addAuditLog) {
      addAuditLog({
        id: generateId('audit'),
        timestamp: Date.now(),
        userId: updaterInfo.id,
        userName: updaterInfo.name,
        userRole: updaterInfo.role,
        matchId: updatedMatch.id,
        action: 'SCORED_MATCH',
        summary: `${teamA?.name || 'Team A'} ${scoreStr} ${teamB?.name || 'Team B'}`,
        details: `Updated match score to ${scoreStr} (${goalsCount} goal records, status: ${updatedMatch.status || 'COMPLETED'})`,
      });
    }
    setPerformanceMatch(null);
  }

  function handleSaveEditMatch(updatedMatch) {
    updateMatch(updatedMatch);
    const teamA = state.teams.find(t => t.id === updatedMatch.teamAId);
    const teamB = state.teams.find(t => t.id === updatedMatch.teamBId);
    if (addAuditLog) {
      addAuditLog({
        id: generateId('audit'),
        timestamp: Date.now(),
        userId: updaterInfo.id,
        userName: updaterInfo.name,
        userRole: updaterInfo.role,
        matchId: updatedMatch.id,
        action: 'EDITED_FIXTURE',
        summary: `${teamA?.name || 'Team A'} vs ${teamB?.name || 'Team B'}`,
        details: `Rescheduled fixture: ${updatedMatch.date || 'TBD'} at ${updatedMatch.time || 'TBD'} (${updatedMatch.venue || 'No venue'})`,
      });
    }
    setEditingMatch(null);
  }

  const [showGenModal, setShowGenModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [performanceMatch, setPerformanceMatch] = useState(null);
  const [viewDetailsMatch, setViewDetailsMatch] = useState(null);

  const [openRound, setOpenRound] = useState(1);
  const [editingRoundNum, setEditingRoundNum] = useState(null);
  const [roundDateInput, setRoundDateInput] = useState('');
  const [roundLabelInput, setRoundLabelInput] = useState('');

  /* Group matches by round */
  const byRound = useMemo(() => {
    const map = {};
    state.matches
      .filter(m => m.stage === 'LEAGUE')
      .forEach(m => {
        const r = m.round || 1;
        if (!map[r]) map[r] = [];
        map[r].push(m);
      });
    return map;
  }, [state.matches]);

  const leagueRounds = Object.keys(byRound).map(Number).sort((a, b) => a - b);

  /* Handler: Dynamic schedule generation */
  function handleGenerateFixtures(config) {
    const { scheduleType, duration, matchesStyle, startDate, startTime, intervalMins, defaultVenue } = config;

    const teamIds = state.teams.map(t => t.id);
    if (teamIds.length < 2) return;

    const baseRoundRobin = generateRoundRobinPairings(teamIds);
    const newMatches = [];
    const baseDate = new Date(startDate);

    if (scheduleType === 'WEEKS') {
      for (let week = 1; week <= duration; week++) {
        const weekDateObj = new Date(baseDate);
        weekDateObj.setDate(baseDate.getDate() + (week - 1) * 7);
        const weekDateStr = weekDateObj.toISOString().split('T')[0];

        let weekPairings = [];
        if (matchesStyle === 'FULL_CYCLE') {
          baseRoundRobin.forEach(cyclePairs => {
            weekPairings.push(...cyclePairs);
          });
        } else {
          const pairSet = baseRoundRobin[(week - 1) % baseRoundRobin.length];
          weekPairings.push(...pairSet);
        }

        weekPairings.forEach((pair, matchIdx) => {
          let matchTimeStr = startTime;
          if (intervalMins > 0) {
            const [hh, mm] = startTime.split(':').map(Number);
            const totalMins = hh * 60 + mm + matchIdx * intervalMins;
            const matchH = Math.floor(totalMins / 60) % 24;
            const matchM = totalMins % 60;
            matchTimeStr = `${String(matchH).padStart(2, '0')}:${String(matchM).padStart(2, '0')}`;
          }

          newMatches.push({
            id: generateId('m'),
            stage: 'LEAGUE',
            round: week,
            roundLabel: `Week ${week}`,
            date: weekDateStr,
            time: matchTimeStr,
            venue: defaultVenue,
            teamAId: pair.teamAId,
            teamBId: pair.teamBId,
            scoreA: null,
            scoreB: null,
            status: 'SCHEDULED',
            events: [],
            playerPerformance: [],
            mvpPlayerId: null,
          });
        });
      }
    } else if (scheduleType === 'DAILY') {
      for (let day = 1; day <= duration; day++) {
        const dayDateObj = new Date(baseDate);
        dayDateObj.setDate(baseDate.getDate() + (day - 1));
        const dayDateStr = dayDateObj.toISOString().split('T')[0];

        let dayPairings = [];
        if (matchesStyle === 'FULL_CYCLE') {
          baseRoundRobin.forEach(cyclePairs => {
            dayPairings.push(...cyclePairs);
          });
        } else {
          const pairSet = baseRoundRobin[(day - 1) % baseRoundRobin.length];
          dayPairings.push(...pairSet);
        }

        dayPairings.forEach((pair, matchIdx) => {
          let matchTimeStr = startTime;
          if (intervalMins > 0) {
            const [hh, mm] = startTime.split(':').map(Number);
            const totalMins = hh * 60 + mm + matchIdx * intervalMins;
            const matchH = Math.floor(totalMins / 60) % 24;
            const matchM = totalMins % 60;
            matchTimeStr = `${String(matchH).padStart(2, '0')}:${String(matchM).padStart(2, '0')}`;
          }

          newMatches.push({
            id: generateId('m'),
            stage: 'LEAGUE',
            round: day,
            roundLabel: `Day ${day}`,
            date: dayDateStr,
            time: matchTimeStr,
            venue: defaultVenue,
            teamAId: pair.teamAId,
            teamBId: pair.teamBId,
            scoreA: null,
            scoreB: null,
            status: 'SCHEDULED',
            events: [],
            playerPerformance: [],
            mvpPlayerId: null,
          });
        });
      }
    } else {
      for (let leg = 1; leg <= duration; leg++) {
        baseRoundRobin.forEach((roundPairs, rIdx) => {
          const rNum = (leg - 1) * baseRoundRobin.length + rIdx + 1;
          const rDateObj = new Date(baseDate);
          rDateObj.setDate(baseDate.getDate() + (rNum - 1) * 3);
          const rDateStr = rDateObj.toISOString().split('T')[0];

          roundPairs.forEach((pair) => {
            newMatches.push({
              id: generateId('m'),
              stage: 'LEAGUE',
              round: rNum,
              roundLabel: `Round ${rNum}`,
              date: rDateStr,
              time: startTime,
              venue: defaultVenue,
              teamAId: leg % 2 === 0 ? pair.teamBId : pair.teamAId,
              teamBId: leg % 2 === 0 ? pair.teamAId : pair.teamBId,
              scoreA: null,
              scoreB: null,
              status: 'SCHEDULED',
              events: [],
              playerPerformance: [],
              mvpPlayerId: null,
            });
          });
        });
      }
    }

    const nonLeague = state.matches.filter(m => m.stage !== 'LEAGUE');
    setMatches([...nonLeague, ...newMatches]);
    setOpenRound(1);
  }

  function handleAddMatchToRound(roundNumber) {
    if (state.teams.length < 2) return;
    const existingInRound = byRound[roundNumber] || [];
    const firstMatch = existingInRound[0];

    const newM = {
      id: generateId('m'),
      stage: 'LEAGUE',
      round: roundNumber,
      roundLabel: firstMatch?.roundLabel || `Round ${roundNumber}`,
      date: firstMatch?.date || new Date().toISOString().split('T')[0],
      time: firstMatch?.time || '18:00',
      venue: firstMatch?.venue || 'Pitch 1',
      teamAId: state.teams[0].id,
      teamBId: state.teams[1].id,
      scoreA: null,
      scoreB: null,
      status: 'SCHEDULED',
      events: [],
      playerPerformance: [],
      mvpPlayerId: null,
    };
    addMatch(newM);
  }

  function handleSaveRoundMeta(roundNumber) {
    const updates = {};
    if (roundDateInput) updates.date = roundDateInput;
    if (roundLabelInput) updates.roundLabel = roundLabelInput;
    if (Object.keys(updates).length > 0) {
      updateRoundMatches(roundNumber, updates);
    }
    setEditingRoundNum(null);
    setRoundDateInput('');
    setRoundLabelInput('');
  }

  const totalCompleted = state.matches.filter(m => m.stage === 'LEAGUE' && m.status === 'COMPLETED').length;
  const totalMatches = state.matches.filter(m => m.stage === 'LEAGUE').length;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-serif text-amber-200 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            League Fixtures & Schedule
          </h2>
          <p className="text-xs text-amber-500/60 mt-0.5">
            {leagueRounds.length > 0
              ? `${leagueRounds.length} rounds / matchdays scheduled • ${totalCompleted}/${totalMatches} matches completed`
              : 'Generate automated multi-week or daily schedules'}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            {leagueRounds.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Reset all league matches and regenerate a new schedule?')) {
                    setShowGenModal(true);
                  }
                }}
                className="flex items-center gap-1.5 bg-[#050814] hover:bg-[#0b132b] text-amber-100 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold border border-amber-900/40 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reschedule
              </button>
            )}
            <button
              onClick={() => setShowGenModal(true)}
              disabled={state.teams.length < 2}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-[#050814] disabled:text-gray-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-lg shadow-purple-900/20"
            >
              <Shuffle className="w-4 h-4" />
              {leagueRounds.length === 0 ? 'Generate Fixtures' : 'Schedule Generator'}
            </button>
          </div>
        )}
      </div>

      {leagueRounds.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-amber-900/30 border-dashed bg-gray-900/40 rounded-2xl text-amber-500/40 p-6 space-y-3">
          <Calendar className="w-12 h-12 mx-auto text-purple-500/40" />
          <div>
            <p className="font-serif text-xl text-amber-200">No League Fixtures Scheduled</p>
            <p className="text-xs text-amber-500/60 mt-1 max-w-sm mx-auto">
              Configure weekly leagues (2 to 10 weeks), daily fixtures (each team plays everyday), or custom round-robin legs.
            </p>
          </div>
          {isAdmin ? (
            <button
              onClick={() => setShowGenModal(true)}
              disabled={state.teams.length < 2}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-[#050814] disabled:text-gray-600 text-white text-sm font-semibold transition-colors"
            >
              <Shuffle className="w-4 h-4" /> Open Fixture Generator
            </button>
          ) : (
            <p className="text-xs text-amber-400">Waiting for Admin to generate the match schedule.</p>
          )}
          {state.teams.length < 2 && (
            <p className="text-xs text-amber-500/80">⚠ Please add at least 2 teams before generating fixtures.</p>
          )}
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-amber-500/60">
              <span>{totalCompleted} of {totalMatches} matches completed</span>
              <span className="font-mono font-bold text-emerald-400">
                {Math.round((totalCompleted / (totalMatches || 1)) * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-[#050814] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${(totalCompleted / (totalMatches || 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Rounds list */}
          <div className="space-y-3">
            {leagueRounds.map(round => {
              const matches = byRound[round] ?? [];
              const doneCount = matches.filter(m => m.status === 'COMPLETED').length;
              const isOpen = openRound === round;
              const firstMatch = matches[0];
              const roundLabel = firstMatch?.roundLabel || `Round ${round}`;
              const roundDate = firstMatch?.date;

              return (
                <div key={round} className="sketch-border bg-[#0b132b]/60 rounded-2xl overflow-hidden shadow-lg">
                  {/* Round Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-[#050814]/60">
                    <button
                      onClick={() => setOpenRound(isOpen ? null : round)}
                      className="flex items-center gap-3 text-left flex-1 min-w-0"
                    >
                      <span className="font-serif text-amber-100 text-sm truncate">
                        {roundLabel}
                      </span>
                      {roundDate && (
                        <span className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" />
                          {roundDate}
                        </span>
                      )}
                      <span className="text-xs text-amber-500/40">
                        ({matches.length} {matches.length === 1 ? 'match' : 'matches'})
                      </span>
                      {doneCount === matches.length && matches.length > 0 ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="text-[11px] text-amber-500/40 font-mono">
                          {doneCount}/{matches.length}
                        </span>
                      )}
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setEditingRoundNum(round);
                              setRoundLabelInput(roundLabel);
                              setRoundDateInput(roundDate || '');
                            }}
                            className="text-xs text-amber-500/60 hover:text-white px-2 py-1 rounded hover:bg-[#0b132b]/60 transition-colors flex items-center gap-1"
                            title="Edit date and title for this entire round"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span className="hidden sm:inline">Edit Round</span>
                          </button>
                          <button
                            onClick={() => handleAddMatchToRound(round)}
                            className="text-xs text-purple-400 hover:text-purple-300 px-2 py-1 rounded hover:bg-purple-500/10 transition-colors flex items-center gap-1"
                            title="Add extra match to this round"
                          >
                            <Plus className="w-3 h-3" />
                            <span className="hidden sm:inline">Add Match</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setOpenRound(isOpen ? null : round)}
                        className="p-1 text-amber-500/60 hover:text-white"
                      >
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Inline Round Meta Editor */}
                  {editingRoundNum === round && (
                    <div className="p-3.5 bg-[#050814]/90 border-b border-amber-900/40 space-y-3">
                      <p className="text-xs font-semibold text-amber-100">
                        Update Round / Day Schedule Info
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] text-amber-500/60">Round Title</label>
                          <input
                            type="text"
                            value={roundLabelInput}
                            onChange={e => setRoundLabelInput(e.target.value)}
                            placeholder="e.g. Week 1 - Opening Matches"
                            className="w-full mt-0.5 bg-[#0b132b] border border-amber-900/50 rounded-lg px-2.5 py-1 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-amber-500/60">Date (Applies to all matches in round)</label>
                          <input
                            type="date"
                            value={roundDateInput}
                            onChange={e => setRoundDateInput(e.target.value)}
                            className="w-full mt-0.5 bg-[#0b132b] border border-amber-900/50 rounded-lg px-2.5 py-1 text-white text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingRoundNum(null)}
                          className="px-2.5 py-1 text-xs text-amber-500/60 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveRoundMeta(round)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg"
                        >
                          Apply to Round
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Matches inside the round */}
                  {isOpen && (
                    <div className="p-3 space-y-2">
                      {matches.map(m => (
                        <MatchRow
                          key={m.id}
                          match={m}
                          editable={canManageScores}
                          onOpenPerformance={setPerformanceMatch}
                          onEditMatch={setEditingMatch}
                          onOpenDetails={setViewDetailsMatch}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Generator Modal */}
      {showGenModal && (
        <FixtureGeneratorModal
          onClose={() => setShowGenModal(false)}
          onGenerate={handleGenerateFixtures}
          teamCount={state.teams.length}
        />
      )}

      {/* Reschedule Match Details Modal */}
      {editingMatch && (
        <EditMatchModal
          match={editingMatch}
          onClose={() => setEditingMatch(null)}
          onSave={handleSaveEditMatch}
          onDelete={deleteMatch}
        />
      )}

      {/* Score & Performance Sheet Modal (Admin / Official Scribe) */}
      {performanceMatch && (
        <MatchPerformanceModal
          match={performanceMatch}
          onClose={() => setPerformanceMatch(null)}
          onSave={handleSavePerformance}
        />
      )}

      {/* Public Match Center Details Modal */}
      {viewDetailsMatch && (
        <MatchDetailsModal
          match={viewDetailsMatch}
          onClose={() => setViewDetailsMatch(null)}
        />
      )}
    </div>
  );
}
