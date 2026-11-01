import React from 'react';
import { useTournament } from '../context/TournamentContext';
import { X, Crown, Shield, Activity, Target, Crosshair, Star, Hand, HeartPulse } from 'lucide-react';

const POSITION_COLORS = {
  GK:   'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  DEF:  'text-blue-400 border-blue-500/30 bg-blue-500/10',
  MID:  'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  FWD:  'text-red-400 border-red-500/30 bg-red-500/10',
  FLEX: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
};

export default function PlayerProfileModal({ player, team, captain, onClose }) {
  let contextState = null;
  try {
    const { state } = useTournament();
    contextState = state;
  } catch {}

  if (!player) return null;

  const effectiveTeam = team || (contextState?.teams?.find(t => t.id === player.teamId));
  const effectiveCaptain = captain || (effectiveTeam ? contextState?.captains?.find(c => c.id === effectiveTeam.captainId) : null);

  const stats = player.stats || {
    matches: 0, goals: 0, assists: 0, cleanSheets: 0, saves: 0, avgRating: 0, mvpCount: 0
  };

  const isImgUrl = player.avatar && (
    player.avatar.startsWith('http://') ||
    player.avatar.startsWith('https://') ||
    player.avatar.startsWith('data:image') ||
    player.avatar.startsWith('/')
  );

  return (
    <div
      className="fixed inset-0 bg-[#050814]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-[#0b132b] w-full max-w-sm relative overflow-hidden flex flex-col shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-amber-900/50 max-h-[92vh] overflow-y-auto scrollbar-none"
        style={{
          borderRadius: '2rem 0.5rem 2rem 0.5rem',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5), 0 10px 40px rgba(0,0,0,0.8)'
        }}
      >
        <div className="absolute inset-0 pointer-events-none rounded-[inherit] border border-dashed border-amber-900/30 m-1 z-20"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 bg-[#050814]/60 backdrop-blur text-amber-500/60 hover:text-amber-400 p-1.5 rounded-full border border-amber-900/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ─── Hero Image Section (Large Photo) ─── */}
        <div className="relative h-80 w-full bg-[#050814] border-b border-amber-900/50 shrink-0">
          {isImgUrl ? (
            <img
              src={player.avatar}
              alt={player.name}
              className="w-full h-full object-cover object-top"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : player.avatar ? (
            <div className="w-full h-full flex items-center justify-center bg-[#050814] text-7xl select-none">
              {player.avatar}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMGIxMzJiIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMxNzE0MzMiPjwvcmVjdD4KPC9zdmc+')]">
              <Shield className="w-32 h-32 text-amber-900/20 stroke-[1]" />
            </div>
          )}

          {/* Gradient Overlay for Text Visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b132b] via-[#0b132b]/40 to-transparent" />

          {/* Player Info Overlay */}
          <div className="absolute bottom-0 left-0 w-full p-6 pb-5 z-10">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-4xl font-serif font-black text-amber-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    #{player.jerseyNumber || '?'}
                  </span>
                  <h2 className="text-3xl font-serif text-amber-50 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate">
                    {player.name}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border backdrop-blur-sm ${POSITION_COLORS[player.position] || POSITION_COLORS.FLEX}`}>
                    {player.position}
                  </span>
                  {player.rawPositions?.filter(r => r !== 'ANY').map(rp => (
                    <span key={rp} className="text-[10px] font-mono text-amber-200/70 border border-amber-900/50 bg-[#050814]/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
                      {rp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Detailed Information Section ─── */}
        <div className="p-6 pt-5 space-y-6 relative z-10">

          {/* Bio / Quote */}
          {(player.bio || "Awaiting destiny in the Codex Arena.") && (
            <p className="font-serif italic text-amber-500/70 text-sm text-center px-4">
              "{player.bio || "Awaiting destiny in the Codex Arena."}"
            </p>
          )}

          {/* Faction Banner */}
          <div className="bg-[#050814]/60 border border-dashed border-amber-900/40 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-[#0b132b] border border-amber-700/30 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(217,119,6,0.15)] shrink-0">
                {effectiveTeam?.logo || '🛡️'}
              </div>
              <div className="min-w-0">
                <p className="font-serif text-amber-100 text-lg leading-tight truncate">
                  {effectiveTeam?.name || 'Mercenary (Undrafted)'}
                </p>
                {effectiveCaptain && (
                  <p className="text-[9px] font-mono text-cyan-400/80 uppercase tracking-widest flex items-center gap-1.5 mt-1 truncate">
                    <Crown className="w-3 h-3" /> Leader: {effectiveCaptain.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Codex Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'MP', value: stats.matches ?? 0, icon: Activity },
              { label: 'G', value: stats.goals ?? 0, icon: Target },
              { label: 'A', value: stats.assists ?? 0, icon: Crosshair },
              { label: 'MVP', value: stats.mvpCount ?? 0, icon: Star, color: 'text-purple-400' },
              { label: 'CS', value: stats.cleanSheets ?? 0, icon: Shield },
              { label: 'Saves', value: stats.saves ?? 0, icon: Hand },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="bg-[#050814]/40 border border-amber-900/20 rounded-lg flex flex-col items-center justify-center p-2.5 relative group hover:bg-[#050814]/80 transition-colors">
                  <Icon className="w-3.5 h-3.5 text-amber-900/40 absolute top-1.5 right-1.5" />
                  <span className={`font-mono text-xl font-bold ${stat.color || 'text-amber-300'}`}>{stat.value}</span>
                  <span className="font-mono text-[9px] text-amber-600 uppercase tracking-widest mt-1">{stat.label}</span>
                </div>
              );
            })}

            {/* Rating Box (Spans 2 columns) */}
            <div className="col-span-2 bg-[#050814]/40 border border-amber-900/20 rounded-lg flex flex-col items-center justify-center p-2.5 hover:bg-[#050814]/80 transition-colors">
              <span className="font-mono text-xl font-bold text-cyan-400">
                {stats.avgRating > 0 ? Number(stats.avgRating).toFixed(1) : '-'}
              </span>
              <span className="font-mono text-[9px] text-amber-600 uppercase tracking-widest mt-1">Rating</span>
            </div>
          </div>

          {/* Footer Badges */}
          <div className="flex items-center justify-between pt-2">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono tracking-widest uppercase shadow-sm ${
              player.availability === 'AVAILABLE' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-900/50 shadow-emerald-900/20' :
              player.availability === 'INJURED' ? 'bg-red-900/20 text-red-400 border-red-900/50 shadow-red-900/20' :
              'bg-yellow-900/20 text-yellow-400 border-yellow-900/50 shadow-yellow-900/20'
            }`}>
              {player.availability === 'AVAILABLE' ? <HeartPulse className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
              {player.availability === 'AVAILABLE' ? 'Combat Ready' : player.availability}
            </div>

            <div className={`inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-mono tracking-widest uppercase shadow-sm ${
              player.status === 'DRAFTED' ? 'bg-cyan-900/20 text-cyan-400 border-cyan-900/50 shadow-cyan-900/20' : 'bg-[#050814] text-amber-500/50 border-amber-900/40'
            }`}>
              {player.status}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
