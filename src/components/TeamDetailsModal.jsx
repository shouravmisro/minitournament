import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import PlayerProfileModal from './PlayerProfileModal';
import { X, Crown, Users, Calendar, Shield, Target, Zap } from 'lucide-react';

const POS_BADGE = {
  GK:   'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  DEF:  'bg-blue-500/10   text-blue-400   border border-blue-500/30',
  MID:  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
  FWD:  'bg-red-500/10    text-red-400    border border-red-500/30',
  FLEX: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
};

export default function TeamDetailsModal({ team, onClose }) {
  const { state } = useTournament();
  const captain = state.captains.find(c => c.id === team.captainId);
  const roster = state.players.filter(p => p.teamId === team.id);
  const [viewPlayer, setViewPlayer] = useState(null);

  const matches = state.matches.filter(m =>
    (m.teamAId === team.id || m.teamBId === team.id)
  );
  const completed = matches.filter(m => m.status === 'COMPLETED');
  const wins = completed.filter(m =>
    (m.teamAId === team.id && m.scoreA > m.scoreB) ||
    (m.teamBId === team.id && m.scoreB > m.scoreA)
  ).length;
  const draws = completed.filter(m => m.scoreA === m.scoreB).length;
  const losses = completed.length - wins - draws;
  const gf = completed.reduce((s, m) => s + (m.teamAId === team.id ? (m.scoreA ?? 0) : (m.scoreB ?? 0)), 0);
  const ga = completed.reduce((s, m) => s + (m.teamAId === team.id ? (m.scoreB ?? 0) : (m.scoreA ?? 0)), 0);

  return (
    <>
      <div
        className="fixed inset-0 bg-[#050814]/85 backdrop-blur-md z-[100] flex items-start justify-center p-4 pt-8 overflow-y-auto"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="sketch-border bg-[#0b132b] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl mb-8">

          {/* Color banner */}
          <div
            className="h-28 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${team.primaryColor}50 0%, ${team.primaryColor}15 100%)` }}
          >
            {team.photo && (
              <img
                src={team.photo}
                alt={team.name}
                className="w-full h-full object-cover absolute inset-0 opacity-40 mix-blend-luminosity"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b132b] via-transparent to-transparent" />

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-amber-500/60 hover:text-amber-200 bg-[#050814]/70 p-1.5 rounded-lg z-10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Team badge overlapping */}
            <div
              className="absolute -bottom-7 left-5 w-16 h-16 rounded-2xl border border-amber-500/60 flex items-center justify-center text-3xl z-10 shadow-[0_0_15px_rgba(217,119,6,0.2)] bg-[#050814]"
              style={{
                borderColor: team.primaryColor || '#d97706',
              }}
            >
              {team.logo}
            </div>
          </div>

          {/* Name + motto */}
          <div className="px-5 pt-10 pb-4">
            <h2 className="text-2xl font-serif font-bold text-amber-100">{team.name}</h2>
            {team.motto && (
              <p className="text-xs font-serif text-amber-500/60 italic mt-0.5">"{team.motto}"</p>
            )}
            {captain && (
              <p className="text-xs font-mono uppercase tracking-widest text-cyan-400/90 flex items-center gap-1.5 mt-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" /> Leader: <span className="font-bold text-amber-200">{captain.name}</span>
              </p>
            )}
          </div>

          {/* Match stats */}
          <div className="mx-5 mb-4 grid grid-cols-6 gap-1 bg-[#050814]/50 border border-amber-900/30 rounded-xl p-2.5">
            {[
              { label: 'P', value: completed.length },
              { label: 'W', value: wins },
              { label: 'D', value: draws },
              { label: 'L', value: losses },
              { label: 'GF', value: gf },
              { label: 'GA', value: ga },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-base font-mono font-bold text-amber-200">{s.value}</div>
                <div className="text-[9px] font-mono uppercase text-amber-500/50 tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Squad Photo if provided */}
          {team.photo && (
            <div className="mx-5 mb-4 rounded-xl overflow-hidden border border-amber-500/30 shadow-md relative h-40 bg-[#050814]">
              <img
                src={team.photo}
                alt={`${team.name} Squad`}
                className="w-full h-full object-cover"
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050814]/90 via-transparent to-transparent flex items-end p-2.5">
                <span className="text-[11px] font-serif font-bold text-amber-200 drop-shadow">
                  📸 Official Squad Scroll
                </span>
              </div>
            </div>
          )}

          {/* Roster */}
          <div className="px-5 pb-5 space-y-2 border-t border-dashed border-amber-900/30 pt-3">
            <h3 className="text-xs font-mono tracking-widest uppercase text-amber-500/70 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" /> Faction Warriors
              <span className="bg-amber-950/40 border border-amber-900/50 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-full">{roster.length}</span>
            </h3>
            {roster.length === 0 ? (
              <p className="text-xs font-serif text-amber-500/40 text-center py-4">No warriors enlisted yet.</p>
            ) : (
              roster.map(p => (
                <button
                  key={p.id}
                  onClick={() => setViewPlayer(p)}
                  className="w-full flex items-center gap-3 px-3 py-2 bg-[#050814]/60 border border-amber-900/20 hover:border-amber-700/40 rounded-xl text-left transition-colors group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold text-amber-200 shrink-0 bg-[#0b132b] border border-amber-900/40"
                  >
                    {p.jerseyNumber ? `#${p.jerseyNumber}` : (p.name?.charAt(0) || 'W')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-serif font-semibold text-amber-100 truncate group-hover:text-amber-300 transition-colors">{p.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ${POS_BADGE[p.position] ?? POS_BADGE.FLEX}`}>
                        {p.position}
                      </span>
                      {p.rawPositions?.filter(r => r !== 'ANY').map((rp, i) => (
                        <span key={i} className="text-[9px] px-1 py-0.5 rounded bg-[#0b132b] text-amber-500/60 font-mono border border-amber-900/30">{rp}</span>
                      ))}
                    </div>
                  </div>
                  <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${
                    p.availability === 'AVAILABLE' ? 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30' :
                    p.availability === 'INJURED' ? 'bg-red-950/30 text-red-300 border-red-500/30' :
                    'bg-yellow-950/30 text-yellow-300 border-yellow-500/30'
                  }`}>
                    {p.availability}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Match history */}
          {completed.length > 0 && (
            <div className="px-5 pb-5 space-y-2 border-t border-dashed border-amber-900/30 pt-3">
              <h3 className="text-xs font-mono tracking-widest uppercase text-amber-500/70 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" /> Clash History
              </h3>
              {completed.slice(-5).map(match => {
                const opp = match.teamAId === team.id ? match.teamBId : match.teamAId;
                const oppTeam = state.teams.find(t => t.id === opp);
                const myScore = match.teamAId === team.id ? match.scoreA : match.scoreB;
                const oppScore = match.teamAId === team.id ? match.scoreB : match.scoreA;
                const result = myScore > oppScore ? 'W' : myScore < oppScore ? 'L' : 'D';
                return (
                  <div key={match.id} className="flex items-center justify-between bg-[#050814]/60 border border-amber-900/30 rounded-xl px-3 py-2 text-xs font-serif">
                    <span className={`font-mono font-bold w-5 ${result === 'W' ? 'text-emerald-400' : result === 'L' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {result}
                    </span>
                    <span className="text-amber-100/80 flex-1 px-2 truncate">{oppTeam?.name ?? 'Unknown'}</span>
                    <span className="font-mono text-amber-200 font-bold">{myScore} – {oppScore}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {viewPlayer && (
        <PlayerProfileModal player={viewPlayer} onClose={() => setViewPlayer(null)} />
      )}
    </>
  );
}
