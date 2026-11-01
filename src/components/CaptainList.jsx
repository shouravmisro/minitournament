import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import TeamDetailsModal from './TeamDetailsModal';
import { Crown, Users, Shield, ChevronRight } from 'lucide-react';

export default function CaptainList() {
  const { state } = useTournament();
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  const selectedTeam = state.teams.find(t => t.id === selectedTeamId);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Crown className="w-5 h-5 text-amber-400" />
        Captains &amp; Teams
        <span className="text-sm font-normal text-gray-500">({state.captains.length})</span>
      </h2>

      {state.captains.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border border-dashed border-gray-700 rounded-2xl">
          <Crown className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No captains yet. Use Quick Start in the Admin Panel.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {state.captains.map(cap => {
            const team = state.teams.find(t => t.id === cap.teamId);
            const rosterPlayers = team
              ? state.players.filter(p => p.teamId === team.id)
              : [];
            const available = rosterPlayers.filter(p => p.availability === 'AVAILABLE').length;

            // Win/draw/loss from matches
            const played = state.matches.filter(m =>
              (m.teamAId === team?.id || m.teamBId === team?.id) && m.status === 'COMPLETED'
            );
            const wins = played.filter(m =>
              (m.teamAId === team?.id && m.scoreA > m.scoreB) ||
              (m.teamBId === team?.id && m.scoreB > m.scoreA)
            ).length;
            const draws = played.filter(m => m.scoreA === m.scoreB).length;

            return (
              <button
                key={cap.id}
                onClick={() => setSelectedTeamId(team?.id ?? null)}
                className="w-full bg-gray-800/50 border border-gray-700 hover:border-gray-500 rounded-2xl p-4 text-left transition-all group"
              >
                <div className="flex items-center gap-4">
                  {/* Team badge / photo */}
                  {team?.photo ? (
                    <img
                      src={team.photo}
                      alt={team.name}
                      className="w-14 h-14 rounded-xl object-cover border-2 shrink-0 shadow-md"
                      style={{ borderColor: (team?.primaryColor ?? '#F59E0B') + '60' }}
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl border-2 shrink-0"
                      style={{
                        background: (team?.primaryColor ?? '#F59E0B') + '20',
                        borderColor: (team?.primaryColor ?? '#F59E0B') + '40',
                      }}
                    >
                      {team?.logo ?? '👤'}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white text-base truncate group-hover:text-amber-300 transition-colors">
                        {team?.name ?? 'Unnamed Team'}
                      </p>
                    </div>
                    <p className="text-sm text-amber-400 flex items-center gap-1 mt-0.5">
                      <Crown className="w-3.5 h-3.5" /> {cap.name}
                    </p>
                    {team?.motto && (
                      <p className="text-xs text-gray-500 italic mt-0.5 truncate">"{team.motto}"</p>
                    )}
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
                </div>

                {/* Footer stats row */}
                <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-700/50">
                  {[
                    { label: 'Squad', value: rosterPlayers.length },
                    { label: 'Available', value: available },
                    { label: 'Played', value: played.length },
                    { label: 'W / D', value: `${wins} / ${draws}` },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-base font-bold text-white">{s.value}</p>
                      <p className="text-[10px] text-gray-500">{s.label}</p>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Team Details Modal */}
      {selectedTeam && (
        <TeamDetailsModal
          team={selectedTeam}
          onClose={() => setSelectedTeamId(null)}
        />
      )}
    </div>
  );
}

