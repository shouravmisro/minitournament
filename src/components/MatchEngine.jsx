import React, { useState, useMemo } from 'react';
import { useTournament, generateId } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import {
  Calendar, Play, CheckCircle, Edit3, Save, X, Shuffle,
  AlertCircle, RefreshCw, ChevronDown, ChevronUp, Clock
} from 'lucide-react';

/* ── Round-robin fixture generator ── */
function generateRoundRobin(teams) {
  const ids = teams.map(t => t.id);
  const n   = ids.length;
  // Add a bye if odd number of teams
  const list = n % 2 === 0 ? [...ids] : [...ids, null];
  const total = list.length;
  const rounds = total - 1;
  const fixtures = [];

  for (let r = 0; r < rounds; r++) {
    const round = [];
    for (let i = 0; i < total / 2; i++) {
      const a = list[i];
      const b = list[total - 1 - i];
      if (a !== null && b !== null) {
        round.push({ a, b });
      }
    }
    fixtures.push(round);
    // Rotate all but first element
    const last = list.pop();
    list.splice(1, 0, last);
  }
  return fixtures;
}

/* ── Single match score row ── */
function MatchRow({ match, editable, onSave }) {
  const { state } = useTournament();
  const teamA  = state.teams.find(t => t.id === match.teamAId);
  const teamB  = state.teams.find(t => t.id === match.teamBId);
  const [editing, setEditing]   = useState(false);
  const [sA, setSA]             = useState(String(match.scoreA ?? ''));
  const [sB, setSB]             = useState(String(match.scoreB ?? ''));

  function save() {
    const scoreA = parseInt(sA, 10);
    const scoreB = parseInt(sB, 10);
    if (isNaN(scoreA) || isNaN(scoreB)) return;
    onSave({ ...match, scoreA, scoreB, status: 'COMPLETED' });
    setEditing(false);
  }

  const isCompleted = match.status === 'COMPLETED';
  const aWon = isCompleted && (match.scoreA > match.scoreB);
  const bWon = isCompleted && (match.scoreB > match.scoreA);

  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors ${
      isCompleted
        ? 'bg-gray-800/30 border-gray-700/40'
        : 'bg-gray-800/60 border-gray-700'
    }`}>
      {/* Team A */}
      <div className={`flex items-center gap-1.5 flex-1 min-w-0 ${aWon ? '' : isCompleted ? 'opacity-50' : ''}`}>
        <span className="text-base shrink-0">{teamA?.logo}</span>
        <span className={`text-sm font-semibold truncate ${aWon ? 'text-white' : 'text-gray-300'}`}>
          {teamA?.name ?? '?'}
        </span>
      </div>

      {/* Score area */}
      <div className="flex items-center gap-1.5 shrink-0">
        {editing ? (
          <>
            <input
              type="number" min="0" max="99"
              value={sA}
              onChange={e => setSA(e.target.value)}
              className="w-12 bg-gray-700 border border-gray-500 rounded-lg text-white text-center font-bold py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              autoFocus
            />
            <span className="text-gray-500 text-xs">–</span>
            <input
              type="number" min="0" max="99"
              value={sB}
              onChange={e => setSB(e.target.value)}
              className="w-12 bg-gray-700 border border-gray-500 rounded-lg text-white text-center font-bold py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button onClick={save}
              className="ml-1 bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-lg">
              <Save className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setEditing(false)}
              className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-gray-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : isCompleted ? (
          <>
            <span className={`text-lg font-black ${aWon ? 'text-white' : 'text-gray-500'}`}>{match.scoreA}</span>
            <span className="text-gray-600 text-sm">–</span>
            <span className={`text-lg font-black ${bWon ? 'text-white' : 'text-gray-500'}`}>{match.scoreB}</span>
            {editable && (
              <button onClick={() => { setSA(String(match.scoreA)); setSB(String(match.scoreB)); setEditing(true); }}
                className="ml-1 text-gray-600 hover:text-amber-400 p-1 rounded">
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        ) : (
          <>
            <span className="text-gray-600 text-sm font-mono px-3">vs</span>
            {editable && (
              <button onClick={() => { setSA(''); setSB(''); setEditing(true); }}
                className="bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 text-xs font-medium px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1">
                <Play className="w-3 h-3" /> Score
              </button>
            )}
          </>
        )}
      </div>

      {/* Team B */}
      <div className={`flex items-center gap-1.5 flex-1 min-w-0 justify-end ${bWon ? '' : isCompleted ? 'opacity-50' : ''}`}>
        <span className={`text-sm font-semibold truncate ${bWon ? 'text-white' : 'text-gray-300'}`}>
          {teamB?.name ?? '?'}
        </span>
        <span className="text-base shrink-0">{teamB?.logo}</span>
      </div>
    </div>
  );
}

export default function MatchEngine() {
  const { state, addMatch, updateMatch } = useTournament();
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  const [openRound, setOpenRound] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  /* Group matches by round */
  const byRound = useMemo(() => {
    const map = {};
    state.matches
      .filter(m => m.stage === 'LEAGUE')
      .forEach(m => {
        if (!map[m.round]) map[m.round] = [];
        map[m.round].push(m);
      });
    return map;
  }, [state.matches]);

  const leagueRounds = Object.keys(byRound).map(Number).sort((a, b) => a - b);

  function handleGenerate() {
    setGenError('');
    if (state.teams.length < 2) {
      setGenError('Need at least 2 teams to generate fixtures.');
      return;
    }
    // Check no existing league matches
    const existing = state.matches.filter(m => m.stage === 'LEAGUE');
    if (existing.length > 0) {
      setGenError('League fixtures already exist. Reset them in Admin Settings first.');
      return;
    }
    setGenerating(true);
    const rounds = generateRoundRobin(state.teams);
    rounds.forEach((round, rIdx) => {
      round.forEach(({ a, b }) => {
        addMatch({
          id:      generateId('m'),
          stage:   'LEAGUE',
          round:   rIdx + 1,
          teamAId: a,
          teamBId: b,
          scoreA:  null,
          scoreB:  null,
          status:  'SCHEDULED',
        });
      });
    });
    setGenerating(false);
    setOpenRound(1);
  }

  function handleSaveScore(updated) {
    updateMatch(updated);
  }

  const totalCompleted = state.matches.filter(m => m.stage === 'LEAGUE' && m.status === 'COMPLETED').length;
  const totalMatches   = state.matches.filter(m => m.stage === 'LEAGUE').length;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          League Fixtures
        </h2>
        {isAdmin && leagueRounds.length === 0 && (
          <button
            onClick={handleGenerate}
            disabled={generating || state.teams.length < 2}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all"
          >
            <Shuffle className="w-4 h-4" />
            Generate Fixtures
          </button>
        )}
      </div>

      {genError && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {genError}
        </div>
      )}

      {leagueRounds.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-gray-700 rounded-2xl text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-400">No fixtures yet</p>
          {isAdmin
            ? <p className="text-sm mt-1">Click <span className="text-purple-400 font-medium">Generate Fixtures</span> to create the round-robin schedule.</p>
            : <p className="text-sm mt-1">The admin hasn't generated fixtures yet.</p>
          }
          {state.teams.length < 2 && (
            <p className="text-xs mt-2 text-amber-400">⚠ You need at least 2 teams first.</p>
          )}
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{totalCompleted} / {totalMatches} completed</span>
              <span>{Math.round((totalCompleted / (totalMatches || 1)) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${(totalCompleted / (totalMatches || 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Rounds */}
          {leagueRounds.map(round => {
            const matches = byRound[round] ?? [];
            const done    = matches.filter(m => m.status === 'COMPLETED').length;
            const isOpen  = openRound === round;
            return (
              <div key={round}>
                <button
                  onClick={() => setOpenRound(isOpen ? null : round)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/60 hover:bg-gray-800 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white text-sm">Round {round}</span>
                    <span className="text-xs text-gray-500">{matches.length} match{matches.length !== 1 ? 'es' : ''}</span>
                    {done === matches.length
                      ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                      : <Clock className="w-4 h-4 text-gray-600" />
                    }
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{done}/{matches.length}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="mt-2 space-y-1.5">
                    {matches.map(m => (
                      <MatchRow
                        key={m.id}
                        match={m}
                        editable={isAdmin}
                        onSave={handleSaveScore}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

