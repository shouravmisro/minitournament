import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import TeamDetailsModal from './TeamDetailsModal';
import { Crown, ChevronRight } from 'lucide-react';

export default function CaptainList() {
  const { state } = useTournament();
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  const selectedTeam = state.teams.find(t => t.id === selectedTeamId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between border-b border-dashed border-amber-900/40 pb-4">
        <h2 className="text-2xl font-serif text-amber-200 flex items-center gap-3">
          <Crown className="w-6 h-6 text-amber-500 stroke-[1.5]" />
          Faction Leaders
        </h2>
        <span className="text-xs font-mono tracking-widest text-amber-500/60 uppercase border border-amber-900/40 px-2 py-1 rounded bg-[#0b132b]/40">
          Total: {state.captains.length}
        </span>
      </div>

      {state.captains.length === 0 ? (
        <div className="text-center py-16 sketch-border rounded-2xl flex flex-col items-center">
          <Crown className="w-12 h-12 mb-3 text-amber-900/40" />
          <p className="font-serif text-amber-500/60 text-lg">No captains ordained yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.captains.map(cap => {
            const team = state.teams.find(t => t.id === cap.teamId);
            const rosterPlayers = team ? state.players.filter(p => p.teamId === team.id) : [];
            const available = rosterPlayers.filter(p => p.availability === 'AVAILABLE').length;

            const played = state.matches.filter(m => (m.teamAId === team?.id || m.teamBId === team?.id) && m.status === 'COMPLETED');
            const wins = played.filter(m => (m.teamAId === team?.id && m.scoreA > m.scoreB) || (m.teamBId === team?.id && m.scoreB > m.scoreA)).length;
            const draws = played.filter(m => m.scoreA === m.scoreB).length;

            return (
              <button
                key={cap.id}
                onClick={() => setSelectedTeamId(team?.id ?? null)}
                className="sketch-border w-full bg-[#0b132b]/60 p-5 text-left transition-all group hover:bg-[#0b132b]/90"
                style={{ borderRadius: '1.5rem 0.5rem 1.5rem 0.5rem' }}
              >
                <div className="flex items-start gap-4">
                  {team?.photo ? (
                    <img src={team.photo} alt={team.name} className="w-16 h-16 rounded-xl object-cover border border-amber-700/30 shrink-0" onError={e => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl border border-amber-700/30 shrink-0 bg-[#050814]/50 shadow-[0_0_15px_rgba(217,119,6,0.1)]">
                      {team?.logo ?? '👤'}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-serif font-bold text-amber-100 text-xl truncate group-hover:text-amber-400 transition-colors leading-none mb-1.5">
                      {team?.name ?? 'Unnamed Faction'}
                    </p>
                    <p className="text-xs font-mono text-cyan-400/80 uppercase tracking-widest flex items-center gap-1.5">
                      <Crown className="w-3 h-3" /> {cap.name}
                    </p>
                    {team?.motto && (
                      <p className="text-[11px] text-amber-500/50 italic mt-2 truncate font-serif">"{team.motto}"</p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-amber-700/50 group-hover:text-amber-400 transition-colors shrink-0" />
                </div>

                <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-dashed border-amber-900/30">
                  {[
                    { label: 'Squad', value: rosterPlayers.length, color: 'text-amber-200' },
                    { label: 'Avail', value: available, color: 'text-emerald-300' },
                    { label: 'Played', value: played.length, color: 'text-cyan-300' },
                    { label: 'W/D', value: `${wins}/${draws}`, color: 'text-purple-300' },
                  ].map(s => (
                    <div key={s.label} className="text-center bg-[#050814]/40 rounded p-1.5 border border-amber-900/20">
                      <p className={`text-base font-mono font-bold leading-none ${s.color}`}>{s.value}</p>
                      <p className="text-[9px] font-mono text-amber-500/50 uppercase tracking-widest mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedTeam && (
        <TeamDetailsModal team={selectedTeam} onClose={() => setSelectedTeamId(null)} />
      )}
    </div>
  );
}
