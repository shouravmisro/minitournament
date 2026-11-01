import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import { useGlobal, useOrganizer } from '../context/GlobalContext';
import {
  Trophy, Shield, Users, User, Menu, X, LogOut, Lock,
  Crown, Home, ChevronLeft, Settings, Share2, Check
} from 'lucide-react';
import { isFirebaseConfigured } from '../services/firebase';

export default function Navbar() {
  const { state }                      = useTournament();
  const { role, logout, login }        = useAuth();
  const { global, deselectTournament } = useGlobal();
  const { organizer }                  = useOrganizer();

  const [menuOpen,        setMenuOpen]        = useState(false);
  const [pinModal,        setPinModal]        = useState(null);
  const [pinInput,        setPinInput]        = useState('');
  const [pinError,        setPinError]        = useState('');
  const [selectList,      setSelectList]      = useState(null);
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [copiedShare,     setCopiedShare]     = useState(false);

  async function handleShare() {
    const tournamentId = global.activeTournamentId || 't_mvwya9yi';
    const base = window.location.origin + window.location.pathname;
    const url = `${base}?t=${tournamentId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: tournamentName,
          text: `Follow ${tournamentName} live fixtures, scores and standings!`,
          url,
        });
        return;
      } catch {}
    }
    navigator.clipboard.writeText(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  }

  const roleBadge = {
    PUBLIC:  { label: 'Public Hub',    icon: Home,   color: 'bg-[#0b132b] text-amber-200/80 border border-amber-900/40' },
    ADMIN:   { label: 'Admin Council', icon: Shield, color: 'bg-red-950/40 text-red-300 border border-red-500/30' },
    CAPTAIN: { label: 'Faction Leader',icon: Crown,  color: 'bg-amber-950/40 text-amber-300 border border-amber-500/30' },
    PLAYER:  { label: 'Warrior Scroll',icon: User,   color: 'bg-cyan-950/40 text-cyan-300 border border-cyan-500/30' },
  };

  const current = roleBadge[role];
  const RoleIcon = current.icon;

  // Active tournament meta
  const activeTournament = global.tournaments.find(t => t.id === global.activeTournamentId);
  const tournamentName   = activeTournament?.name || state.organizer?.name || 'Mini Tournament';
  const hasCloud = isFirebaseConfigured();

  function handlePinSubmit(targetRole, entityId = null) {
    setPinError('');
    if (targetRole === 'ADMIN') {
      if (pinInput === state.adminPin) { login('ADMIN'); closePinModal(); }
      else setPinError('Invalid Admin PIN');
    } else if (targetRole === 'CAPTAIN') {
      const caps = Array.isArray(state?.captains) ? state.captains : [];
      const cap = caps.find(c => c.id === entityId);
      if (cap && pinInput === cap.pin) { login('CAPTAIN', cap.id); closePinModal(); }
      else setPinError('Invalid Captain PIN');
    } else if (targetRole === 'PLAYER') {
      const plrs = Array.isArray(state?.players) ? state.players : [];
      const plr = plrs.find(p => p.id === entityId);
      if (plr && pinInput === plr.pin) { login('PLAYER', plr.id); closePinModal(); }
      else setPinError('Invalid Player PIN');
    }
  }

  function closePinModal() {
    setPinModal(null);
    setPinInput('');
    setPinError('');
    setSelectList(null);
    setSelectedEntityId(null);
  }

  function openRoleLogin(targetRole) {
    setMenuOpen(false);
    if (targetRole === 'PUBLIC') { login('PUBLIC'); return; }
    if (targetRole === 'ADMIN')  { setPinModal('ADMIN'); return; }
    if (targetRole === 'CAPTAIN') {
      setSelectList({ role: 'CAPTAIN', items: Array.isArray(state?.captains) ? state.captains : [] });
      setPinModal('CAPTAIN');
      return;
    }
    if (targetRole === 'PLAYER') {
      setSelectList({ role: 'PLAYER', items: Array.isArray(state?.players) ? state.players : [] });
      setPinModal('PLAYER');
      return;
    }
  }

  function handleBack() {
    setMenuOpen(false);
    logout();             // reset auth role to PUBLIC before leaving
    deselectTournament();
  }

  return (
    <>
      {/* ── Navbar ── */}
      <nav className="bg-[#050814]/90 backdrop-blur-md border-b border-amber-900/40 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">

          {/* Left: Back + Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={handleBack}
              title="All Tournaments"
              className="flex items-center gap-1 text-amber-500/70 hover:text-amber-300 transition-colors shrink-0 p-1.5 rounded-lg hover:bg-amber-950/30"
            >
              <ChevronLeft className="w-5 h-5 text-amber-500" />
              <span className="hidden sm:inline font-mono tracking-widest uppercase text-[10px] text-amber-500/70">Arenas</span>
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg border border-amber-500/40 flex items-center justify-center bg-[#0b132b] shadow-[0_0_10px_rgba(217,119,6,0.2)] shrink-0">
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="font-serif font-bold text-amber-100 text-sm sm:text-base truncate leading-tight">
                  {tournamentName}
                </p>
                {organizer.name && (
                  <p className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60 truncate leading-tight">{organizer.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Centre: Role Badge */}
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono tracking-wider uppercase ${current.color} shrink-0 shadow-sm`}>
            <RoleIcon className="w-3.5 h-3.5" />
            <span>{current.label}</span>
          </div>

          {/* Right: Cloud Sync Pill + Logout + Menu */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Share Tournament Pill */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif bg-[#0b132b] text-amber-300 border border-amber-500/40 hover:bg-amber-900/30 transition-all shadow-[0_0_10px_rgba(217,119,6,0.1)]"
              title="Share live link to this tournament"
            >
              {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-400" />}
              <span className="text-[11px] font-mono tracking-wider uppercase">
                {copiedShare ? 'Copied' : 'Share'}
              </span>
            </button>

            {/* Live Cloud Status Indicator (read-only) */}
            {hasCloud && (
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-emerald-950/30 text-emerald-300 border border-emerald-500/30 select-none cursor-default"
                title="Live Cloud Sync Active"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-[10px] tracking-widest uppercase">Live</span>
              </div>
            )}

            {role !== 'PUBLIC' && (
              <button
                onClick={logout}
                className="text-amber-500/60 hover:text-amber-300 p-2 rounded-lg hover:bg-amber-950/40 border border-transparent hover:border-amber-900/40 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-amber-500/70 hover:text-amber-200 p-2 rounded-lg hover:bg-amber-950/40 border border-transparent hover:border-amber-900/40 transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile role badge */}
        <div className="sm:hidden px-4 pb-2.5 flex items-center justify-between border-t border-dashed border-amber-900/30 pt-2">
          <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono tracking-wider uppercase ${current.color}`}>
            <RoleIcon className="w-3 h-3" />
            <span>{current.label}</span>
          </div>

          {hasCloud && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-emerald-400 select-none cursor-default">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Realm</span>
            </div>
          )}
        </div>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="border-t border-dashed border-amber-900/40 bg-[#050814]/95 px-4 py-3 space-y-1.5 backdrop-blur-md">
            <p className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60 px-3 pb-1">Ordain Faction Role</p>
            {(['PUBLIC', 'PLAYER', 'CAPTAIN', 'ADMIN']).map(r => {
              const badge  = roleBadge[r];
              const BIcon  = badge.icon;
              const isActive = role === r;
              return (
                <button
                  key={r}
                  onClick={() => openRoleLogin(r)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-serif text-sm transition-all ${
                    isActive ? 'bg-amber-900/40 text-amber-200 border border-amber-500/40 shadow-[0_0_10px_rgba(217,119,6,0.2)]' : 'text-amber-100/70 hover:bg-[#0b132b] hover:text-amber-200 border border-transparent'
                  }`}
                >
                  <BIcon className="w-4 h-4 text-amber-400" />
                  <span>{badge.label}</span>
                  {r !== 'PUBLIC' && <Lock className="w-3 h-3 ml-auto text-amber-600/60" />}
                </button>
              );
            })}
            <div className="border-t border-dashed border-amber-900/30 my-2" />
            <button
              onClick={handleBack}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-serif text-sm text-amber-400/70 hover:bg-[#0b132b] hover:text-amber-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-amber-500" />
              <span>Back to All Tournaments</span>
            </button>
          </div>
        )}
      </nav>

      {/* ── PIN Modal ── */}
      {pinModal && (
        <div className="fixed inset-0 bg-[#050814]/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="sketch-border bg-[#0b132b] rounded-2xl w-full max-w-sm p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-dashed border-amber-900/40 pb-3">
              <h3 className="text-xl font-serif text-amber-200 flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                {pinModal === 'ADMIN' ? 'Council Cipher' : pinModal === 'CAPTAIN' ? 'Leader Cipher' : 'Warrior Cipher'}
              </h3>
              <button onClick={closePinModal} className="text-amber-500/60 hover:text-amber-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Entity selector */}
            {selectList && (
              <div className="space-y-2">
                <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/70">Select your name:</label>
                {(!selectList.items || selectList.items.length === 0) ? (
                  <p className="text-xs font-serif text-amber-300 bg-amber-950/40 p-3 rounded-xl border border-amber-500/30">
                    No {selectList.role === 'CAPTAIN' ? 'captains' : 'warriors'} registered in this arena yet.
                  </p>
                ) : (
                  <select
                    value={selectedEntityId || ''}
                    onChange={e => setSelectedEntityId(e.target.value)}
                    className="w-full bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-amber-100 font-serif text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose from roster ({selectList.items.length}) --</option>
                    {selectList.items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} {item.position ? `(${item.position})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* PIN input */}
            <form onSubmit={e => { e.preventDefault(); handlePinSubmit(pinModal, selectedEntityId); }} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/70">Enter 4-Digit Cipher:</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  placeholder="••••"
                  autoFocus
                  className="w-full mt-1.5 bg-[#050814] border border-amber-900/60 rounded-xl px-4 py-2.5 text-amber-200 text-center text-2xl tracking-[0.4em] font-mono focus:outline-none focus:border-amber-500 shadow-inner"
                />
              </div>

              {pinError && (
                <p className="text-xs font-mono text-red-400 text-center uppercase tracking-wider">{pinError}</p>
              )}

              <div className="flex gap-2 pt-2 border-t border-dashed border-amber-900/30">
                <button
                  type="button"
                  onClick={closePinModal}
                  className="flex-1 py-2 rounded-xl bg-[#050814] border border-amber-900/30 text-amber-500/70 hover:text-amber-200 text-xs font-serif transition-colors"
                >
                  Withdraw
                </button>
                <button
                  type="submit"
                  disabled={pinInput.length !== 4 || (selectList && !selectedEntityId)}
                  className="flex-1 py-2 rounded-xl bg-amber-600/40 hover:bg-amber-600/60 border border-amber-500/50 disabled:opacity-40 text-amber-100 text-xs font-serif font-bold shadow-[0_0_12px_rgba(217,119,6,0.2)] transition-all"
                >
                  Authenticate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
