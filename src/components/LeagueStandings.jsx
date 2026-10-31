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
  const colBase = 'text-right text-sm font-mono';

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
    <div className="space-y-4">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          League Table & Statistics
        </h2>

        <div className="flex bg-gray-800 p-1 rounded-xl border border-gray-700 text-xs">
          <button
            onClick={() => setViewTab('TABLE')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              viewTab === 'TABLE'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Standings Table
          </button>
          <button
            onClick={() => setViewTab('LEADERBOARD')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              viewTab === 'LEADERBOARD'
                ? 'bg-purple-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Player Leaderboards
          </button>
        </div>
      </div>

      {viewTab === 'TABLE' ? (
        !hasLeague || table.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-700 rounded-2xl text-gray-500">
            <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No league data yet. Generate fixtures and enter scores first.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left py-2 px-2 w-8">#</th>
                  <th className="text-left py-2 px-2">Team</th>
                  <th className={colBase + ' px-2'}>P</th>
                  <th className={colBase + ' px-2'}>W</th>
                  <th className={colBase + ' px-2'}>D</th>
                  <th className={colBase + ' px-2'}>L</th>
                  <th className={colBase + ' px-2 hidden sm:table-cell'}>GF</th>
                  <th className={colBase + ' px-2 hidden sm:table-cell'}>GA</th>
                  <th className={colBase + ' px-2'}>GD</th>
                  <th className={colBase + ' px-2 font-bold text-white'}>Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {table.map((row, idx) => {
                  const isTop = idx === 0;
                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-gray-800/40 ${
                        isTop ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-3 px-2">
                        <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          idx === 0 ? 'bg-amber-500 text-gray-900' :
                          idx === 1 ? 'bg-gray-500 text-white' :
                          idx === 2 ? 'bg-orange-700 text-white' :
                                      'text-gray-500'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>

                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{row.logo}</span>
                          <div>
                            <p className="font-semibold text-white text-sm leading-tight truncate max-w-[120px]">
                              {row.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className={colBase + ' px-2 text-gray-400'}>{row.P}</td>
                      <td className={colBase + ' px-2 text-emerald-400'}>{row.W}</td>
                      <td className={colBase + ' px-2 text-yellow-400'}>{row.D}</td>
                      <td className={colBase + ' px-2 text-red-400'}>{row.L}</td>
                      <td className={colBase + ' px-2 text-gray-400 hidden sm:table-cell'}>{row.GF}</td>
                      <td className={colBase + ' px-2 text-gray-400 hidden sm:table-cell'}>{row.GA}</td>
                      <td className={colBase + ' px-2 ' + (row.GD > 0 ? 'text-emerald-400' : row.GD < 0 ? 'text-red-400' : 'text-gray-400')}>
                        {row.GD > 0 ? '+' : ''}{row.GD}
                      </td>
                      <td className={colBase + ' px-2 font-black text-white text-base'}>{row.Pts}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 px-2 text-xs text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 1st Place
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-500" /> 2nd Place
              </span>
              <span className="ml-auto">P W D L GD Pts</span>
            </div>
          </div>
        )
      ) : (
        /* ── Player Stats Leaderboards View ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Golden Boot (Top Goals) */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-gray-800 pb-2">
              <Target className="w-4 h-4 text-emerald-400" /> Top Goal Scorers
            </h3>
            {topScorers.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No goals recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {topScorers.map((p, idx) => {
                  const team = state.teams.find(t => t.id === p.teamId);
                  return (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gray-500 w-4 font-bold">{idx + 1}.</span>
                        <span className="text-white font-semibold">{p.name}</span>
                        <span className="text-[11px] text-gray-400">{team?.logo}</span>
                      </div>
                      <span className="font-black text-emerald-400 font-mono text-sm">
                        {p.stats.goals} ⚽
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Playmaker Kings (Top Assists) */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-gray-800 pb-2">
              <Zap className="w-4 h-4 text-amber-400" /> Top Assists
            </h3>
            {topAssisters.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No assists recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {topAssisters.map((p, idx) => {
                  const team = state.teams.find(t => t.id === p.teamId);
                  return (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gray-500 w-4 font-bold">{idx + 1}.</span>
                        <span className="text-white font-semibold">{p.name}</span>
                        <span className="text-[11px] text-gray-400">{team?.logo}</span>
                      </div>
                      <span className="font-black text-amber-400 font-mono text-sm">
                        {p.stats.assists} ⚡
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Golden Glove (Clean Sheets & Saves) */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-gray-800 pb-2">
              <Shield className="w-4 h-4 text-yellow-400" /> Goalkeepers (Clean Sheets & Saves)
            </h3>
            {topGKs.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No goalkeeping stats recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {topGKs.map((p, idx) => {
                  const team = state.teams.find(t => t.id === p.teamId);
                  return (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gray-500 w-4 font-bold">{idx + 1}.</span>
                        <span className="text-white font-semibold">{p.name}</span>
                        <span className="text-[11px] text-gray-400">{team?.logo}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-emerald-400 font-bold">{p.stats?.cleanSheets || 0} CS</span>
                        <span className="text-gray-500">|</span>
                        <span className="text-yellow-400 font-bold">{p.stats?.saves || 0} sv</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Top Rated Players (MID / DEF / FWD) */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-gray-800 pb-2">
              <Star className="w-4 h-4 text-purple-400" /> Highest Match Ratings
            </h3>
            {topRated.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No match ratings recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {topRated.map((p, idx) => {
                  const team = state.teams.find(t => t.id === p.teamId);
                  return (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gray-500 w-4 font-bold">{idx + 1}.</span>
                        <span className="text-white font-semibold">{p.name}</span>
                        <span className="text-[10px] text-gray-400">({p.position})</span>
                        <span className="text-[11px] text-gray-400">{team?.logo}</span>
                      </div>
                      <span className="font-black text-purple-400 font-mono text-sm">
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
