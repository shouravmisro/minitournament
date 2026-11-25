import React, { useMemo, useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import { computeLeagueTable, TIEBREAKER_OPTIONS } from '../utils/standings';
import { TrendingUp, Target, Zap, Shield, Star, Trophy, Users } from 'lucide-react';

export default function LeagueStandings() {
  const { state, setTiebreakerMode } = useTournament();
  const { role } = useAuth();
  const [viewTab, setViewTab] = useState('TABLE'); // 'TABLE' | 'LEADERBOARD'

  const tiebreakerMode = state.tiebreakerMode || 'GD_GF_H2H';
  const activePreset = TIEBREAKER_OPTIONS.find(o => o.id === tiebreakerMode) || TIEBREAKER_OPTIONS[0];

  const table = useMemo(
    () => computeLeagueTable(state.teams, state.matches, tiebreakerMode),
    [state.teams, state.matches, tiebreakerMode]
  );

  const hasLeague = state.matches.some(m => m.stage === 'LEAGUE');
  const colBase = 'text-right text-xs sm:text-sm font-mono';

  // Leaders calculations (Top 10 in each category)
  const topScorers = useMemo(() =>
    [...state.players]
      .filter(p => (p.stats?.goals || 0) > 0)
      .sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0))
      .slice(0, 10),
    [state.players]
  );

  const topAssisters = useMemo(() =>
    [...state.players]
      .filter(p => (p.stats?.assists || 0) > 0)
      .sort((a, b) => (b.stats?.assists || 0) - (a.stats?.assists || 0))
      .slice(0, 10),
    [state.players]
  );

  const topGKs = useMemo(() =>
    [...state.players]
      .filter(p => (p.stats?.cleanSheets || 0) > 0 || (p.stats?.saves || 0) > 0 || p.position === 'GK')
      .sort((a, b) =>
        (b.stats?.cleanSheets || 0) - (a.stats?.cleanSheets || 0) ||
        (b.stats?.saves || 0) - (a.stats?.saves || 0)
      )
      .slice(0, 10),
    [state.players]
  );

  const topRated = useMemo(() =>
    [...state.players]
      .filter(p => Number(p.stats?.avgRating || 0) > 0)
      .sort((a, b) => Number(b.stats?.avgRating || 0) - Number(a.stats?.avgRating || 0))
      .slice(0, 10),
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
            Standings
          </button>
          <button
            onClick={() => setViewTab('MATRIX')}
            className={`px-3.5 py-1.5 rounded-lg font-serif transition-all ${
              viewTab === 'MATRIX'
                ? 'bg-amber-950/50 text-amber-300 border border-amber-500/30 shadow-[0_0_8px_rgba(217,119,6,0.2)]'
                : 'text-amber-500/60 hover:text-amber-200'
            }`}
          >
            H2H Matrix
          </button>
          <button
            onClick={() => setViewTab('LEADERBOARD')}
            className={`px-3.5 py-1.5 rounded-lg font-serif transition-all ${
              viewTab === 'LEADERBOARD'
                ? 'bg-amber-950/50 text-amber-300 border border-amber-500/30 shadow-[0_0_8px_rgba(217,119,6,0.2)]'
                : 'text-amber-500/60 hover:text-amber-200'
            }`}
          >
            Top Players
          </button>
        </div>
      </div>

      {viewTab === 'MATRIX' ? (
        state.teams.length < 2 ? (
          <div className="text-center py-12 sketch-border rounded-2xl text-amber-500/60 text-sm">
            At least 2 teams are needed for a Head-to-Head Matrix.
          </div>
        ) : (
          <div className="sketch-border bg-[#0b132b]/60 rounded-2xl p-4 sm:p-6 overflow-x-auto shadow-2xl">
            <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400 mb-3">
              Head-to-Head Results Grid (Row Team vs Column Team)
            </p>
            <table className="w-full text-xs border-collapse min-w-[460px]">
              <thead>
                <tr className="border-b border-amber-900/40 text-amber-400 font-mono">
                  <th className="text-left p-2">Team</th>
                  {state.teams.map(col => (
                    <th key={col.id} className="p-2 text-center" title={col.name}>
                      <span className="text-base">{col.logo}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/20">
                {state.teams.map(row => (
                  <tr key={row.id}>
                    <td className="p-2 font-serif text-amber-100 font-semibold whitespace-nowrap">
                      {row.logo} {row.name}
                    </td>
                    {state.teams.map(col => {
                      if (row.id === col.id) {
                        return <td key={col.id} className="p-2 text-center bg-[#050814]/80 text-amber-900/50 font-mono">—</td>;
                      }
                      const h2h = state.matches.filter(
                        m => m.stage === 'LEAGUE' && m.status === 'COMPLETED' &&
                        ((m.teamAId === row.id && m.teamBId === col.id) || (m.teamAId === col.id && m.teamBId === row.id))
                      );
                      if (h2h.length === 0) {
                        return <td key={col.id} className="p-2 text-center text-amber-500/30 font-mono">·</td>;
                      }
                      return (
                        <td key={col.id} className="p-2 text-center font-mono">
                          <div className="flex flex-col gap-0.5 items-center">
                            {h2h.map(m => {
                              const sRow = m.teamAId === row.id ? (m.scoreA ?? 0) : (m.scoreB ?? 0);
                              const sCol = m.teamAId === row.id ? (m.scoreB ?? 0) : (m.scoreA ?? 0);
                              const cls = sRow > sCol ? 'text-emerald-300 bg-emerald-500/15' : sRow < sCol ? 'text-red-300 bg-red-500/15' : 'text-amber-300 bg-amber-500/15';
                              return (
                                <span key={m.id} className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${cls}`}>
                                  {sRow}–{sCol}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : viewTab === 'TABLE' ? (
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
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 mb-2 border-b border-dashed border-amber-900/30">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500/70">
                Tiebreaker: <span className="text-amber-300">{activePreset.label}</span>
              </span>
              {role === 'ADMIN' && (
                <select
                  value={tiebreakerMode}
                  onChange={e => setTiebreakerMode(e.target.value)}
                  className="bg-[#050814] border border-amber-900/50 rounded-lg px-2.5 py-1 text-[11px] font-mono text-amber-200 focus:outline-none focus:border-amber-500"
                  title="Select standings tiebreaker order"
                >
                  {TIEBREAKER_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              )}
            </div>
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
                    <th className={colBase + ' px-2.5 hidden md:table-cell'}>Form</th>
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
                        <td className="px-2.5 hidden md:table-cell">
                          <div className="flex items-center justify-end gap-1">
                            {(row.form || []).map((res, i) => (
                              <span
                                key={i}
                                className={`w-4 h-4 rounded text-[9px] font-mono font-bold flex items-center justify-center ${
                                  res === 'W' ? 'bg-emerald-500/20 text-emerald-300' :
                                  res === 'D' ? 'bg-amber-500/20 text-amber-300' :
                                                'bg-red-500/20 text-red-300'
                                }`}
                              >
                                {res}
                              </span>
                            ))}
                          </div>
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
              <Target className="w-4 h-4 text-emerald-400" /> Golden Boot (Top 10 Scorers)
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
              <Zap className="w-4 h-4 text-amber-400" /> Crown Architects (Top 10 Assists)
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
              <Shield className="w-4 h-4 text-cyan-400" /> Golden Glove (Top 10 Keepers & Defenders)
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
              <Star className="w-4 h-4 text-purple-400" /> Grand Valuations (Top 10 Match Ratings)
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
