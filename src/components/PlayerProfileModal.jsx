import React from 'react';
import { useTournament } from '../context/TournamentContext';
import {
  X, Crown, Shield, Target, Zap, Calendar, Award,
  Heart, AlertTriangle, CircleDot, User, Star, Trophy
} from 'lucide-react';

const POS_BADGE = {
  GK: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
  DEF: 'bg-blue-500/20   text-blue-300   border border-blue-500/40',
  MID: 'bg-green-500/20  text-green-300  border border-green-500/40',
  FWD: 'bg-red-500/20    text-red-300    border border-red-500/40',
  FLEX: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
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
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* ── Top stripe (team color) ── */}
        <div
          className="h-1.5"
          style={{ background: team?.primaryColor ?? '#3B82F6' }}
        />

        {/* ── Header ── */}
        <div className="relative px-5 pt-5 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            {/* Avatar */}
            {player.avatar ? (
              <img
                src={player.avatar}
                alt={player.name}
                className="w-20 h-20 rounded-2xl object-cover border-2"
                style={{ borderColor: (team?.primaryColor ?? '#3B82F6') + '60' }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white border-2"
                style={{
                  background: (team?.primaryColor ?? '#3B82F6') + '25',
                  borderColor: (team?.primaryColor ?? '#3B82F6') + '50',
                }}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Name block */}
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white leading-tight">{player.name}</h2>
                {isCap && <Crown className="w-4 h-4 text-amber-400 shrink-0" />}
              </div>

              {player.jerseyNumber && (
                <p className="text-3xl font-black mt-0.5" style={{ color: team?.primaryColor ?? '#3B82F6' }}>
                  #{player.jerseyNumber}
                </p>
              )}

              {/* Position tags */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${POS_BADGE[player.position] ?? POS_BADGE.FLEX}`}>
                  {player.position}
                </span>
                {player.rawPositions?.filter(r => r !== 'ANY').map((rp, i) => (
                  <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-400 font-mono">
                    {rp}
                  </span>
                ))}
              </div>

              {/* Bio */}
              {player.bio && (
                <p className="text-xs text-gray-400 italic mt-2">"{player.bio}"</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Team info ── */}
        {team && (
          <div className="mx-5 mb-4 px-3 py-2.5 rounded-xl border flex items-center gap-3"
            style={{ background: (team.primaryColor ?? '#3B82F6') + '12', borderColor: (team.primaryColor ?? '#3B82F6') + '30' }}>
            <span className="text-2xl">{team.logo}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{team.name}</p>
              {team.motto && <p className="text-xs text-gray-400 italic truncate">"{team.motto}"</p>}
            </div>
            {captain && (
              <div className="text-right">
                <p className="text-[10px] text-amber-400 flex items-center gap-0.5 justify-end">
                  <Crown className="w-2.5 h-2.5" /> Captain
                </p>
                <p className="text-xs text-gray-300 font-medium">{captain.name}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Stats grid ── */}
        <div className="mx-5 mb-4 grid grid-cols-4 sm:grid-cols-7 gap-1.5">
          {[
            { label: 'MP', value: player.stats?.matches ?? 0, icon: Calendar },
            { label: 'G', value: player.stats?.goals ?? 0, icon: Target },
            { label: 'A', value: player.stats?.assists ?? 0, icon: Zap },
            { label: 'CS', value: player.stats?.cleanSheets ?? 0, icon: Shield },
            { label: 'Saves', value: player.stats?.saves ?? 0, icon: Shield },
            { label: 'Rating', value: player.stats?.avgRating ? `${player.stats.avgRating}★` : '–', icon: Star },
            { label: 'MVP', value: player.stats?.mvpCount ?? 0, icon: Trophy },
          ].map(s => (
            <div key={s.label} className="bg-gray-800 rounded-xl p-2 text-center">
              <s.icon className="w-3.5 h-3.5 text-gray-500 mx-auto mb-0.5" />
              <div className="text-base font-black text-white">{s.value}</div>
              <div className="text-[9px] text-gray-400 font-semibold tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Recent match ratings history ── */}
        {playerMatches.length > 0 && (
          <div className="mx-5 mb-4 space-y-1.5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Recent Match Ratings</p>
            <div className="space-y-1">
              {playerMatches.map(m => {
                const perf = m.playerPerformance.find(p => p.playerId === player.id);
                const oppTeamId = m.teamAId === player.teamId ? m.teamBId : m.teamAId;
                const oppTeam = teams.find(t => t.id === oppTeamId);
                return (
                  <div key={m.id} className="flex items-center justify-between text-xs bg-gray-800/60 px-2.5 py-1.5 rounded-lg">
                    <span className="text-gray-300 truncate">
                      vs {oppTeam?.logo} {oppTeam?.name || 'Opponent'}
                    </span>
                    <div className="flex items-center gap-2">
                      {perf?.cleanSheet && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-mono">
                          CS
                        </span>
                      )}
                      <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                        {perf?.rating ? `${perf.rating}★` : '–'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Availability ── */}
        <div className="mx-5 mb-4 flex items-center gap-2">
          {player.availability === 'AVAILABLE' && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full font-medium">
              <Heart className="w-3.5 h-3.5" /> Available
            </span>
          )}
          {player.availability === 'INJURED' && (
            <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full font-medium">
              <AlertTriangle className="w-3.5 h-3.5" /> Injured
            </span>
          )}
          {player.availability === 'DOUBTFUL' && (
            <span className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-full font-medium">
              <CircleDot className="w-3.5 h-3.5" /> Doubtful
            </span>
          )}
          <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium ${player.status === 'DRAFTED'
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-gray-700 text-gray-400'
            }`}>
            {player.status}
          </span>
        </div>

        {/* ── Awards ── */}
        {awards.length > 0 && (
          <div className="mx-5 mb-5 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Awards</p>
            <div className="grid grid-cols-2 gap-2">
              {awards.map(a => (
                <div key={a.id} className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="text-xl">{a.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-amber-300 leading-tight">{a.title}</p>
                    {a.statNote && <p className="text-[10px] text-gray-500">{a.statNote}</p>}
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
