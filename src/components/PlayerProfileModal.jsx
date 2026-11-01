import React from 'react';
import { useTournament } from '../context/TournamentContext';
import {
  X, Crown, Shield, Target, Zap, Calendar, Award,
  Heart, AlertTriangle, CircleDot, User, Star, Trophy
} from 'lucide-react';

const POS_BADGE = {
  GK:   'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  DEF:  'bg-blue-500/10   text-blue-400   border border-blue-500/30',
  MID:  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
  FWD:  'bg-red-500/10    text-red-400    border border-red-500/30',
  FLEX: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
};

export default function PlayerProfileModal({ player, onClose }) {
  const { state } = useTournament();

  if (!player) return null;

  const teams = state?.teams || [];
  const captains = state?.captains || [];
  const awardsList = state?.awards || [];
  const matchesList = state?.matches || [];

  const team = teams.find(t => t.id === player.teamId);
  const captain = team ? captains.find(c => c.id === team.captainId) : null;
  const awards = awardsList.filter(a => a.winnerPlayerId === player.id);
  const isCap = captains.some(c => c.name === player.name);

  // Recent match performances
  const playerMatches = matchesList
    .filter(m => m.status === 'COMPLETED' && Array.isArray(m.playerPerformance) && m.playerPerformance.some(p => p.playerId === player.id))
    .slice(-4)
    .reverse();

  return (
    <div
      className="fixed inset-0 bg-[#050814]/85 backdrop-blur-md z-[100] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="sketch-border bg-[#0b132b] rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* ── Top stripe (team color) ── */}
        <div
          className="h-1.5"
          style={{ background: team?.primaryColor ?? '#d97706' }}
        />

        {/* ── Header ── */}
        <div className="relative px-5 pt-5 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-amber-500/60 hover:text-amber-200 p-1.5 rounded-lg hover:bg-amber-950/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            {/* Avatar */}
            {player.avatar ? (
              player.avatar.startsWith('http') || player.avatar.startsWith('data:image') ? (
                <img
                  src={player.avatar}
                  alt={player.name}
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border border-amber-500/40 shadow-md shrink-0"
                  style={{ borderColor: (team?.primaryColor ?? '#d97706') + '80' }}
                />
              ) : (
                <div
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-4xl border border-amber-500/40 shadow-md shrink-0 bg-[#050814]"
                >
                  {player.avatar}
                </div>
              )
            ) : (
              <div
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl font-serif font-black text-amber-200 border border-amber-500/40 shadow-md shrink-0 bg-[#050814]"
              >
                {player.name ? player.name.charAt(0).toUpperCase() : 'W'}
              </div>
            )}

            {/* Name block */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-serif font-bold text-amber-100 leading-tight">{player.name}</h2>
                {isCap && <Crown className="w-4 h-4 text-amber-400 shrink-0" />}
              </div>

              {player.jerseyNumber && (
                <p className="text-2xl font-mono font-bold mt-0.5 text-amber-400">
                  #{player.jerseyNumber}
                </p>
              )}

              {/* Position tags */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className={`text-[9px] font-mono tracking-wider uppercase px-2 py-0.5 rounded border font-semibold ${POS_BADGE[player.position] ?? POS_BADGE.FLEX}`}>
                  {player.position}
                </span>
                {player.rawPositions?.filter(r => r !== 'ANY').map((rp, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-[#050814] text-amber-500/60 font-mono border border-amber-900/30">
                    {rp}
                  </span>
                ))}
              </div>

              {/* Bio */}
              {player.bio && (
                <p className="text-xs font-serif text-amber-500/60 italic mt-2">"{player.bio}"</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Team info ── */}
        {team && (
          <div className="mx-5 mb-4 px-3.5 py-2.5 rounded-xl border border-amber-900/30 bg-[#050814]/60 flex items-center gap-3">
            <span className="text-2xl">{team.logo}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-serif font-bold text-amber-100 truncate">{team.name}</p>
              {team.motto && <p className="text-xs font-serif text-amber-500/50 italic truncate">"{team.motto}"</p>}
            </div>
            {captain && (
              <div className="text-right">
                <p className="text-[9px] font-mono tracking-widest uppercase text-cyan-400 flex items-center gap-0.5 justify-end">
                  <Crown className="w-2.5 h-2.5 text-amber-400" /> Leader
                </p>
                <p className="text-xs font-serif text-amber-200 font-semibold">{captain.name}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Stats grid ── */}
        <div className="mx-5 mb-4 grid grid-cols-4 sm:grid-cols-7 gap-1 bg-[#050814]/50 border border-amber-900/30 rounded-xl p-2">
          {[
            { label: 'MP', value: player.stats?.matches ?? 0, icon: Calendar, color: 'text-amber-200' },
            { label: 'G', value: player.stats?.goals ?? 0, icon: Target, color: 'text-cyan-300' },
            { label: 'A', value: player.stats?.assists ?? 0, icon: Zap, color: 'text-emerald-300' },
            { label: 'CS', value: player.stats?.cleanSheets ?? 0, icon: Shield, color: 'text-purple-300' },
            { label: 'Saves', value: player.stats?.saves ?? 0, icon: Shield, color: 'text-blue-300' },
            { label: 'Rating', value: player.stats?.avgRating ? `${player.stats.avgRating}★` : '–', icon: Star, color: 'text-amber-400' },
            { label: 'MVP', value: player.stats?.mvpCount ?? 0, icon: Trophy, color: 'text-amber-300' },
          ].map(s => (
            <div key={s.label} className="bg-[#0b132b]/60 rounded-lg p-1.5 text-center border border-amber-900/20">
              <s.icon className="w-3 h-3 text-amber-500/50 mx-auto mb-0.5" />
              <div className={`text-sm font-mono font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[8px] font-mono tracking-wider uppercase text-amber-500/50">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Recent match ratings history ── */}
        {playerMatches.length > 0 && (
          <div className="mx-5 mb-4 space-y-1.5 border-t border-dashed border-amber-900/30 pt-3">
            <p className="text-[9px] font-mono tracking-widest uppercase text-amber-500/70">Recent Match Ratings</p>
            <div className="space-y-1">
              {playerMatches.map(m => {
                const perf = m.playerPerformance.find(p => p.playerId === player.id);
                const oppTeamId = m.teamAId === player.teamId ? m.teamBId : m.teamAId;
                const oppTeam = teams.find(t => t.id === oppTeamId);
                return (
                  <div key={m.id} className="flex items-center justify-between text-xs bg-[#050814]/70 border border-amber-900/20 px-2.5 py-1.5 rounded-lg font-serif">
                    <span className="text-amber-100/80 truncate">
                      vs {oppTeam?.logo} {oppTeam?.name || 'Opponent'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {perf?.cleanSheet && (
                        <span className="text-[9px] text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-1 py-0.2 rounded font-mono">
                          CS
                        </span>
                      )}
                      <span className="font-mono font-bold text-amber-300 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.2 rounded">
                        {perf?.rating ? `${perf.rating}★` : '–'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Availability & Status ── */}
        <div className="mx-5 mb-4 flex items-center justify-between border-t border-dashed border-amber-900/30 pt-3">
          {player.availability === 'AVAILABLE' && (
            <span className="flex items-center gap-1.5 text-xs font-serif text-emerald-300 bg-emerald-950/30 border border-emerald-500/30 px-3 py-1 rounded-full">
              <Heart className="w-3 h-3 text-emerald-400" /> Combat Ready
            </span>
          )}
          {player.availability === 'INJURED' && (
            <span className="flex items-center gap-1.5 text-xs font-serif text-red-300 bg-red-950/30 border border-red-500/30 px-3 py-1 rounded-full">
              <AlertTriangle className="w-3 h-3 text-red-400" /> Wounded
            </span>
          )}
          {player.availability === 'DOUBTFUL' && (
            <span className="flex items-center gap-1.5 text-xs font-serif text-yellow-300 bg-yellow-950/30 border border-yellow-500/30 px-3 py-1 rounded-full">
              <CircleDot className="w-3 h-3 text-yellow-400" /> Uncertain
            </span>
          )}
          <span className={`text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-full border ${
            player.status === 'DRAFTED'
              ? 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30'
              : 'bg-[#050814] text-amber-500/50 border-amber-900/30'
          }`}>
            {player.status}
          </span>
        </div>

        {/* ── Awards ── */}
        {awards.length > 0 && (
          <div className="mx-5 mb-5 space-y-2 border-t border-dashed border-amber-900/30 pt-3">
            <p className="text-[9px] font-mono tracking-widest uppercase text-amber-500/70">Imperial Accolades</p>
            <div className="grid grid-cols-2 gap-2">
              {awards.map(a => (
                <div key={a.id} className="bg-[#050814]/70 border border-amber-500/30 rounded-xl px-2.5 py-2 flex items-center gap-2">
                  <span className="text-lg">{a.icon}</span>
                  <div>
                    <p className="text-xs font-serif font-bold text-amber-200 leading-tight">{a.title}</p>
                    {a.statNote && <p className="text-[9px] font-serif text-amber-500/50 italic mt-0.5">"{a.statNote}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
