import React, { useMemo, useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { TrendingUp, Target, Zap, Shield, Star, Trophy, Users } from 'lucide-react';

/* ── Compute league table from completed matches ── */
function computeTable(teams, matches) {
  const rows = teams.map(t => ({
    id: t.id,
    name: t.name,
    logo: t.logo,
    primaryColor: t.primaryColor,
    P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0,
  }));

  const leagueCompleted = matches.filter(m => m.stage === 'LEAGUE' && m.status === 'COMPLETED');

  leagueCompleted.forEach(m => {
    const a = rows.find(r => r.id === m.teamAId);
    const b = rows.find(r => r.id === m.teamBId);
    if (!a || !b) return;

    const sA = m.scoreA ?? 0;
    const sB = m.scoreB ?? 0;

    a.P++; a.GF += sA; a.GA += sB;
    b.P++; b.GF += sB; b.GA += sA;

    if (sA > sB)      { a.W++; a.Pts += 3; b.L++; }
    else if (sB > sA) { b.W++; b.Pts += 3; a.L++; }
    else              { a.D++; a.Pts += 1; b.D++; b.Pts += 1; }
  });

  rows.forEach(r => { r.GD = r.GF - r.GA; });

  // Sort: Pts → GD → GF → name
  rows.sort((a, b) =>
    b.Pts - a.Pts ||
    b.GD  - a.GD  ||
    b.GF  - a.GF  ||
    a.name.localeCompare(b.name)
  );

  return rows;
}

export default function LeagueStandings() {
  const { state } = useTournament();
  const [viewTab, setViewTab] = useState('TABLE'); // 'TABLE' | 'LEADERBOARD'

  const table = useMemo(
    () => computeTable(state.teams, state.matches),
    [state.teams, state.matches]
  );

  const hasLeague = state.matches.some(m => m.stage === 'LEAGUE');
  const colBase = 'text-right text-xs sm:text-sm font-mono';

  // Leaders calculations
  const topScorers = useMemo(() =>
    [...state.players]
      .filter(p => (p.stats?.goals || 0) > 0)
      .sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0))
      .slice(0, 5),
    [state.players]
  );

  const topAssisters = useMemo(() =>
    [...state.players]
      .filter(p => (p.stats?.assists || 0) > 0)
      .sort((a, b) => (b.stats?.assists || 0) - (a.stats?.assists || 0))
      .slice(0, 5),
    [state.players]
  );

  const topGKs = useMemo(() =>
    [...state.players]
      .filter(p => (p.stats?.cleanSheets || 0) > 0 || (p.stats?.saves || 0) > 0 || p.position === 'GK')
      .sort((a, b) =>
        (b.stats?.cleanSheets || 0) - (a.stats?.cleanSheets || 0) ||
        (b.stats?.saves || 0) - (a.stats?.saves || 0)
      )
      .slice(0, 5),
    [state.players]
  );

  const topRated = useMemo(() =>
    [...state.players]
      .filter(p => Number(p.stats?.avgRating || 0) > 0)
      .sort((a, b) => Number(b.stats?.avgRating || 0) - Number(a.stats?.avgRating || 0))
      .slice(0, 5),
    [state.players]
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-dashed border-amber-900/40 pb-4">
        <h2 className="text-2xl font-serif text-amber-200 flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-emerald-400 stroke-[1.5]" />
          Championship Ledger & Honors
        </h2>

        <div className="flex bg-[#050814] p-1 rounded-xl border border-amber-900/40 text-xs">
          <button
            onClick={() => setViewTab('TABLE')}
            className={`px-3.5 py-1.5 rounded-lg font-serif transition-all ${
              viewTab === 'TABLE'
                ? 'bg-amber-950/50 text-amber-300 border border-amber-500/30 shadow-[0_0_8px_rgba(217,119,6,0.2)]'
                : 'text-amber-500/60 hover:text-amber-200'
            }`}
          >
            Standings Ledger
          </button>
          <button
            onClick={() => setViewTab('LEADERBOARD')}
            className={`px-3.5 py-1.5 rounded-lg font-serif transition-all ${
              viewTab === 'LEADERBOARD'
                ? 'bg-amber-950/50 text-amber-300 border border-amber-500/30 shadow-[0_0_8px_rgba(217,119,6,0.2)]'
                : 'text-amber-500/60 hover:text-amber-200'
            }`}
          >
            Warrior Honors
          </button>
        </div>
      </div>

      {viewTab === 'TABLE' ? (
        !hasLeague || table.length === 0 ? (
          <div className="text-center py-16 sketch-border rounded-2xl flex flex-col items-center">
            <TrendingUp className="w-12 h-12 mb-3 text-amber-900/40" />
            <p className="font-serif text-amber-500/60 text-lg">No league battles recorded yet.</p>
            <p className="text-xs font-mono tracking-widest uppercase text-amber-500/40 mt-1">
              Generate fixtures and chronicled match scores in the Fixtures ledger.
            </p>
          </div>
        ) : (
          <div className="sketch-border bg-[#0b132b]/60 rounded-2xl overflow-hidden shadow-2xl p-4 sm:p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-amber-500/60 font-mono text-[10px] tracking-widest uppercase border-b border-dashed border-amber-900/40">
                    <th className="text-left py-3 px-2.5 w-8">Rank</th>
                    <th className="text-left py-3 px-2.5">Faction</th>
                    <th className={colBase + ' px-2.5'}>P</th>
                    <th className={colBase + ' px-2.5'}>W</th>
                    <th className={colBase + ' px-2.5'}>D</th>
                    <th className={colBase + ' px-2.5'}>L</th>
                    <th className={colBase + ' px-2.5 hidden sm:table-cell'}>GF</th>
                    <th className={colBase + ' px-2.5 hidden sm:table-cell'}>GA</th>
                    <th className={colBase + ' px-2.5'}>GD</th>
                    <th className={colBase + ' px-2.5 font-bold text-amber-300'}>Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/20">
                  {table.map((row, idx) => {
                    const isTop = idx === 0;
                    return (
                      <tr
                        key={row.id}
                        className={`transition-colors hover:bg-amber-950/20 ${
                          isTop ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        <td className="py-3 px-2.5">
                          <span className={`text-[11px] font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center border ${
                            idx === 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(251,191,36,0.3)]' :
                            idx === 1 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                            idx === 2 ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' :
                                        'text-amber-500/40 border-amber-900/30'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>

                        <td className="py-3 px-2.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{row.logo}</span>
                            <div>
                              <p className="font-serif font-semibold text-amber-100 text-sm leading-tight truncate max-w-[140px] sm:max-w-none">
                                {row.name}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className={colBase + ' px-2.5 text-amber-100/70'}>{row.P}</td>
                        <td className={colBase + ' px-2.5 text-emerald-400 font-bold'}>{row.W}</td>
                        <td className={colBase + ' px-2.5 text-amber-300/80'}>{row.D}</td>
                        <td className={colBase + ' px-2.5 text-red-400'}>{row.L}</td>
                        <td className={colBase + ' px-2.5 text-amber-100/50 hidden sm:table-cell'}>{row.GF}</td>
                        <td className={colBase + ' px-2.5 text-amber-100/50 hidden sm:table-cell'}>{row.GA}</td>
                        <td className={colBase + ' px-2.5 font-bold ' + (row.GD > 0 ? 'text-emerald-400' : row.GD < 0 ? 'text-red-400' : 'text-amber-100/60')}>
                          {row.GD > 0 ? `+${row.GD}` : row.GD}
                        </td>
                        <td className={colBase + ' px-2.5 font-bold text-amber-200 text-base drop-shadow-[0_0_6px_rgba(251,191,36,0.3)]'}>
                          {row.Pts}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-5 pt-3 border-t border-dashed border-amber-900/30 px-2 text-[10px] font-mono tracking-widest uppercase text-amber-500/50">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.5)]" /> 1st Place (Apex)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> 2nd Place (Silver)
              </span>
              <span className="ml-auto hidden sm:inline">P: Played • W: Won • D: Draw • L: Lost • GD: Goal Diff • Pts: Points</span>
            </div>
          </div>
        )
      ) : (
        /* ── Player Stats Leaderboards View ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* 1. Golden Boot (Top Goals) */}
          <div className="sketch-border bg-[#0b132b]/60 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="font-serif text-base text-amber-200 flex items-center gap-2.5 border-b border-dashed border-amber-900/40 pb-3">
              <Target className="w-4 h-4 text-emerald-400" /> Golden Boot (Top Scorers)
            </h3>
            {topScorers.length === 0 ? (
              <p className="text-xs font-serif text-amber-500/40 py-6 text-center italic">No goals chronicled yet.</p>
            ) : (
              <div className="space-y-2.5">
                {topScorers.map((p, idx) => {
                  const team = state.teams.find(t => t.id === p.teamId);
                  return (
                    <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#050814]/40 border border-amber-900/20">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-amber-600 w-4 font-bold">{idx + 1}.</span>
                        <span className="font-serif font-semibold text-amber-100">{p.name}</span>
                        <span className="text-xs">{team?.logo}</span>
                      </div>
                      <span className="font-bold text-emerald-400 font-mono text-sm">
                        {p.stats.goals} ⚽
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Playmaker Kings (Top Assists) */}
          <div className="sketch-border bg-[#0b132b]/60 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="font-serif text-base text-amber-200 flex items-center gap-2.5 border-b border-dashed border-amber-900/40 pb-3">
              <Zap className="w-4 h-4 text-amber-400" /> Crown Architects (Top Assists)
            </h3>
            {topAssisters.length === 0 ? (
              <p className="text-xs font-serif text-amber-500/40 py-6 text-center italic">No assists chronicled yet.</p>
            ) : (
              <div className="space-y-2.5">
                {topAssisters.map((p, idx) => {
                  const team = state.teams.find(t => t.id === p.teamId);
                  return (
                    <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#050814]/40 border border-amber-900/20">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-amber-600 w-4 font-bold">{idx + 1}.</span>
                        <span className="font-serif font-semibold text-amber-100">{p.name}</span>
                        <span className="text-xs">{team?.logo}</span>
                      </div>
                      <span className="font-bold text-amber-300 font-mono text-sm">
                        {p.stats.assists} ⚡
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Golden Glove (Clean Sheets & Saves) */}
          <div className="sketch-border bg-[#0b132b]/60 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="font-serif text-base text-amber-200 flex items-center gap-2.5 border-b border-dashed border-amber-900/40 pb-3">
              <Shield className="w-4 h-4 text-cyan-400" /> Golden Glove (Defenders & Goalkeepers)
            </h3>
            {topGKs.length === 0 ? (
              <p className="text-xs font-serif text-amber-500/40 py-6 text-center italic">No sentinel stats recorded yet.</p>
            ) : (
              <div className="space-y-2.5">
                {topGKs.map((p, idx) => {
                  const team = state.teams.find(t => t.id === p.teamId);
                  return (
                    <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#050814]/40 border border-amber-900/20">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-amber-600 w-4 font-bold">{idx + 1}.</span>
                        <span className="font-serif font-semibold text-amber-100">{p.name}</span>
                        <span className="text-xs">{team?.logo}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="text-emerald-400 font-bold">{p.stats?.cleanSheets || 0} CS</span>
                        <span className="text-amber-900/60">|</span>
                        <span className="text-cyan-300 font-bold">{p.stats?.saves || 0} sv</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Top Rated Players */}
          <div className="sketch-border bg-[#0b132b]/60 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="font-serif text-base text-amber-200 flex items-center gap-2.5 border-b border-dashed border-amber-900/40 pb-3">
              <Star className="w-4 h-4 text-purple-400" /> Grand Valuations (Highest Ratings)
            </h3>
            {topRated.length === 0 ? (
              <p className="text-xs font-serif text-amber-500/40 py-6 text-center italic">No match valuations recorded yet.</p>
            ) : (
              <div className="space-y-2.5">
                {topRated.map((p, idx) => {
                  const team = state.teams.find(t => t.id === p.teamId);
                  return (
                    <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#050814]/40 border border-amber-900/20">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-amber-600 w-4 font-bold">{idx + 1}.</span>
                        <span className="font-serif font-semibold text-amber-100">{p.name}</span>
                        <span className="text-[10px] font-mono text-amber-500/60 uppercase">({p.position})</span>
                        <span className="text-xs">{team?.logo}</span>
                      </div>
                      <span className="font-bold text-purple-400 font-mono text-sm">
                        {p.stats.avgRating}★
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
