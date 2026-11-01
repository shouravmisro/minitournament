import React from 'react';
import { useTournament } from '../context/TournamentContext';
import OrganizerProfile from './OrganizerProfile';
import { Trophy, Calendar, Shield, Users } from 'lucide-react';

export default function PublicHub() {
  const { state } = useTournament();
  const isEmpty = state.teams.length === 0 && state.players.length === 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Organizer Profile banner */}
      <OrganizerProfile editable={false} />

      {/* Empty state */}
      {isEmpty && (
        <div className="text-center py-16 sketch-border rounded-2xl flex flex-col items-center">
          <Trophy className="w-14 h-14 mx-auto mb-3 text-amber-900/40" />
          <p className="font-serif text-xl text-amber-200">The Arena Awaits Alignment</p>
          <p className="font-serif text-sm text-amber-500/60 mt-1">The grand organizers are assembling factions and champion scrolls.</p>
          <p className="text-[10px] font-mono tracking-widest uppercase text-amber-500/40 mt-2">
            Inspect <span className="text-amber-300">Warriors</span> &amp; <span className="text-amber-300">Factions</span> in the scrolls above.
          </p>
        </div>
      )}

      {/* Recent match results */}
      {state.matches.filter(m => m.status === 'COMPLETED').length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-dashed border-amber-900/40 pb-2.5">
            <h3 className="text-xl font-serif text-amber-200 flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-purple-400 stroke-[1.5]" /> Recent Clashes &amp; Chronicles
            </h3>
            <span className="text-[10px] font-mono tracking-widest uppercase text-amber-500/50">Historic Records</span>
          </div>
          
          <div className="space-y-2.5">
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
                    className="sketch-border bg-[#0b132b]/60 rounded-xl px-4 py-3 flex items-center gap-4 hover:bg-[#0b132b]/90 transition-all">
                    {/* Team A */}
                    <div className={`flex items-center gap-2.5 flex-1 min-w-0 ${aWon ? '' : 'opacity-60'}`}>
                      <span className="text-xl shrink-0 drop-shadow-[0_0_8px_rgba(217,119,6,0.2)]">{teamA?.logo ?? '🛡️'}</span>
                      <span className={`font-serif text-sm truncate ${aWon ? 'text-amber-100 font-bold' : 'text-amber-200/60'}`}>
                        {teamA?.name ?? 'TBD'}
                      </span>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-2.5 px-3 py-1 bg-[#050814]/70 border border-amber-900/40 rounded-lg shrink-0">
                      <span className={`font-mono text-lg font-bold ${aWon ? 'text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]' : 'text-amber-500/50'}`}>
                        {match.scoreA ?? 0}
                      </span>
                      <span className="text-amber-800 font-mono text-xs">–</span>
                      <span className={`font-mono text-lg font-bold ${bWon ? 'text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]' : 'text-amber-500/50'}`}>
                        {match.scoreB ?? 0}
                      </span>
                    </div>

                    {/* Team B */}
                    <div className={`flex items-center gap-2.5 flex-1 min-w-0 justify-end ${bWon ? '' : 'opacity-60'}`}>
                      <span className={`font-serif text-sm truncate text-right ${bWon ? 'text-amber-100 font-bold' : 'text-amber-200/60'}`}>
                        {teamB?.name ?? 'TBD'}
                      </span>
                      <span className="text-xl shrink-0 drop-shadow-[0_0_8px_rgba(217,119,6,0.2)]">{teamB?.logo ?? '🛡️'}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Awards showcase */}
      {state.awards.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-dashed border-amber-900/40 pb-2.5">
            <h3 className="text-xl font-serif text-amber-200 flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-amber-400 stroke-[1.5]" /> Hall of Relics
            </h3>
            <span className="text-[10px] font-mono tracking-widest uppercase text-amber-500/50">Imperial Accolades</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {state.awards.map(award => {
              const winner = state.players.find(p => p.id === award.winnerPlayerId);
              return (
                <div key={award.id}
                  className="sketch-border bg-[#0b132b]/60 rounded-xl p-4 text-center relative overflow-hidden group hover:bg-[#0b132b]/90 transition-all">
                  <div className="text-3xl mb-1.5 drop-shadow-[0_0_8px_rgba(251,191,36,0.2)]">{award.icon}</div>
                  <p className="font-serif text-sm text-amber-200 font-bold leading-tight">{award.title}</p>
                  {winner ? (
                    <div className="mt-2 pt-2 border-t border-dashed border-amber-900/30">
                      <p className="font-serif text-xs text-amber-100 font-semibold">{winner.name}</p>
                      {award.statNote && <p className="text-[10px] font-serif text-amber-500/50 italic mt-0.5">"{award.statNote}"</p>}
                    </div>
                  ) : (
                    <p className="text-[10px] font-mono tracking-widest uppercase text-amber-500/30 mt-2 pt-2 border-t border-dashed border-amber-900/30">Unclaimed</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick stats row (only if data exists) */}
      {!isEmpty && (
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { icon: Users,  label: 'Warriors Enlisted', value: state.players.length, color: 'text-cyan-400' },
            { icon: Shield, label: 'Factions Ordained', value: state.teams.length,   color: 'text-amber-300' },
            { icon: Trophy, label: 'Relics Forged',      value: state.awards.length,  color: 'text-emerald-400' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="sketch-border bg-[#0b132b]/50 rounded-xl p-4 text-center">
                <Icon className={`w-5 h-5 mx-auto mb-1.5 ${s.color}`} />
                <div className={`text-2xl font-mono font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] font-mono tracking-widest uppercase text-amber-500/50 mt-1">{s.label}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
