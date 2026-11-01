import React, { useState, useMemo } from 'react';
import { useTournament, generateId } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import {
  GitBranch, Trophy, ChevronRight, Play, Save, X,
  Shuffle, AlertCircle, Crown, ShieldCheck
} from 'lucide-react';

/* ─────────────────────────────────────────
   Seed QF / SF / Final brackets from top-N teams
   sorted by league standings. Supports 4 or 8 teams.
───────────────────────────────────────── */
function seedKnockout(teams, matches) {
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

  if (!match) {
    return (
      <div className="w-48 sketch-border rounded-xl p-4 text-center font-mono text-[10px] text-amber-500/30 uppercase tracking-widest bg-[#050814]/40">
        Awaiting Destiny
      </div>
    );
  }

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
    <div
      className={`w-52 sketch-border rounded-xl overflow-hidden shadow-xl transition-all ${
        done ? 'bg-[#050814]/90' : 'bg-[#0b132b]/80'
      }`}
    >
      {/* Team A & B rows */}
      {[{ team: teamA, score: match.scoreA, won: aWon, key: 'a' },
        { team: teamB, score: match.scoreB, won: bWon, key: 'b' }].map(row => (
        <div
          key={row.key}
          className={`flex items-center gap-2.5 px-3 py-2.5 border-b border-dashed border-amber-900/30 last:border-0 ${
            row.won ? 'bg-amber-950/30' : ''
          }`}
        >
          <span className="text-base shrink-0">{row.team?.logo ?? '🛡️'}</span>
          <span
            className={`font-serif text-sm flex-1 truncate ${
              row.won
                ? 'text-amber-200 font-bold'
                : done
                  ? 'text-amber-500/40'
                  : 'text-amber-100'
            }`}
          >
            {row.team?.name ?? 'TBD'}
          </span>
          {done && (
            <span
              className={`font-mono text-sm ${
                row.won ? 'text-amber-300 font-bold drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]' : 'text-amber-500/40'
              }`}
            >
              {row.score ?? '-'}
            </span>
          )}
        </div>
      ))}

      {/* Score entry for Admin */}
      {isAdmin && !done && teamA && teamB && (
        editing ? (
          <div className="bg-[#050814] p-2 flex items-center gap-1.5 border-t border-dashed border-amber-900/40">
            <input
              type="number"
              min="0"
              value={sA}
              onChange={e => setSA(e.target.value)}
              className="w-10 bg-[#0b132b] border border-amber-600/50 rounded text-amber-100 text-center font-mono text-xs py-1 focus:outline-none focus:border-amber-400"
              autoFocus
            />
            <span className="text-amber-600 text-xs font-mono">-</span>
            <input
              type="number"
              min="0"
              value={sB}
              onChange={e => setSB(e.target.value)}
              className="w-10 bg-[#0b132b] border border-amber-600/50 rounded text-amber-100 text-center font-mono text-xs py-1 focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={save}
              className="ml-auto bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 p-1.5 rounded transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-amber-500/50 hover:text-amber-300 p-1.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setSA(''); setSB(''); setEditing(true); }}
            className="w-full text-center py-2 text-[10px] font-mono tracking-widest uppercase text-amber-400 bg-amber-950/20 hover:bg-amber-950/40 border-t border-dashed border-amber-900/40 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Play className="w-3 h-3 text-amber-500" /> Enter Score
          </button>
        )
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Connector line between rounds
───────────────────────────────────────── */
function Connector() {
  return (
    <div className="flex items-center self-stretch w-10 shrink-0">
      <ChevronRight className="w-6 h-6 text-amber-700/50 mx-auto" />
    </div>
  );
}

export default function KnockoutBracket() {
  const { state, addMatch, updateMatch, addAuditLog } = useTournament();
  const { role, authenticatedId } = useAuth();
  const isAdmin = role === 'ADMIN';
  const currentPlayer = state.players.find(p => p.id === authenticatedId);
  const isOfficial = role === 'PLAYER' && Boolean(currentPlayer?.isOfficial);
  const canScore = isAdmin || isOfficial;

  const updaterInfo = isAdmin
    ? { id: 'admin', name: state.organizer?.hostName || 'Magistrate (Admin)', role: 'ADMIN' }
    : isOfficial
    ? { id: currentPlayer?.id || 'official', name: `${currentPlayer?.name || 'Player'} (Official Scribe)`, role: 'OFFICIAL' }
    : { id: 'unknown', name: 'Unknown', role: 'PUBLIC' };

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
      const top8 = seeded.slice(0, 8);
      const qfs  = [[0,7],[3,4],[1,6],[2,5]];
      const qfIds = qfs.map(([i,j]) =>
        addMatchAndReturn({ koStage: 'QF', teamAId: top8[i]?.id ?? null, teamBId: top8[j]?.id ?? null })
      );
      addMatchAndReturn({ koStage: 'SF', teamAId: null, teamBId: null, feedFrom: [qfIds[0], qfIds[1]] });
      addMatchAndReturn({ koStage: 'SF', teamAId: null, teamBId: null, feedFrom: [qfIds[2], qfIds[3]] });
      addMatchAndReturn({ koStage: 'FINAL', teamAId: null, teamBId: null });
    } else if (n >= 4) {
      const top4 = seeded.slice(0, 4);
      addMatchAndReturn({ koStage: 'SF', teamAId: top4[0]?.id ?? null, teamBId: top4[3]?.id ?? null });
      addMatchAndReturn({ koStage: 'SF', teamAId: top4[1]?.id ?? null, teamBId: top4[2]?.id ?? null });
      addMatchAndReturn({ koStage: 'FINAL', teamAId: null, teamBId: null });
    } else {
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

    if (addAuditLog) {
      const teamA = state.teams.find(t => t.id === updated.teamAId);
      const teamB = state.teams.find(t => t.id === updated.teamBId);
      const stageName = updated.koStage === 'FINAL' ? 'Championship Final' : updated.koStage === 'SF' ? 'Semi-Final' : 'Quarter-Final';
      addAuditLog({
        id: generateId('audit'),
        timestamp: Date.now(),
        userId: updaterInfo.id,
        userName: updaterInfo.name,
        userRole: updaterInfo.role,
        matchId: updated.id,
        action: 'KNOCKOUT_SCORED',
        summary: `[${stageName}] ${teamA?.name || 'Team A'} ${updated.scoreA ?? '-'} - ${updated.scoreB ?? '-'} ${teamB?.name || 'Team B'}`,
        details: `Recorded knockout stage match conclusion for ${stageName}`,
      });
    }

    const winner = (updated.scoreA ?? 0) > (updated.scoreB ?? 0)
      ? updated.teamAId : updated.teamBId;

    if (updated.koStage === 'QF') {
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
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Official Scribe Privilege Banner */}
      {isOfficial && !isAdmin && (
        <div className="sketch-border bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 flex items-center gap-3 text-emerald-200 text-xs shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <span className="font-serif font-bold text-emerald-100">Ordained Match Scribe Access Active: </span>
            <span className="text-emerald-200/80">You can enter scores for tournament knockout bracket matches. All results will be recorded in the audit logbook.</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-dashed border-amber-900/40 pb-4">
        <h2 className="text-2xl font-serif text-amber-200 flex items-center gap-3">
          <GitBranch className="w-6 h-6 text-amber-500 stroke-[1.5]" />
          The Final Ascent (Knockout Bracket)
        </h2>
        {isAdmin && !hasKO && state.teams.length >= 2 && (
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 bg-[#050814] border border-amber-500/40 text-amber-400 font-serif px-4 py-2 rounded-xl text-sm transition-all shadow-[0_0_10px_rgba(217,119,6,0.2)] hover:bg-amber-900/40 hover:text-amber-300"
          >
            <Shuffle className="w-4 h-4" /> Forge Bracket
          </button>
        )}
      </div>

      {/* Champion banner */}
      {champion && (
        <div
          className="sketch-border bg-[#0b132b]/80 p-6 text-center space-y-2 relative overflow-hidden shadow-2xl"
          style={{ borderRadius: '1.5rem 0.5rem 1.5rem 0.5rem' }}
        >
          <div className="absolute inset-0 bg-amber-500/10 blur-[30px] rounded-full pointer-events-none" />
          <div className="text-5xl drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]">🏆</div>
          <p className="text-amber-400 font-mono text-xs uppercase tracking-widest">Grand Champion of the Realm</p>
          <div className="flex items-center justify-center gap-3 pt-1">
            <span className="text-4xl">{champion.logo}</span>
            <p className="text-3xl font-serif font-bold text-amber-100 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
              {champion.name}
            </p>
          </div>
        </div>
      )}

      {!hasKO ? (
        <div className="text-center py-16 sketch-border rounded-2xl flex flex-col items-center">
          <GitBranch className="w-12 h-12 mb-3 text-amber-900/40" />
          <p className="font-serif text-amber-500/60 text-lg">The final ascent remains unwritten.</p>
          {isAdmin ? (
            <p className="text-xs font-mono tracking-widest uppercase text-amber-500/40 mt-1">
              Select <span className="text-amber-400">Forge Bracket</span> to seed finalists from league standing points.
            </p>
          ) : (
            <p className="text-xs font-mono tracking-widest uppercase text-amber-500/40 mt-1">
              Knockout ties will appear here once seeded by the Tournament Herald.
            </p>
          )}
        </div>
      ) : (
        /* ── Bracket layout ── */
        <div className="overflow-x-auto pb-6 pt-2">
          <div className="flex items-start gap-0 min-w-max">
            {/* Quarter Finals */}
            {qfMatches.length > 0 && (
              <>
                <div className="flex flex-col gap-8 justify-around">
                  <div className="text-center font-mono text-[10px] text-amber-600 uppercase tracking-widest mb-2">
                    Quarter-Finals
                  </div>
                  {qfMatches.map(m => (
                    <BracketMatch key={m.id} match={m} isAdmin={canScore} onScore={handleScore} />
                  ))}
                </div>
                <Connector />
              </>
            )}

            {/* Semi Finals */}
            {sfMatches.length > 0 && (
              <>
                <div className="flex flex-col gap-16 justify-around self-center">
                  <div className="text-center font-mono text-[10px] text-amber-600 uppercase tracking-widest mb-2">
                    Semi-Finals
                  </div>
                  {sfMatches.map(m => (
                    <BracketMatch key={m.id} match={m} isAdmin={canScore} onScore={handleScore} />
                  ))}
                </div>
                <Connector />
              </>
            )}

            {/* Final */}
            {fMatch && (
              <div className="flex flex-col items-center self-center">
                <div className="text-center font-mono text-[10px] text-amber-400 uppercase tracking-widest mb-2 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]">
                  The Grand Final
                </div>
                <BracketMatch match={fMatch} isAdmin={canScore} onScore={handleScore} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
