import React, { useState, useMemo } from 'react';
import { useTournament, generateId } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import {
  GitBranch, Trophy, ChevronRight, Play, Save, X,
  Shuffle, AlertCircle, Crown
} from 'lucide-react';

/* ─────────────────────────────────────────
   Seed QF / SF / Final brackets from top-N teams
   sorted by league standings. Supports 4 or 8 teams.
───────────────────────────────────────── */
function seedKnockout(teams, matches) {
  // Compute simple point totals for seeding
  const points = {};
  teams.forEach(t => { points[t.id] = 0; });
  matches.filter(m => m.stage === 'LEAGUE' && m.status === 'COMPLETED').forEach(m => {
    const sA = m.scoreA ?? 0;
    const sB = m.scoreB ?? 0;
    if (sA > sB) points[m.teamAId] = (points[m.teamAId] ?? 0) + 3;
    else if (sB > sA) points[m.teamBId] = (points[m.teamBId] ?? 0) + 3;
    else { points[m.teamAId] = (points[m.teamAId] ?? 0) + 1; points[m.teamBId] = (points[m.teamBId] ?? 0) + 1; }
  });
  return [...teams].sort((a, b) => (points[b.id] ?? 0) - (points[a.id] ?? 0));
}

/* ─────────────────────────────────────────
   Single bracket match card
───────────────────────────────────────── */
function BracketMatch({ match, isAdmin, onScore }) {
  const { state } = useTournament();
  const [editing, setEditing] = useState(false);
  const [sA, setSA] = useState('');
  const [sB, setSB] = useState('');

  const teamA = match?.teamAId ? state.teams.find(t => t.id === match.teamAId) : null;
  const teamB = match?.teamBId ? state.teams.find(t => t.id === match.teamBId) : null;

  if (!match) return (
    <div className="w-36 rounded-xl border-2 border-dashed border-gray-700 p-3 text-center text-xs text-gray-600">
      TBD
    </div>
  );

  const done  = match.status === 'COMPLETED';
  const aWon  = done && match.scoreA > match.scoreB;
  const bWon  = done && match.scoreB > match.scoreA;

  function save() {
    const scoreA = parseInt(sA, 10);
    const scoreB = parseInt(sB, 10);
    if (isNaN(scoreA) || isNaN(scoreB) || scoreA === scoreB) return; // KO must have a winner
    onScore({ ...match, scoreA, scoreB, status: 'COMPLETED' });
    setEditing(false);
  }

  return (
    <div className={`w-44 rounded-xl border overflow-hidden shadow-lg ${
      done ? 'border-gray-700' : 'border-gray-600'
    }`}>
      {/* Team A row */}
      {[{team: teamA, score: match.scoreA, won: aWon, key: 'a'},
        {team: teamB, score: match.scoreB, won: bWon, key: 'b'}].map(row => (
        <div key={row.key}
          className={`flex items-center gap-2 px-2.5 py-2 ${
            row.won
              ? 'bg-emerald-500/15 border-l-2 border-emerald-500'
              : 'bg-gray-800/80'
          }`}>
          <span className="text-sm">{row.team?.logo ?? '?'}</span>
          <span className={`text-xs font-semibold flex-1 truncate ${row.won ? 'text-white' : done ? 'text-gray-500' : 'text-gray-300'}`}>
            {row.team?.name ?? 'TBD'}
          </span>
          {done && (
            <span className={`text-sm font-black ${row.won ? 'text-white' : 'text-gray-500'}`}>
              {row.score ?? '-'}
            </span>
          )}
        </div>
      ))}

      {/* Score entry */}
      {isAdmin && !done && teamA && teamB && (
        editing ? (
          <div className="bg-gray-900 p-2 flex items-center gap-1">
            <input type="number" min="0" value={sA} onChange={e => setSA(e.target.value)}
              className="w-10 bg-gray-700 border border-gray-600 rounded text-white text-center text-xs py-1 focus:outline-none focus:ring-1 focus:ring-amber-500"
              autoFocus />
            <span className="text-gray-600 text-xs">-</span>
            <input type="number" min="0" value={sB} onChange={e => setSB(e.target.value)}
              className="w-10 bg-gray-700 border border-gray-600 rounded text-white text-center text-xs py-1 focus:outline-none focus:ring-1 focus:ring-amber-500" />
            <button onClick={save} className="ml-auto bg-emerald-600 text-white p-1 rounded">
              <Save className="w-3 h-3" />
            </button>
            <button onClick={() => setEditing(false)} className="text-gray-500 p-1 rounded">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button onClick={() => { setSA(''); setSB(''); setEditing(true); }}
            className="w-full text-center py-1.5 text-xs text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 flex items-center justify-center gap-1 transition-colors">
            <Play className="w-3 h-3" /> Enter Score
          </button>
        )
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Connector line SVG between rounds
───────────────────────────────────────── */
function Connector() {
  return (
    <div className="flex items-center self-stretch w-8 shrink-0">
      <ChevronRight className="w-5 h-5 text-gray-600 mx-auto" />
    </div>
  );
}

export default function KnockoutBracket() {
  const { state, addMatch, updateMatch } = useTournament();
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  const koMatches = useMemo(
    () => state.matches.filter(m => m.stage === 'KNOCKOUT'),
    [state.matches]
  );

  const hasKO = koMatches.length > 0;

  // Identify stages
  const qfMatches = koMatches.filter(m => m.koStage === 'QF');
  const sfMatches = koMatches.filter(m => m.koStage === 'SF');
  const fMatch    = koMatches.find(m => m.koStage === 'FINAL');

  /* Generate KO bracket */
  function handleGenerate() {
    if (hasKO) return;
    const n = state.teams.length;
    if (n < 2) return;

    const seeded = seedKnockout(state.teams, state.matches);

    if (n >= 8) {
      // QF (4 matches) → SF (2) → Final (1)
      const top8 = seeded.slice(0, 8);
      const qfs  = [[0,7],[3,4],[1,6],[2,5]]; // seeding pairing
      const qfIds = qfs.map(([i,j]) =>
        addMatchAndReturn({ koStage: 'QF', teamAId: top8[i]?.id ?? null, teamBId: top8[j]?.id ?? null })
      );
      addMatchAndReturn({ koStage: 'SF', teamAId: null, teamBId: null, feedFrom: [qfIds[0], qfIds[1]] });
      addMatchAndReturn({ koStage: 'SF', teamAId: null, teamBId: null, feedFrom: [qfIds[2], qfIds[3]] });
      addMatchAndReturn({ koStage: 'FINAL', teamAId: null, teamBId: null });
    } else if (n >= 4) {
      // SF (2) → Final
      const top4 = seeded.slice(0, 4);
      addMatchAndReturn({ koStage: 'SF', teamAId: top4[0]?.id ?? null, teamBId: top4[3]?.id ?? null });
      addMatchAndReturn({ koStage: 'SF', teamAId: top4[1]?.id ?? null, teamBId: top4[2]?.id ?? null });
      addMatchAndReturn({ koStage: 'FINAL', teamAId: null, teamBId: null });
    } else {
      // Just a Final
      addMatchAndReturn({ koStage: 'FINAL', teamAId: seeded[0]?.id ?? null, teamBId: seeded[1]?.id ?? null });
    }
  }

  function addMatchAndReturn(extra) {
    const id = generateId('m');
    addMatch({ id, stage: 'KNOCKOUT', scoreA: null, scoreB: null, status: 'SCHEDULED', ...extra });
    return id;
  }

  /* When a KO match is scored, advance winner to next round */
  function handleScore(updated) {
    updateMatch(updated);

    const winner = (updated.scoreA ?? 0) > (updated.scoreB ?? 0)
      ? updated.teamAId : updated.teamBId;

    // Advance: QF winner → SF, SF winner → Final
    if (updated.koStage === 'QF') {
      // Find which SF this feeds into based on index
      const qfIdx = qfMatches.findIndex(m => m.id === updated.id);
      const sfIdx = Math.floor(qfIdx / 2);
      const sf    = sfMatches[sfIdx];
      if (sf) {
        const slot  = qfIdx % 2 === 0 ? 'teamAId' : 'teamBId';
        updateMatch({ ...sf, [slot]: winner });
      }
    } else if (updated.koStage === 'SF') {
      const sfIdx = sfMatches.findIndex(m => m.id === updated.id);
      const final = fMatch;
      if (final) {
        const slot = sfIdx === 0 ? 'teamAId' : 'teamBId';
        updateMatch({ ...final, [slot]: winner });
      }
    }
  }

  /* Find the champion */
  const champion = fMatch?.status === 'COMPLETED'
    ? state.teams.find(t => t.id === (
        (fMatch.scoreA > fMatch.scoreB) ? fMatch.teamAId : fMatch.teamBId
      ))
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-amber-400" />
          Knockout Bracket
        </h2>
        {isAdmin && !hasKO && state.teams.length >= 2 && (
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all"
          >
            <Shuffle className="w-4 h-4" /> Generate Bracket
          </button>
        )}
      </div>

      {/* Champion banner */}
      {champion && (
        <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 rounded-2xl p-5 text-center space-y-2">
          <div className="text-5xl">🏆</div>
          <p className="text-amber-400 font-semibold text-sm uppercase tracking-widest">Champion</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl">{champion.logo}</span>
            <p className="text-3xl font-black text-white">{champion.name}</p>
          </div>
        </div>
      )}

      {!hasKO ? (
        <div className="text-center py-12 border border-dashed border-gray-700 rounded-2xl text-gray-500">
          <GitBranch className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium text-gray-400">No knockout bracket yet.</p>
          {isAdmin
            ? <p className="text-sm mt-1">Click <span className="text-amber-400">Generate Bracket</span> to seed from league standings.</p>
            : <p className="text-sm mt-1">The Admin will generate the bracket.</p>
          }
        </div>
      ) : (
        /* ── Bracket layout ── */
        <div className="overflow-x-auto pb-4">
          <div className="flex items-start gap-0 min-w-max">

            {/* Quarter Finals */}
            {qfMatches.length > 0 && (
              <>
                <div className="flex flex-col gap-8 justify-around">
                  <div className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">QF</div>
                  {qfMatches.map(m => (
                    <BracketMatch key={m.id} match={m} isAdmin={isAdmin} onScore={handleScore} />
                  ))}
                </div>
                <Connector />
              </>
            )}

            {/* Semi Finals */}
            {sfMatches.length > 0 && (
              <>
                <div className="flex flex-col gap-16 justify-around self-center">
                  <div className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">SF</div>
                  {sfMatches.map(m => (
                    <BracketMatch key={m.id} match={m} isAdmin={isAdmin} onScore={handleScore} />
                  ))}
                </div>
                <Connector />
              </>
            )}

            {/* Final */}
            {fMatch && (
              <div className="flex flex-col items-center self-center">
                <div className="text-center text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">FINAL</div>
                <BracketMatch match={fMatch} isAdmin={isAdmin} onScore={handleScore} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

