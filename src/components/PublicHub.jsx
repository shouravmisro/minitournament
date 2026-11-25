import React, { useState, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import OrganizerProfile from './OrganizerProfile';
import PlayerRegistrationModal from './PlayerRegistrationModal';
import { computeLeagueTable } from '../utils/standings';
import {
  subscribeMyRegistration,
  subscribeMyClaimRequest,
  subscribeTournamentVotes,
  castMatchVoteCloud,
  generateJoinCode,
  isFirebaseConfigured,
} from '../services/firebase';
import {
  Trophy, Calendar, Shield, Users, UserPlus, CheckCircle, Clock,
  Copy, Check, Link2, Share2, Flame
} from 'lucide-react';

export default function PublicHub() {
  const { state, tournamentId } = useTournament();
  const { user, login, signInGoogle } = useAuth();
  const isEmpty = state.teams.length === 0 && state.players.length === 0;

  const [regModalMode, setRegModalMode] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('join') === '1' ? 'REGISTER' : null;
    } catch {
      return null;
    }
  });
  const [myRegistration, setMyRegistration] = useState(null);
  const [myClaimRequest, setMyClaimRequest] = useState(null);
  const [votes, setVotes] = useState([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const regSettings = state.registrationSettings || {};
  const regEnabled = regSettings.enabled !== false;
  const joinCode = regSettings.joinCode || generateJoinCode(tournamentId);
  const maxPlayers = Number(regSettings.maxPlayers) || 0;
  const linkedPlayer = user?.uid ? state.players.find(p => p.uid === user.uid) : null;
  const linkedCaptain = user?.uid ? state.captains.find(c => c.uid === user.uid) : null;
  const hasUnlinkedRoster = state.players.some(p => !p.uid) || state.captains.some(c => !c.uid);

  useEffect(() => {
    if (!isFirebaseConfigured() || !tournamentId) return;
    const unsubVotes = subscribeTournamentVotes(tournamentId, setVotes);
    return () => unsubVotes();
  }, [tournamentId]);

  useEffect(() => {
    if (!isFirebaseConfigured() || !tournamentId || !user?.uid) {
      setMyRegistration(null);
      setMyClaimRequest(null);
      return;
    }
    const unsubReg = subscribeMyRegistration(tournamentId, user.uid, setMyRegistration);
    const unsubClaim = subscribeMyClaimRequest(tournamentId, user.uid, setMyClaimRequest);
    return () => {
      unsubReg();
      unsubClaim();
    };
  }, [tournamentId, user?.uid]);

  function copyInviteLink() {
    const base = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(`${base}?t=${tournamentId}&join=1`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function copyMatchdayDigest() {
    const table = computeLeagueTable(state.teams, state.matches, state.tiebreakerMode);
    const recent = state.matches.filter(m => m.status === 'COMPLETED').slice(-3).reverse();
    const lines = [
      `🏆 *${state.organizer?.name || 'Tournament Update'}*`,
      state.organizer?.venue ? `📍 ${state.organizer.venue}` : '',
      '',
      recent.length > 0 ? '⚽ *Latest Results:*' : '',
      ...recent.map(m => {
        const a = state.teams.find(t => t.id === m.teamAId);
        const b = state.teams.find(t => t.id === m.teamBId);
        return `• ${a?.name || 'Team A'} ${m.scoreA ?? 0} - ${m.scoreB ?? 0} ${b?.name || 'Team B'}`;
      }),
      '',
      table.length > 0 ? '📊 *Top Standings:*' : '',
      ...table.slice(0, 5).map((r, i) => `${i + 1}. ${r.name} — ${r.Pts} pts (GD ${r.GD >= 0 ? `+${r.GD}` : r.GD})`),
      '',
      `🔗 Live Hub: ${window.location.origin}${window.location.pathname}?t=${tournamentId}`,
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  }

  const upcomingMatches = state.matches
    .filter(m => m.status !== 'COMPLETED' && m.teamAId && m.teamBId)
    .slice(0, 4);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Organizer Profile banner */}
      <OrganizerProfile editable={false} />

      {/* Shareable Matchday Digest Bar */}
      {!isEmpty && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={copyMatchdayDigest}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0b132b] hover:bg-amber-950/40 border border-amber-500/35 text-xs font-mono text-amber-200 transition-colors"
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copiedSummary ? 'Copied WhatsApp Digest!' : 'Copy Shareable Matchday Digest'}</span>
          </button>
        </div>
      )}

      {/* Player Self-Registration & Existing Profile Link Callout */}
      {(regEnabled || myRegistration || myClaimRequest || linkedPlayer || linkedCaptain || hasUnlinkedRoster) && (
        <div className="sketch-border bg-gradient-to-r from-cyan-950/40 via-[#0b132b]/90 to-amber-950/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                Join Code: {joinCode}
              </span>
              {maxPlayers > 0 && (
                <span className="text-xs font-mono text-amber-300/80">
                  {state.players.length} / {maxPlayers} Spots Filled
                </span>
              )}
              {regSettings.entryFee && (
                <span className="text-xs font-mono text-emerald-300">
                  Fee: {regSettings.entryFee}
                </span>
              )}
            </div>

            <h3 className="font-serif text-lg sm:text-xl text-amber-100 font-bold">
              {linkedPlayer || linkedCaptain
                ? `Welcome, ${(linkedCaptain || linkedPlayer).name}! Your Google account is connected.`
                : myClaimRequest?.status === 'PENDING'
                  ? `Google Link Pending: ${myClaimRequest.targetName}`
                  : myRegistration
                    ? `Registration Status: ${myRegistration.status}`
                    : regEnabled
                      ? 'Join This Tournament or Connect Existing Profile'
                      : 'Connect Your Existing Roster Profile'}
            </h3>
            <p className="text-xs font-serif text-amber-200/70">
              {linkedPlayer || linkedCaptain
                ? 'Your stats, matches, and profile data are synced to your Google login.'
                : myClaimRequest?.status === 'PENDING'
                  ? 'Waiting for organizer confirmation to finalize linking your existing profile.'
                  : hasUnlinkedRoster
                    ? 'Already listed on the roster? Connect your Google account to keep all your existing stats & profile data.'
                    : 'Sign in with Google and submit your player profile to enter the draft pool.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap w-full sm:w-auto">
            <button
              type="button"
              onClick={copyInviteLink}
              className="px-3 py-2.5 rounded-xl bg-[#050814] border border-amber-900/40 text-amber-200 hover:text-white text-xs font-mono flex items-center gap-1.5"
              title="Copy registration invite link"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copiedCode ? 'Copied' : 'Invite'}</span>
            </button>

            {linkedPlayer || linkedCaptain ? (
              <div className="flex gap-2">
                {linkedPlayer && (
                  <button
                    type="button"
                    onClick={() => login('PLAYER', linkedPlayer.id)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-serif font-bold transition-colors shadow-lg"
                  >
                    <CheckCircle className="w-4 h-4" /> My Player Panel
                  </button>
                )}
                {linkedCaptain && (
                  <button
                    type="button"
                    onClick={() => login('CAPTAIN', linkedCaptain.id)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-serif font-bold transition-colors shadow-lg"
                  >
                    <CheckCircle className="w-4 h-4" /> My Team Panel
                  </button>
                )}
              </div>
            ) : (
              <>
                {hasUnlinkedRoster && (
                  <button
                    type="button"
                    onClick={() => setRegModalMode('CONNECT')}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-serif font-bold transition-colors shadow-lg"
                  >
                    <Link2 className="w-4 h-4" />
                    {myClaimRequest ? 'View Link Status' : 'Connect Google'}
                  </button>
                )}
                {regEnabled && (
                  <button
                    type="button"
                    onClick={() => setRegModalMode('REGISTER')}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-serif font-bold transition-colors shadow-lg"
                  >
                    {myRegistration ? <Clock className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {myRegistration ? 'View Application' : 'Register as Player'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="text-center py-16 sketch-border rounded-2xl flex flex-col items-center">
          <Trophy className="w-14 h-14 mx-auto mb-3 text-amber-900/40" />
          <p className="font-serif text-xl text-amber-200">Tournament Setup in Progress</p>
          <p className="font-serif text-sm text-amber-500/60 mt-1">Organizers are currently assembling teams and registering players.</p>
          <p className="text-[10px] font-mono tracking-widest uppercase text-amber-500/40 mt-2">
            Browse <span className="text-amber-300">Players</span> &amp; <span className="text-amber-300">Teams</span> in the navigation above.
          </p>
        </div>
      )}

      {/* Pre-Match Fan Prediction Polls */}
      {upcomingMatches.length > 0 && isFirebaseConfigured() && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-dashed border-amber-900/40 pb-2">
            <h3 className="text-lg sm:text-xl font-serif text-amber-200 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" /> Matchday Fan Predictions
            </h3>
            <span className="text-[10px] font-mono tracking-widest uppercase text-amber-500/50">Live Community Vote</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {upcomingMatches.map(match => {
              const teamA = state.teams.find(t => t.id === match.teamAId);
              const teamB = state.teams.find(t => t.id === match.teamBId);
              const mVotes = votes.filter(v => v.matchId === match.id);
              const total = mVotes.length;
              const cA = mVotes.filter(v => v.choice === 'A').length;
              const cD = mVotes.filter(v => v.choice === 'DRAW').length;
              const cB = mVotes.filter(v => v.choice === 'B').length;
              const myVote = user?.uid ? mVotes.find(v => v.uid === user.uid)?.choice : null;

              const pctA = total > 0 ? Math.round((cA / total) * 100) : 0;
              const pctD = total > 0 ? Math.round((cD / total) * 100) : 0;
              const pctB = total > 0 ? Math.round((cB / total) * 100) : 0;

              async function vote(choice) {
                if (!user?.uid) {
                  signInGoogle().catch(() => {});
                  return;
                }
                await castMatchVoteCloud(tournamentId, match.id, user.uid, choice);
              }

              return (
                <div key={match.id} className="sketch-border bg-[#0b132b]/70 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-serif">
                    <span className="font-bold text-amber-100 truncate">{teamA?.logo} {teamA?.name || 'TBD'}</span>
                    <span className="text-[10px] font-mono text-amber-500/60 px-2">vs</span>
                    <span className="font-bold text-amber-100 truncate text-right">{teamB?.name || 'TBD'} {teamB?.logo}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'A', label: teamA?.name?.split(' ')[0] || 'Team A', pct: pctA },
                      { id: 'DRAW', label: 'Draw', pct: pctD },
                      { id: 'B', label: teamB?.name?.split(' ')[0] || 'Team B', pct: pctB },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => vote(opt.id)}
                        className={`py-1.5 px-2 rounded-lg border text-[11px] font-mono transition-colors ${
                          myVote === opt.id
                            ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 font-bold'
                            : 'bg-[#050814]/80 border-amber-900/40 text-amber-200/80 hover:border-amber-500/50'
                        }`}
                      >
                        {opt.label} {total > 0 ? `(${opt.pct}%)` : ''}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] font-mono text-amber-500/50 text-center">
                    {total} vote{total !== 1 ? 's' : ''} {!user ? '• Sign in with Google to vote' : ''}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent match results */}
      {state.matches.filter(m => m.status === 'COMPLETED').length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-dashed border-amber-900/40 pb-2.5">
            <h3 className="text-xl font-serif text-amber-200 flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-purple-400 stroke-[1.5]" /> Recent Results
            </h3>
            <span className="text-[10px] font-mono tracking-widest uppercase text-amber-500/50">Latest Scores</span>
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
                    <div className={`flex items-center gap-2.5 flex-1 min-w-0 ${aWon ? '' : 'opacity-60'}`}>
                      <span className="text-xl shrink-0 drop-shadow-[0_0_8px_rgba(217,119,6,0.2)]">{teamA?.logo ?? '🛡️'}</span>
                      <span className={`font-serif text-sm truncate ${aWon ? 'text-amber-100 font-bold' : 'text-amber-200/60'}`}>
                        {teamA?.name ?? 'TBD'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 px-3 py-1 bg-[#050814]/70 border border-amber-900/40 rounded-lg shrink-0">
                      <span className={`font-mono text-lg font-bold ${aWon ? 'text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]' : 'text-amber-500/50'}`}>
                        {match.scoreA ?? 0}
                      </span>
                      <span className="text-amber-800 font-mono text-xs">–</span>
                      <span className={`font-mono text-lg font-bold ${bWon ? 'text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]' : 'text-amber-500/50'}`}>
                        {match.scoreB ?? 0}
                      </span>
                    </div>

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
              <Trophy className="w-5 h-5 text-amber-400 stroke-[1.5]" /> Tournament Awards
            </h3>
            <span className="text-[10px] font-mono tracking-widest uppercase text-amber-500/50">Honors</span>
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
                      {award.statNote && <p className="text-[10px] font-serif text-amber-500/50 italic mt-0.5">&quot;{award.statNote}&quot;</p>}
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

      {/* Quick stats row */}
      {!isEmpty && (
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { icon: Users,  label: 'Registered Players', value: state.players.length, color: 'text-cyan-400' },
            { icon: Shield, label: 'Participating Teams', value: state.teams.length,   color: 'text-amber-300' },
            { icon: Trophy, label: 'Awards',             value: state.awards.length,  color: 'text-emerald-400' },
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

      {regModalMode && (
        <PlayerRegistrationModal
          initialMode={regModalMode}
          onClose={() => setRegModalMode(null)}
          myRegistration={myRegistration}
          myClaimRequest={myClaimRequest}
        />
      )}
    </div>
  );
}
