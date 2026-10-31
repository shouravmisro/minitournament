import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import PlayerProfileModal from './PlayerProfileModal';
import { X, Crown, Users, Calendar, Shield, Target, Zap } from 'lucide-react';

const POS_BADGE = {
  GK: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
  DEF: 'bg-blue-500/20   text-blue-300   border border-blue-500/40',
  MID: 'bg-green-500/20  text-green-300  border border-green-500/40',
  FWD: 'bg-red-500/20    text-red-300    border border-red-500/40',
  FLEX: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
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
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-start justify-center p-4 pt-8 overflow-y-auto"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl mb-8">

          {/* Color banner */}
          <div
            className="h-24 relative"
            style={{ background: `linear-gradient(135deg, ${team.primaryColor}40 0%, ${team.primaryColor}15 100%)` }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-white bg-gray-900/60 p-1.5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Team badge overlapping */}
            <div
              className="absolute -bottom-7 left-5 w-16 h-16 rounded-2xl border-4 flex items-center justify-center text-3xl"
              style={{
                background: team.primaryColor + '30',
                borderColor: team.primaryColor + '60',
              }}
            >
              {team.logo}
            </div>
          </div>

          {/* Name + motto */}
          <div className="px-5 pt-10 pb-4">
            <h2 className="text-2xl font-black text-white">{team.name}</h2>
            {team.motto && (
              <p className="text-sm text-gray-400 italic mt-0.5">"{team.motto}"</p>
            )}
            {captain && (
              <p className="text-sm text-amber-400 flex items-center gap-1.5 mt-1">
                <Crown className="w-3.5 h-3.5" /> Captain: <span className="font-semibold">{captain.name}</span>
              </p>
            )}
          </div>

          {/* Match stats */}
          <div className="mx-5 mb-4 grid grid-cols-6 gap-1.5 bg-gray-800/60 rounded-xl p-3">
            {[
              { label: 'P', value: completed.length },
              { label: 'W', value: wins },
              { label: 'D', value: draws },
              { label: 'L', value: losses },
              { label: 'GF', value: gf },
              { label: 'GA', value: ga },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-lg font-black text-white">{s.value}</div>
                <div className="text-[9px] text-gray-500 font-semibold tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Roster */}
          <div className="px-5 pb-5 space-y-2">
            <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
              <Users className="w-4 h-4" /> Squad
              <span className="bg-gray-800 text-gray-400 text-xs px-1.5 py-0.5 rounded-full">{roster.length}</span>
            </h3>
            {roster.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No players drafted yet.</p>
            ) : (
              roster.map(p => (
                <button
                  key={p.id}
                  onClick={() => setViewPlayer(p)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-800/50 border border-gray-700/50 hover:border-gray-500 rounded-xl text-left transition-colors group"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: team.primaryColor + '25' }}
                  >
                    {p.jerseyNumber ?? p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-blue-300">{p.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${POS_BADGE[p.position] ?? POS_BADGE.FLEX}`}>
                        {p.position}
                      </span>
                      {p.rawPositions?.filter(r => r !== 'ANY').map((rp, i) => (
                        <span key={i} className="text-[10px] px-1 py-0.5 rounded bg-gray-700 text-gray-400 font-mono">{rp}</span>
                      ))}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${p.availability === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-400' :
                      p.availability === 'INJURED' ? 'bg-red-500/10 text-red-400' :
                        'bg-yellow-500/10 text-yellow-400'
                    }`}>
                    {p.availability}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Match history */}
          {completed.length > 0 && (
            <div className="px-5 pb-5 space-y-2">
              <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Match History
              </h3>
              {completed.slice(-5).map(match => {
                const opp = match.teamAId === team.id ? match.teamBId : match.teamAId;
                const oppTeam = state.teams.find(t => t.id === opp);
                const myScore = match.teamAId === team.id ? match.scoreA : match.scoreB;
                const oppScore = match.teamAId === team.id ? match.scoreB : match.scoreA;
                const result = myScore > oppScore ? 'W' : myScore < oppScore ? 'L' : 'D';
                return (
                  <div key={match.id} className="flex items-center justify-between bg-gray-800/50 border border-gray-700/50 rounded-xl px-3 py-2">
                    <span className={`text-xs font-bold w-5 ${result === 'W' ? 'text-emerald-400' : result === 'L' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {result}
                    </span>
                    <span className="text-sm text-gray-300 flex-1 px-2 truncate">{oppTeam?.name ?? 'Unknown'}</span>
                    <span className="text-sm font-bold text-white">{myScore} – {oppScore}</span>
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

