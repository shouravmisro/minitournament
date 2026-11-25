import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import { useGlobal, useOrganizer } from '../context/GlobalContext';
import {
  Trophy, Shield, Users, User, Menu, X, LogOut, Lock,
  Crown, Home, ChevronLeft, Share2, Check, LogIn, Sparkles, AlertTriangle
} from 'lucide-react';
import { isFirebaseConfigured, verifyPinAgainstState, submitClaimRequest } from '../services/firebase';

export default function Navbar() {
  const { state, tournamentId, isOwner, isCoAdmin, canWriteCloud, linkMemberUid } = useTournament();
  const { user, signInGoogle, signOutUser, role, logout, login } = useAuth();
  const { global, deselectTournament } = useGlobal();
  const { organizer } = useOrganizer();

  const [menuOpen,         setMenuOpen]         = useState(false);
  const [pinModal,         setPinModal]         = useState(null);
  const [pinInput,         setPinInput]         = useState('');
  const [pinError,         setPinError]         = useState('');
  const [pinDisabledMsg,   setPinDisabledMsg]   = useState('');
  const [selectList,       setSelectList]       = useState(null);
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [linkGoogleOnPin,  setLinkGoogleOnPin]  = useState(true);
  const [copiedShare,      setCopiedShare]      = useState(false);
  const [signingIn,        setSigningIn]        = useState(false);

  const activeTournament = global.tournaments.find(t => t.id === global.activeTournamentId);
  const tournamentName   = activeTournament?.name || state.organizer?.name || 'Mini Tournament';
  const hasCloud = isFirebaseConfigured();

  // Check if current Google user is directly linked to a role in this tournament
  const linkedCaptain = user?.uid
    ? (state?.captains || []).find(c => c.uid === user.uid)
    : null;
  const linkedPlayer = user?.uid
    ? (state?.players || []).find(p => p.uid === user.uid)
    : null;
  const isGoogleAdmin = Boolean(isOwner || isCoAdmin);

  async function handleShare() {
    const tid = global.activeTournamentId || 't_mvwya9yi';
    const base = window.location.origin + window.location.pathname;
    const url = `${base}?t=${tid}`;
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

  async function handleGoogleSignIn() {
    setSigningIn(true);
    try {
      await signInGoogle();
    } catch {
      // Error surfaced via AuthContext if needed
    } finally {
      setSigningIn(false);
    }
  }

  const roleBadge = {
    PUBLIC:  { label: 'Public Hub',     icon: Home,   color: 'bg-[#0b132b] text-amber-200/80 border border-amber-900/40' },
    ADMIN:   { label: 'Admin Council',  icon: Shield, color: 'bg-red-950/40 text-red-300 border border-red-500/30' },
    CAPTAIN: { label: 'Faction Leader', icon: Crown,  color: 'bg-amber-950/40 text-amber-300 border border-amber-500/30' },
    PLAYER:  { label: 'Warrior Scroll', icon: User,   color: 'bg-cyan-950/40 text-cyan-300 border border-cyan-500/30' },
  };

  const current = roleBadge[role];
  const RoleIcon = current.icon;

  async function handlePinSubmit(targetRole, entityId = null) {
    setPinError('');
    if (state.allowGuestPinLogin === false) {
      setPinError('PIN login is disabled by the organizer.');
      return;
    }

    const ok = await verifyPinAgainstState(tournamentId, targetRole, entityId, pinInput, state);
    if (ok) {
      if ((targetRole === 'PLAYER' || targetRole === 'CAPTAIN') && user?.uid && linkGoogleOnPin && entityId) {
        const list = targetRole === 'CAPTAIN' ? (state?.captains || []) : (state?.players || []);
        const target = list.find(item => item.id === entityId);
        if (target && !target.uid) {
          if (isOwner || isCoAdmin || !state.ownerUid) {
            linkMemberUid({ role: targetRole, entityId, uid: user.uid, email: user.email || '' });
          } else if (hasCloud) {
            submitClaimRequest(tournamentId, user.uid, {
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
              targetRole,
              targetId: entityId,
              targetName: target.name,
              pinVerified: true,
            }).catch(() => {});
          }
        }
      }
      login(targetRole, entityId);
      closePinModal();
    } else {
      setPinError(
        targetRole === 'ADMIN'
          ? 'Invalid Admin PIN'
          : targetRole === 'CAPTAIN'
            ? 'Invalid Captain PIN'
            : 'Invalid Player PIN'
      );
    }
  }

  function closePinModal() {
    setPinModal(null);
    setPinInput('');
    setPinError('');
    setPinDisabledMsg('');
    setSelectList(null);
    setSelectedEntityId(null);
  }

  function openRoleLogin(targetRole) {
    setMenuOpen(false);
    setPinDisabledMsg('');

    if (targetRole === 'PUBLIC') {
      login('PUBLIC');
      return;
    }

    // 1-click Google-authenticated role entry
    if (targetRole === 'ADMIN' && isGoogleAdmin) {
      login('ADMIN');
      return;
    }
    if (targetRole === 'CAPTAIN' && linkedCaptain) {
      login('CAPTAIN', linkedCaptain.id);
      return;
    }
    if (targetRole === 'PLAYER' && linkedPlayer) {
      login('PLAYER', linkedPlayer.id);
      return;
    }

    if (state.allowGuestPinLogin === false) {
      setPinDisabledMsg(
        'Guest PIN login is turned off for this tournament. Sign in with an authorized Google account instead.'
      );
    }

    if (targetRole === 'ADMIN') {
      setPinModal('ADMIN');
      return;
    }
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
    logout();
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
                {(state.ownerName || organizer.name) && (
                  <p className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60 truncate leading-tight">
                    {state.ownerName || organizer.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Centre: Role Badge */}
          <div className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono tracking-wider uppercase ${current.color} shrink-0 shadow-sm`}>
            <RoleIcon className="w-3.5 h-3.5" />
            <span>{current.label}</span>
          </div>

          {/* Right: Google Account + Share + Cloud + Logout + Menu */}
          <div className="flex items-center gap-2 shrink-0">
            {hasCloud && (
              user ? (
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0b132b] border border-amber-900/40">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-amber-600/40 text-amber-200 text-[10px] font-bold flex items-center justify-center">
                      {(user.displayName || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-serif text-amber-100 max-w-[100px] truncate">{user.displayName}</span>
                </div>
              ) : (
                <button
                  onClick={handleGoogleSignIn}
                  disabled={signingIn}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif bg-amber-600/20 text-amber-200 border border-amber-500/40 hover:bg-amber-600/35 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5 text-amber-400" />
                  <span>{signingIn ? 'Signing in…' : 'Google Sign-In'}</span>
                </button>
              )
            )}

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif bg-[#0b132b] text-amber-300 border border-amber-500/40 hover:bg-amber-900/30 transition-all shadow-[0_0_10px_rgba(217,119,6,0.1)]"
              title="Share live link to this tournament"
            >
              {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-400" />}
              <span className="text-[11px] font-mono tracking-wider uppercase hidden sm:inline">
                {copiedShare ? 'Copied' : 'Share'}
              </span>
            </button>

            {hasCloud && (
              <div
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-emerald-950/30 text-emerald-300 border border-emerald-500/30 select-none cursor-default"
                title="Live Cloud Sync Active"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-[10px] tracking-widest uppercase">Live</span>
              </div>
            )}

            {role !== 'PUBLIC' && (
              <button
                onClick={() => logout()}
                className="text-amber-500/60 hover:text-amber-300 p-2 rounded-lg hover:bg-amber-950/40 border border-transparent hover:border-amber-900/40 transition-colors"
                title="Exit Role to Public Hub"
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
        <div className="md:hidden px-4 pb-2.5 flex items-center justify-between border-t border-dashed border-amber-900/30 pt-2">
          <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono tracking-wider uppercase ${current.color}`}>
            <RoleIcon className="w-3 h-3" />
            <span>{current.label}</span>
          </div>

          {hasCloud && (
            <div className="flex items-center gap-2">
              {user ? (
                <span className="text-[11px] font-serif text-amber-200/80 truncate max-w-[130px]">{user.displayName}</span>
              ) : (
                <button
                  onClick={handleGoogleSignIn}
                  disabled={signingIn}
                  className="text-[10px] font-mono uppercase tracking-wider text-amber-300 underline"
                >
                  {signingIn ? 'Signing in…' : 'Google Sign-In'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Cloud Write Notice for PIN-only / unauthenticated editors */}
        {hasCloud && role !== 'PUBLIC' && !canWriteCloud && (
          <div className="bg-amber-950/60 border-t border-amber-500/30 px-4 py-1.5 text-center text-[11px] font-serif text-amber-200 flex items-center justify-center gap-2 flex-wrap">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {user
                ? 'Your Google account is not linked as owner, co-admin, or member of this tournament — edits save locally only.'
                : 'Signed out of Google — edits save locally only. Sign in with an authorized Google account to sync to Cloud.'}
            </span>
          </div>
        )}

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="border-t border-dashed border-amber-900/40 bg-[#050814]/95 px-4 py-3 space-y-1.5 backdrop-blur-md">
            {hasCloud && (
              <div className="px-3.5 py-2 mb-2 rounded-xl bg-[#0b132b]/80 border border-amber-900/40 flex items-center justify-between gap-3">
                {user ? (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-amber-600/40 text-amber-200 text-xs font-bold flex items-center justify-center">
                          {(user.displayName || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-serif font-bold text-amber-100 truncate">{user.displayName}</p>
                        <p className="text-[10px] font-mono text-amber-500/60 truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); signOutUser(); }}
                      className="text-[10px] font-mono uppercase tracking-wider text-red-300 hover:text-red-200 px-2.5 py-1 rounded-lg border border-red-500/30 bg-red-950/30 shrink-0"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setMenuOpen(false); handleGoogleSignIn(); }}
                    className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-serif font-bold text-amber-200 hover:text-white"
                  >
                    <LogIn className="w-4 h-4 text-amber-400" />
                    Sign in with Google
                  </button>
                )}
              </div>
            )}

            <p className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60 px-3 pb-1">Ordain Faction Role</p>
            {(['PUBLIC', 'PLAYER', 'CAPTAIN', 'ADMIN']).map(r => {
              const badge    = roleBadge[r];
              const BIcon    = badge.icon;
              const isActive = role === r;
              const hasGoogleShortcut =
                (r === 'ADMIN' && isGoogleAdmin) ||
                (r === 'CAPTAIN' && Boolean(linkedCaptain)) ||
                (r === 'PLAYER' && Boolean(linkedPlayer));

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
                  {r !== 'PUBLIC' && (
                    hasGoogleShortcut ? (
                      <span className="ml-auto flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3" /> Google
                      </span>
                    ) : (
                      <Lock className="w-3 h-3 ml-auto text-amber-600/60" />
                    )
                  )}
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

      {/* ── PIN / Role Modal ── */}
      {pinModal && (
        <div className="fixed inset-0 bg-[#050814]/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="sketch-border bg-[#0b132b] rounded-2xl w-full max-w-sm p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-dashed border-amber-900/40 pb-3">
              <h3 className="text-xl font-serif text-amber-200 flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                {pinModal === 'ADMIN' ? 'Council Access' : pinModal === 'CAPTAIN' ? 'Leader Access' : 'Warrior Access'}
              </h3>
              <button onClick={closePinModal} className="text-amber-500/60 hover:text-amber-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {hasCloud && !user && (
              <div className="bg-[#050814]/80 border border-amber-500/30 rounded-xl p-3 space-y-2">
                <p className="text-xs font-serif text-amber-200/80">
                  Organizer, co-admin, or linked player? Sign in with Google to skip the PIN.
                </p>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={signingIn}
                  className="w-full py-2 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-100 text-xs font-serif font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {signingIn ? 'Signing in…' : 'Sign in with Google'}
                </button>
              </div>
            )}

            {pinDisabledMsg ? (
              <div className="space-y-3">
                <p className="text-xs font-serif text-red-300 bg-red-950/30 border border-red-500/30 rounded-xl p-3">
                  {pinDisabledMsg}
                </p>
                <button
                  type="button"
                  onClick={closePinModal}
                  className="w-full py-2 rounded-xl bg-[#050814] border border-amber-900/30 text-amber-300 text-xs font-serif"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
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

                  {user?.uid && (pinModal === 'PLAYER' || pinModal === 'CAPTAIN') && selectedEntityId && (() => {
                    const list = pinModal === 'CAPTAIN' ? (state?.captains || []) : (state?.players || []);
                    const chosen = list.find(item => item.id === selectedEntityId);
                    if (!chosen || chosen.uid) return null;
                    return (
                      <label className="flex items-center gap-2 text-xs text-emerald-300/90 bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={linkGoogleOnPin}
                          onChange={e => setLinkGoogleOnPin(e.target.checked)}
                          className="rounded border-emerald-600 bg-[#050814] text-emerald-500"
                        />
                        <span>Connect my Google account ({user.email}) for 1-click access next time</span>
                      </label>
                    );
                  })()}

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
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
