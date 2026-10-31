import React from 'react';
import { useTournament } from '../context/TournamentContext';
import OrganizerProfile from './OrganizerProfile';
import { Trophy, Calendar, Shield, Users } from 'lucide-react';

export default function PublicHub() {
  const { state } = useTournament();
  const isEmpty = state.teams.length === 0 && state.players.length === 0;

  return (
    <div className="space-y-6">
      {/* Organizer Profile banner */}
      <OrganizerProfile editable={false} />

      {/* Empty state */}
      {isEmpty && (
        <div className="text-center py-14 text-gray-500 border border-dashed border-gray-800 rounded-2xl">
          <Trophy className="w-14 h-14 mx-auto mb-3 opacity-25" />
          <p className="text-lg font-semibold text-gray-400">Tournament Setup In Progress</p>
          <p className="text-sm mt-1 text-gray-600">The organiser is setting up teams and players.</p>
          <p className="text-sm text-gray-700 mt-0.5">Use the <span className="text-amber-400 font-medium">Players</span> &amp; <span className="text-amber-400 font-medium">Teams</span> tabs to browse once ready.</p>
        </div>
      )}

      {/* Recent match results */}
      {state.matches.filter(m => m.status === 'COMPLETED').length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" /> Recent Results
          </h3>
          <div className="space-y-2">
            {state.matches
              .filter(m => m.status === 'COMPLETED')
              .slice(-5)
              .reverse()
              .map(match => {
                const teamA = state.teams.find(t => t.id === match.teamAId);
                const teamB = state.teams.find(t => t.id === match.teamBId);
                const aWon  = (match.scoreA ?? 0) > (match.scoreB ?? 0);
                const bWon  = (match.scoreB ?? 0) > (match.scoreA ?? 0);
                return (
                  <div key={match.id}
                    className="flex items-center bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 gap-3">
                    {/* Team A */}
                    <div className={`flex items-center gap-2 flex-1 min-w-0 ${aWon ? '' : 'opacity-60'}`}>
                      <span className="text-lg shrink-0">{teamA?.logo}</span>
                      <span className={`text-sm font-semibold truncate ${aWon ? 'text-white' : 'text-gray-400'}`}>
                        {teamA?.name ?? '?'}
                      </span>
                    </div>
                    {/* Score */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xl font-black ${aWon ? 'text-white' : 'text-gray-500'}`}>{match.scoreA ?? 0}</span>
                      <span className="text-gray-600 text-sm">–</span>
                      <span className={`text-xl font-black ${bWon ? 'text-white' : 'text-gray-500'}`}>{match.scoreB ?? 0}</span>
                    </div>
                    {/* Team B */}
                    <div className={`flex items-center gap-2 flex-1 min-w-0 justify-end ${bWon ? '' : 'opacity-60'}`}>
                      <span className={`text-sm font-semibold truncate ${bWon ? 'text-white' : 'text-gray-400'}`}>
                        {teamB?.name ?? '?'}
                      </span>
                      <span className="text-lg shrink-0">{teamB?.logo}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Awards showcase */}
      {state.awards.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" /> Trophy Room
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {state.awards.map(award => {
              const winner = state.players.find(p => p.id === award.winnerPlayerId);
              return (
                <div key={award.id}
                  className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-1.5">{award.icon}</div>
                  <p className="text-xs font-bold text-amber-300 leading-tight">{award.title}</p>
                  {winner && <p className="text-xs text-gray-400 mt-1 font-medium">{winner.name}</p>}
                  {award.statNote && <p className="text-[10px] text-gray-600 mt-0.5">{award.statNote}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick stats row (only if data exists) */}
      {!isEmpty && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Users,  label: 'Players', value: state.players.length,  color: 'text-blue-400' },
            { icon: Shield, label: 'Teams',   value: state.teams.length,    color: 'text-emerald-400' },
            { icon: Trophy, label: 'Awards',  value: state.awards.length,   color: 'text-amber-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 text-center">
              <s.icon className={`w-5 h-5 mx-auto mb-1.5 ${s.color}`} />
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs text-gray-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
