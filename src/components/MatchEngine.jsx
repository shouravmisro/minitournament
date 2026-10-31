import React, { useState, useMemo } from 'react';
import { useTournament, generateId } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import {
  Calendar, Play, CheckCircle, Edit3, Save, X, Shuffle,
  AlertCircle, RefreshCw, ChevronDown, ChevronUp, Clock, Plus,
  Trash2, MapPin, Settings2
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

/* ── Modal for Generating Dynamic League Fixtures ── */
function FixtureGeneratorModal({ onClose, onGenerate, teamCount }) {
  const [scheduleType, setScheduleType] = useState('WEEKS'); // 'WEEKS' | 'DAILY' | 'ROUNDS'
  const [duration, setDuration] = useState(scheduleType === 'WEEKS' ? 4 : scheduleType === 'DAILY' ? 3 : 1);
  const [matchesStyle, setMatchesStyle] = useState('FULL_CYCLE'); // 'FULL_CYCLE' (play all each week/day) | 'DISTRIBUTED'
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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-purple-400" />
            Generate Dynamic League Schedule
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Schedule Cadence */}
          <div>
            <label className="text-sm font-semibold text-gray-300 block mb-1.5">
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
                      : 'border-gray-800 bg-gray-800/50 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <p className="font-bold text-xs">{opt.label}</p>
                  <p className="text-[11px] opacity-75 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Duration Slider (2 - 10 Weeks or 1 - 10 Days) */}
          <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                {scheduleType === 'WEEKS'
                  ? 'Duration in Weeks (2 - 10 Weeks)'
                  : scheduleType === 'DAILY'
                  ? 'Duration in Days (1 - 10 Days)'
                  : 'Number of Full Rounds / Legs (1 - 10)'}
              </label>
              <span className="font-mono font-bold text-purple-400 text-base bg-purple-500/10 px-2.5 py-0.5 rounded-lg border border-purple-500/30">
                {duration} {scheduleType === 'WEEKS' ? (duration === 1 ? 'Week' : 'Weeks') : scheduleType === 'DAILY' ? (duration === 1 ? 'Day' : 'Days') : 'Rounds'}
              </span>
            </div>
            <input
              type="range"
              min={scheduleType === 'WEEKS' ? 2 : 1}
              max="10"
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-gray-500 font-mono">
              <span>{scheduleType === 'WEEKS' ? '2 Weeks' : '1 Day'}</span>
              <span>5</span>
              <span>10 {scheduleType === 'WEEKS' ? 'Weeks' : 'Days'}</span>
            </div>
          </div>

          {/* Mode per day/week */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
              Match Pairing Style
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setMatchesStyle('FULL_CYCLE')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  matchesStyle === 'FULL_CYCLE'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                    : 'border-gray-800 bg-gray-800/40 text-gray-400 hover:border-gray-700'
                }`}
              >
                <span className="font-bold block">Every team plays every team</span>
                <span className="opacity-75 text-[11px]">Each week/day has a full round-robin</span>
              </button>
              <button
                type="button"
                onClick={() => setMatchesStyle('DISTRIBUTED')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  matchesStyle === 'DISTRIBUTED'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                    : 'border-gray-800 bg-gray-800/40 text-gray-400 hover:border-gray-700'
                }`}
              >
                <span className="font-bold block">1 Round-Robin spread</span>
                <span className="opacity-75 text-[11px]">Matches divided evenly across weeks</span>
              </button>
            </div>
          </div>

          {/* Start Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400">First Match Time</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          </div>

          {/* Match Gap & Default Venue */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400">Gap Between Matches</label>
              <select
                value={intervalMins}
                onChange={e => setIntervalMins(Number(e.target.value))}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="0">Same time (parallel pitches)</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400">Default Venue</label>
              <input
                type="text"
                value={defaultVenue}
                onChange={e => setDefaultVenue(e.target.value)}
                placeholder="Pitch / Arena"
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:bg-gray-800 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={teamCount < 2}
              className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
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

/* ── Modal for Editing a Single Match (Date, Time, Venue, Teams, Scores) ── */
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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[160] flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-amber-400" />
            Edit Match Details
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Teams Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400">Team A</label>
              <select
                value={form.teamAId}
                onChange={e => setForm({ ...form, teamAId: e.target.value })}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white text-sm"
              >
                {state.teams.map(t => (
                  <option key={t.id} value={t.id} disabled={t.id === form.teamBId}>
                    {t.logo} {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400">Team B</label>
              <select
                value={form.teamBId}
                onChange={e => setForm({ ...form, teamBId: e.target.value })}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white text-sm"
              >
                {state.teams.map(t => (
                  <option key={t.id} value={t.id} disabled={t.id === form.teamAId}>
                    {t.logo} {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400">Match Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400">Kickoff Time</label>
              <input
                type="time"
                value={form.time}
                onChange={e => setForm({ ...form, time: e.target.value })}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm"
              />
            </div>
          </div>

          {/* Venue & Round Label */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400">Venue / Pitch</label>
              <input
                type="text"
                value={form.venue}
                onChange={e => setForm({ ...form, venue: e.target.value })}
                placeholder="Pitch 1"
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400">Round Label</label>
              <input
                type="text"
                value={form.roundLabel}
                onChange={e => setForm({ ...form, roundLabel: e.target.value })}
                placeholder="e.g. Week 1 or Day 1"
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm"
              />
            </div>
          </div>

          {/* Scores & Status */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-semibold text-gray-400">Score A</label>
              <input
                type="number"
                min="0"
                value={form.scoreA}
                onChange={e => setForm({ ...form, scoreA: e.target.value })}
                placeholder="–"
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-center text-sm font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400">Score B</label>
              <input
                type="number"
                min="0"
                value={form.scoreB}
                onChange={e => setForm({ ...form, scoreB: e.target.value })}
                placeholder="–"
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-center text-sm font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400">Status</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs"
              >
                <option value="SCHEDULED">Scheduled</option>
                <option value="LIVE">Live 🔴</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-800">
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
                className="px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Single Match Row ── */
function MatchRow({ match, editable, onSaveScore, onEditMatch }) {
  const { state } = useTournament();
  const teamA = state.teams.find(t => t.id === match.teamAId);
  const teamB = state.teams.find(t => t.id === match.teamBId);

  const [quickScore, setQuickScore] = useState(false);
  const [sA, setSA] = useState(String(match.scoreA ?? ''));
  const [sB, setSB] = useState(String(match.scoreB ?? ''));

  function handleSaveQuick() {
    const scoreA = parseInt(sA, 10);
    const scoreB = parseInt(sB, 10);
    if (isNaN(scoreA) || isNaN(scoreB)) return;
    onSaveScore({ ...match, scoreA, scoreB, status: 'COMPLETED' });
    setQuickScore(false);
  }

  const isCompleted = match.status === 'COMPLETED';
  const aWon = isCompleted && match.scoreA > match.scoreB;
  const bWon = isCompleted && match.scoreB > match.scoreA;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-3 rounded-xl border transition-colors ${
        isCompleted
          ? 'bg-gray-800/30 border-gray-700/40'
          : match.status === 'LIVE'
          ? 'bg-red-950/20 border-red-500/40'
          : 'bg-gray-800/60 border-gray-700'
      }`}
    >
      {/* Date, Time & Venue strip */}
      <div className="flex items-center gap-3 text-xs text-gray-400 font-mono shrink-0">
        {match.date && (
          <span className="flex items-center gap-1 text-gray-300">
            <Calendar className="w-3 h-3 text-purple-400" />
            {match.date}
          </span>
        )}
        {match.time && (
          <span className="flex items-center gap-1 text-gray-300">
            <Clock className="w-3 h-3 text-amber-400" />
            {match.time}
          </span>
        )}
        {match.venue && (
          <span className="hidden md:flex items-center gap-1 text-gray-500 truncate max-w-[120px]">
            <MapPin className="w-3 h-3 text-emerald-400" />
            {match.venue}
          </span>
        )}
        {match.status === 'LIVE' && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white animate-pulse">
            LIVE
          </span>
        )}
      </div>

      {/* Teams and Score */}
      <div className="flex items-center gap-3 flex-1 min-w-0 justify-between sm:justify-center">
        {/* Team A */}
        <div className={`flex items-center gap-1.5 flex-1 min-w-0 ${aWon ? '' : isCompleted ? 'opacity-50' : ''}`}>
          <span className="text-base shrink-0">{teamA?.logo || '🛡️'}</span>
          <span className={`text-sm font-semibold truncate ${aWon ? 'text-white' : 'text-gray-300'}`}>
            {teamA?.name ?? 'TBD'}
          </span>
        </div>

        {/* Score Display / Quick Input */}
        <div className="flex items-center gap-1.5 shrink-0 px-2">
          {quickScore ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="99"
                value={sA}
                onChange={e => setSA(e.target.value)}
                className="w-10 bg-gray-700 border border-gray-500 rounded text-white text-center font-bold py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                autoFocus
              />
              <span className="text-gray-500 text-xs">–</span>
              <input
                type="number"
                min="0"
                max="99"
                value={sB}
                onChange={e => setSB(e.target.value)}
                className="w-10 bg-gray-700 border border-gray-500 rounded text-white text-center font-bold py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                onClick={handleSaveQuick}
                className="bg-emerald-600 hover:bg-emerald-500 text-white p-1 rounded ml-1"
                title="Save score"
              >
                <Save className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setQuickScore(false)}
                className="text-gray-400 hover:text-white p-1 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : isCompleted ? (
            <div className="flex items-center gap-1.5 font-mono">
              <span className={`text-base font-black ${aWon ? 'text-white' : 'text-gray-400'}`}>
                {match.scoreA}
              </span>
              <span className="text-gray-600 text-xs">–</span>
              <span className={`text-base font-black ${bWon ? 'text-white' : 'text-gray-400'}`}>
                {match.scoreB}
              </span>
            </div>
          ) : (
            <span className="text-gray-500 text-xs font-mono px-2 py-0.5 rounded bg-gray-800">vs</span>
          )}
        </div>

        {/* Team B */}
        <div className={`flex items-center gap-1.5 flex-1 min-w-0 justify-end ${bWon ? '' : isCompleted ? 'opacity-50' : ''}`}>
          <span className={`text-sm font-semibold truncate text-right ${bWon ? 'text-white' : 'text-gray-300'}`}>
            {teamB?.name ?? 'TBD'}
          </span>
          <span className="text-base shrink-0">{teamB?.logo || '🛡️'}</span>
        </div>
      </div>

      {/* Admin actions */}
      {editable && (
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
          {!quickScore && (
            <button
              onClick={() => {
                setSA(match.scoreA !== null && match.scoreA !== undefined ? String(match.scoreA) : '');
                setSB(match.scoreB !== null && match.scoreB !== undefined ? String(match.scoreB) : '');
                setQuickScore(true);
              }}
              className="text-xs bg-gray-700/60 hover:bg-gray-700 text-gray-300 hover:text-white px-2 py-1 rounded transition-colors"
              title="Quick score enter"
            >
              {isCompleted ? 'Edit Score' : 'Enter Score'}
            </button>
          )}
          <button
            onClick={() => onEditMatch(match)}
            className="p-1 text-gray-500 hover:text-amber-400 rounded hover:bg-gray-700/50 transition-colors"
            title="Edit all match details (date, time, venue, teams)"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      )}
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
  } = useTournament();
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  const [showGenModal, setShowGenModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
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
    let roundIndex = 1;

    // Calculate start date timestamp
    const baseDate = new Date(startDate);

    if (scheduleType === 'WEEKS') {
      // 2 - 10 Weeks
      for (let week = 1; week <= duration; week++) {
        // Date for this week (advance 7 days each week)
        const weekDateObj = new Date(baseDate);
        weekDateObj.setDate(baseDate.getDate() + (week - 1) * 7);
        const weekDateStr = weekDateObj.toISOString().split('T')[0];

        // Determine matches in this week
        let weekPairings = [];
        if (matchesStyle === 'FULL_CYCLE') {
          // In each week, teams play every other team (all rounds of round-robin)
          baseRoundRobin.forEach(cyclePairs => {
            weekPairings.push(...cyclePairs);
          });
        } else {
          // Distributed: pick the corresponding cycle round
          const pairSet = baseRoundRobin[(week - 1) % baseRoundRobin.length];
          weekPairings.push(...pairSet);
        }

        // Generate match rows for this week
        weekPairings.forEach((pair, matchIdx) => {
          // Compute kickoff time with interval
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
          });
        });
      }
    } else if (scheduleType === 'DAILY') {
      // 1 - 10 Days
      for (let day = 1; day <= duration; day++) {
        const dayDateObj = new Date(baseDate);
        dayDateObj.setDate(baseDate.getDate() + (day - 1));
        const dayDateStr = dayDateObj.toISOString().split('T')[0];

        // Each day each team may play with each team everyday!
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
          });
        });
      }
    } else {
      // Classic rounds / legs
      for (let leg = 1; leg <= duration; leg++) {
        baseRoundRobin.forEach((roundPairs, rIdx) => {
          const rNum = (leg - 1) * baseRoundRobin.length + rIdx + 1;
          const rDateObj = new Date(baseDate);
          rDateObj.setDate(baseDate.getDate() + (rNum - 1) * 3); // spaced by 3 days
          const rDateStr = rDateObj.toISOString().split('T')[0];

          roundPairs.forEach((pair, matchIdx) => {
            newMatches.push({
              id: generateId('m'),
              stage: 'LEAGUE',
              round: rNum,
              roundLabel: `Round ${rNum}`,
              date: rDateStr,
              time: startTime,
              venue: defaultVenue,
              teamAId: leg % 2 === 0 ? pair.teamBId : pair.teamAId, // alternate home/away
              teamBId: leg % 2 === 0 ? pair.teamAId : pair.teamBId,
              scoreA: null,
              scoreB: null,
              status: 'SCHEDULED',
            });
          });
        });
      }
    }

    // Keep any non-league matches (e.g. Knockout) and replace league
    const nonLeague = state.matches.filter(m => m.stage !== 'LEAGUE');
    setMatches([...nonLeague, ...newMatches]);
    setOpenRound(1);
  }

  /* Add a custom match to an existing round */
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
    };
    addMatch(newM);
  }

  /* Bulk update round date or label */
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
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            League Fixtures & Schedule
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
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
                className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reschedule
              </button>
            )}
            <button
              onClick={() => setShowGenModal(true)}
              disabled={state.teams.length < 2}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-lg shadow-purple-900/20"
            >
              <Shuffle className="w-4 h-4" />
              {leagueRounds.length === 0 ? 'Generate Fixtures' : 'Schedule Generator'}
            </button>
          </div>
        )}
      </div>

      {leagueRounds.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-gray-800 bg-gray-900/40 rounded-2xl text-gray-500 p-6 space-y-3">
          <Calendar className="w-12 h-12 mx-auto text-purple-500/40" />
          <div>
            <p className="font-bold text-white text-base">No League Fixtures Scheduled</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Configure weekly leagues (2 to 10 weeks), daily fixtures (each team plays everyday), or custom round-robin legs.
            </p>
          </div>
          {isAdmin ? (
            <button
              onClick={() => setShowGenModal(true)}
              disabled={state.teams.length < 2}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm font-semibold transition-colors"
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
            <div className="flex justify-between text-xs text-gray-400">
              <span>{totalCompleted} of {totalMatches} matches completed</span>
              <span className="font-mono font-bold text-emerald-400">
                {Math.round((totalCompleted / (totalMatches || 1)) * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
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
                <div key={round} className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
                  {/* Round Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50">
                    <button
                      onClick={() => setOpenRound(isOpen ? null : round)}
                      className="flex items-center gap-3 text-left flex-1 min-w-0"
                    >
                      <span className="font-bold text-white text-sm truncate">
                        {roundLabel}
                      </span>
                      {roundDate && (
                        <span className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" />
                          {roundDate}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        ({matches.length} {matches.length === 1 ? 'match' : 'matches'})
                      </span>
                      {doneCount === matches.length && matches.length > 0 ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="text-[11px] text-gray-500 font-mono">
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
                            className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700/60 transition-colors flex items-center gap-1"
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
                        className="p-1 text-gray-400 hover:text-white"
                      >
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Inline Round Meta Editor */}
                  {editingRoundNum === round && (
                    <div className="p-3.5 bg-gray-800/90 border-b border-gray-700 space-y-3">
                      <p className="text-xs font-semibold text-gray-300">
                        Update Round / Day Schedule Info
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] text-gray-400">Round Title</label>
                          <input
                            type="text"
                            value={roundLabelInput}
                            onChange={e => setRoundLabelInput(e.target.value)}
                            placeholder="e.g. Week 1 - Opening Matches"
                            className="w-full mt-0.5 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-400">Date (Applies to all matches in round)</label>
                          <input
                            type="date"
                            value={roundDateInput}
                            onChange={e => setRoundDateInput(e.target.value)}
                            className="w-full mt-0.5 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1 text-white text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingRoundNum(null)}
                          className="px-2.5 py-1 text-xs text-gray-400 hover:text-white"
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
                          editable={isAdmin}
                          onSaveScore={updateMatch}
                          onEditMatch={setEditingMatch}
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

      {/* Match Details Edit Modal */}
      {editingMatch && (
        <EditMatchModal
          match={editingMatch}
          onClose={() => setEditingMatch(null)}
          onSave={updateMatch}
          onDelete={deleteMatch}
        />
      )}
    </div>
  );
}
