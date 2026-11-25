import React, { useState, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import {
  submitPlayerRegistration,
  withdrawPlayerRegistration,
  submitClaimRequest,
  withdrawClaimRequest,
  verifyPinAgainstState,
  generateJoinCode,
  isFirebaseConfigured,
} from '../services/firebase';
import ImageUploadButton from './ImageUploadButton';
import {
  X, UserPlus, LogIn, CheckCircle, Clock, AlertCircle,
  Trash2, Copy, Check, Users, Calendar, Coins, Link2, ShieldCheck
} from 'lucide-react';

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD', 'FLEX'];

export default function PlayerRegistrationModal({
  onClose,
  myRegistration,
  myClaimRequest = null,
  initialMode = 'REGISTER', // 'REGISTER' | 'CONNECT'
}) {
  const { state, tournamentId, isOwner, isCoAdmin, linkMemberUid } = useTournament();
  const { user, signInGoogle, login } = useAuth();

  const regSettings = state.registrationSettings || {};
  const joinCode = regSettings.joinCode || generateJoinCode(tournamentId);
  const maxPlayers = Number(regSettings.maxPlayers) || 0;
  const approvedCount = state.players.length;
  const isAtCapacity = maxPlayers > 0 && approvedCount >= maxPlayers;
  const deadlinePassed = Boolean(
    regSettings.deadline && new Date(`${regSettings.deadline}T23:59:59`).getTime() < Date.now()
  );

  const existingPlayer = user?.uid
    ? state.players.find(p => p.uid === user.uid)
    : null;
  const existingCaptain = user?.uid
    ? state.captains.find(c => c.uid === user.uid)
    : null;

  const unlinkedPlayers = state.players.filter(p => !p.uid);
  const unlinkedCaptains = state.captains.filter(c => !c.uid);

  const [mode, setMode] = useState(
    initialMode === 'CONNECT' || (!regSettings.enabled && (unlinkedPlayers.length > 0 || unlinkedCaptains.length > 0))
      ? 'CONNECT'
      : 'REGISTER'
  );

  // New Registration Form State
  const [form, setForm] = useState({
    name: '',
    position: 'FLEX',
    rawPositionsInput: '',
    jerseyNumber: '',
    avatar: '',
    bio: '',
    whatsapp: '',
    paymentRef: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Connect Existing Profile State
  const [claimRole, setClaimRole] = useState(unlinkedPlayers.length > 0 ? 'PLAYER' : 'CAPTAIN');
  const [claimTargetId, setClaimTargetId] = useState('');
  const [claimPin, setClaimPin] = useState('');
  const [forgotPin, setForgotPin] = useState(false);
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [claimSuccess, setClaimSuccess] = useState('');

  useEffect(() => {
    if (myRegistration) {
      setForm({
        name: myRegistration.name || user?.displayName || '',
        position: myRegistration.position || 'FLEX',
        rawPositionsInput: Array.isArray(myRegistration.rawPositions)
          ? myRegistration.rawPositions.filter(r => r !== 'ANY').join(', ')
          : '',
        jerseyNumber: myRegistration.jerseyNumber ?? '',
        avatar: myRegistration.avatar || user?.photoURL || '',
        bio: myRegistration.bio || '',
        whatsapp: myRegistration.whatsapp || '',
        paymentRef: myRegistration.paymentRef || '',
      });
    } else if (user) {
      setForm(f => ({
        ...f,
        name: f.name || user.displayName || '',
        avatar: f.avatar || user.photoURL || '',
      }));
    }
  }, [myRegistration, user]);

  function copyInviteLink() {
    const base = window.location.origin + window.location.pathname;
    const url = `${base}?t=${tournamentId}&join=1`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user?.uid) return;
    if (!form.name.trim()) {
      setError('Please enter your name.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const parsedRaw = (form.rawPositionsInput || '')
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(Boolean);

      const nextStatus = myRegistration?.status === 'WAITLIST' || isAtCapacity
        ? 'WAITLIST'
        : 'PENDING';

      const paymentRef = (form.paymentRef || '').trim();
      const paymentStatus = myRegistration?.paymentStatus === 'VERIFIED'
        ? 'VERIFIED'
        : (paymentRef ? 'SUBMITTED' : 'UNPAID');

      await submitPlayerRegistration(tournamentId, user.uid, {
        name: form.name.trim(),
        email: user.email || '',
        position: form.position || 'FLEX',
        rawPositions: parsedRaw.length > 0 ? parsedRaw : ['ANY'],
        jerseyNumber: form.jerseyNumber !== '' ? Number(form.jerseyNumber) : null,
        avatar: form.avatar || '',
        bio: (form.bio || '').trim(),
        whatsapp: (form.whatsapp || '').trim(),
        paymentRef,
        paymentStatus,
        status: nextStatus,
      });

      setSuccessMsg(
        nextStatus === 'WAITLIST'
          ? 'Added to the waitlist! You will be promoted if a spot opens.'
          : 'Registration submitted! Waiting for organizer approval.'
      );
    } catch (err) {
      setError(err?.message || 'Failed to submit registration.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdraw() {
    if (!user?.uid || withdrawing) return;
    setWithdrawing(true);
    setError('');
    try {
      await withdrawPlayerRegistration(tournamentId, user.uid);
      setSuccessMsg('Registration withdrawn.');
    } catch (err) {
      setError(err?.message || 'Could not withdraw registration.');
    } finally {
      setWithdrawing(false);
    }
  }

  async function handleConnectExisting(e) {
    e.preventDefault();
    if (!user?.uid || !claimTargetId || claimBusy) return;
    setClaimError('');
    setClaimSuccess('');

    const targetList = claimRole === 'CAPTAIN' ? unlinkedCaptains : unlinkedPlayers;
    const target = targetList.find(item => item.id === claimTargetId);
    if (!target) {
      setClaimError('Please select a valid roster profile.');
      return;
    }

    setClaimBusy(true);
    try {
      let pinVerified = false;
      if (!forgotPin) {
        if (claimPin.length !== 4) {
          setClaimError('Enter your 4-digit PIN, or check "I forgot my PIN".');
          setClaimBusy(false);
          return;
        }
        pinVerified = await verifyPinAgainstState(tournamentId, claimRole, target.id, claimPin, state);
        if (!pinVerified) {
          setClaimError('Incorrect 4-digit PIN for that profile.');
          setClaimBusy(false);
          return;
        }
      }

      // If current Google user is owner/co-admin or tournament is unowned, link immediately!
      if (isOwner || isCoAdmin || !state.ownerUid) {
        linkMemberUid({
          role: claimRole,
          entityId: target.id,
          uid: user.uid,
          email: user.email || '',
        });
        login(claimRole, target.id);
        setClaimSuccess(`Connected ${target.name} to your Google account! All stats & data preserved.`);
        return;
      }

      await submitClaimRequest(tournamentId, user.uid, {
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        targetRole: claimRole,
        targetId: target.id,
        targetName: target.name,
        pinVerified,
      });

      if (pinVerified) {
        login(claimRole, target.id);
        setClaimSuccess(
          `PIN verified! You are logged in as ${target.name}, and your Google link request has been queued for organizer confirmation.`
        );
      } else {
        setClaimSuccess(
          `Link request sent for ${target.name}. Once the organizer approves, you can sign in with 1 click!`
        );
      }
    } catch (err) {
      setClaimError(err?.message || 'Failed to submit profile link request.');
    } finally {
      setClaimBusy(false);
    }
  }

  const statusMeta = {
    PENDING:  { label: 'Pending Review', color: 'bg-amber-950/50 text-amber-300 border-amber-500/40', icon: Clock },
    WAITLIST: { label: 'Waitlisted',     color: 'bg-purple-950/50 text-purple-300 border-purple-500/40', icon: Clock },
    APPROVED: { label: 'Approved',       color: 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40', icon: CheckCircle },
    REJECTED: { label: 'Declined',       color: 'bg-red-950/50 text-red-300 border-red-500/40', icon: AlertCircle },
  };

  const activeStatus = myRegistration?.status ? statusMeta[myRegistration.status] : null;
  const StatusIcon = activeStatus?.icon || Clock;

  const claimOptions = claimRole === 'CAPTAIN' ? unlinkedCaptains : unlinkedPlayers;

  return (
    <div className="fixed inset-0 bg-[#050814]/85 backdrop-blur-md z-[150] flex items-center justify-center p-3 sm:p-4">
      <div className="sketch-border bg-[#0b132b] rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-amber-50">
        {/* Header */}
        <div className="px-5 py-4 border-b border-dashed border-amber-900/40 bg-[#050814]/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">
              {mode === 'CONNECT' ? <Link2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-serif text-xl text-amber-200">
                {mode === 'CONNECT' ? 'Connect Existing Profile' : 'Player Registration'}
              </h3>
              <p className="text-[11px] font-mono uppercase tracking-wider text-amber-500/60">
                {state.organizer?.name || 'Tournament'} • Code: <span className="text-amber-300 font-bold">{joinCode}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-amber-500/60 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        {(unlinkedPlayers.length > 0 || unlinkedCaptains.length > 0) && !existingPlayer && !existingCaptain && (
          <div className="px-5 pt-3 shrink-0">
            <div className="flex gap-1.5 p-1 bg-[#050814] rounded-xl border border-amber-900/40">
              <button
                type="button"
                onClick={() => setMode('CONNECT')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-serif font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  mode === 'CONNECT'
                    ? 'bg-emerald-950/60 text-emerald-200 border border-emerald-500/40'
                    : 'text-amber-500/60 hover:text-amber-200'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" /> Already on Roster
              </button>
              <button
                type="button"
                onClick={() => setMode('REGISTER')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-serif font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  mode === 'REGISTER'
                    ? 'bg-cyan-950/60 text-cyan-200 border border-cyan-500/40'
                    : 'text-amber-500/60 hover:text-amber-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> New Player
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!isFirebaseConfigured() ? (
            <p className="text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-xl p-3">
              Cloud sync is not configured. Connect Firebase in Admin Settings to enable online accounts &amp; registrations.
            </p>
          ) : !user ? (
            <div className="bg-[#050814]/80 border border-amber-500/30 rounded-xl p-5 text-center space-y-3">
              <p className="text-sm font-serif text-amber-100">
                Sign in with your Google account to {mode === 'CONNECT' ? 'connect your existing roster profile' : 'register as a player'}.
              </p>
              <button
                type="button"
                onClick={() => signInGoogle().catch(() => {})}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
              >
                <LogIn className="w-4 h-4" /> Sign in with Google
              </button>
            </div>
          ) : (existingPlayer || existingCaptain) ? (
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-5 text-center space-y-3">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
              <div>
                <p className="font-serif text-lg text-emerald-200 font-bold">Google Account Connected!</p>
                <p className="text-xs text-emerald-300/80 mt-0.5">
                  Linked as <strong>{(existingCaptain || existingPlayer).name}</strong>
                </p>
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                {existingPlayer && (
                  <button
                    type="button"
                    onClick={() => { login('PLAYER', existingPlayer.id); onClose(); }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  >
                    Open Warrior Scroll
                  </button>
                )}
                {existingCaptain && (
                  <button
                    type="button"
                    onClick={() => { login('CAPTAIN', existingCaptain.id); onClose(); }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
                  >
                    Open Faction Leader
                  </button>
                )}
              </div>
            </div>
          ) : mode === 'CONNECT' ? (
            /* ── CONNECT EXISTING ROSTER PROFILE ── */
            <div className="space-y-4">
              <div className="bg-emerald-950/25 border border-emerald-500/30 rounded-xl p-3.5 text-xs text-emerald-200/90 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Keep Your Existing Profile &amp; Stats
                </p>
                <p className="text-emerald-200/75">
                  Already listed in this tournament? Link your Google ID ({user.email}) directly to your existing profile — no duplicate registration needed.
                </p>
              </div>

              {myClaimRequest && myClaimRequest.status === 'PENDING' && (
                <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3.5 flex items-start justify-between gap-2 text-xs text-amber-200">
                  <div>
                    <p className="font-mono uppercase text-[11px] font-bold">
                      Link Request Pending: {myClaimRequest.targetName} ({myClaimRequest.targetRole})
                    </p>
                    <p className="mt-1 opacity-80">
                      {myClaimRequest.pinVerified
                        ? 'PIN Verified ✓ — waiting for organizer confirmation to finalize your Google link.'
                        : 'Waiting for organizer approval.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => withdrawClaimRequest(tournamentId, user.uid)}
                    className="text-red-300 hover:text-red-200 px-2 py-1 rounded bg-red-950/50 border border-red-500/30 shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <form onSubmit={handleConnectExisting} className="space-y-3.5">
                {unlinkedCaptains.length > 0 && unlinkedPlayers.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'PLAYER', label: `Player (${unlinkedPlayers.length})` },
                      { id: 'CAPTAIN', label: `Captain (${unlinkedCaptains.length})` },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => { setClaimRole(opt.id); setClaimTargetId(''); setClaimError(''); }}
                        className={`py-2 rounded-xl text-xs font-mono uppercase border transition-colors ${
                          claimRole === opt.id
                            ? 'bg-amber-900/40 text-amber-200 border-amber-500/50'
                            : 'bg-[#050814] text-amber-500/60 border-amber-900/40'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-amber-500/70">
                    Select Your Existing {claimRole === 'CAPTAIN' ? 'Captain' : 'Player'} Profile
                  </label>
                  <select
                    value={claimTargetId}
                    onChange={e => { setClaimTargetId(e.target.value); setClaimError(''); }}
                    required
                    className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2.5 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose your name ({claimOptions.length} unlinked) --</option>
                    {claimOptions.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} {item.position ? `(${item.position})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {!forgotPin && (
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-amber-500/70">
                      Your Existing 4-Digit PIN
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={claimPin}
                      onChange={e => { setClaimPin(e.target.value.replace(/\D/g, '')); setClaimError(''); }}
                      placeholder="••••"
                      className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-center text-xl tracking-[0.4em] font-mono text-amber-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 text-xs text-amber-300/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forgotPin}
                    onChange={e => { setForgotPin(e.target.checked); setClaimError(''); }}
                    className="rounded border-amber-700 bg-[#050814] text-amber-500"
                  />
                  <span>I forgot my 4-digit PIN (send request for organizer approval)</span>
                </label>

                {claimError && <p className="text-xs text-red-400">{claimError}</p>}
                {claimSuccess && <p className="text-xs text-emerald-300">{claimSuccess}</p>}

                <div className="flex gap-2.5 pt-2 border-t border-dashed border-amber-900/30">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl bg-[#050814] border border-amber-900/40 text-amber-300 text-xs font-serif"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={claimBusy || !claimTargetId || (!forgotPin && claimPin.length !== 4)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors"
                  >
                    {claimBusy ? 'Connecting…' : 'Connect Google Profile'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* ── NEW PLAYER REGISTRATION ── */
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="bg-[#050814]/70 border border-amber-900/30 rounded-xl p-2.5">
                  <p className="text-[10px] font-mono uppercase text-amber-500/60 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Capacity
                  </p>
                  <p className="text-sm font-mono font-bold text-amber-200 mt-0.5">
                    {maxPlayers > 0 ? `${approvedCount} / ${maxPlayers}` : `${approvedCount} Joined`}
                  </p>
                </div>
                {regSettings.deadline && (
                  <div className="bg-[#050814]/70 border border-amber-900/30 rounded-xl p-2.5">
                    <p className="text-[10px] font-mono uppercase text-amber-500/60 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Deadline
                    </p>
                    <p className="text-sm font-mono font-bold text-amber-200 mt-0.5">{regSettings.deadline}</p>
                  </div>
                )}
                <div className="bg-[#050814]/70 border border-amber-900/30 rounded-xl p-2.5">
                  <p className="text-[10px] font-mono uppercase text-amber-500/60 flex items-center gap-1">
                    <Coins className="w-3 h-3" /> Entry Fee
                  </p>
                  <p className="text-sm font-mono font-bold text-emerald-300 mt-0.5">
                    {regSettings.entryFee || 'Free'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 bg-[#050814]/60 border border-amber-900/30 rounded-xl px-3 py-2">
                <span className="text-xs font-mono text-amber-300">Invite Code: <strong>{joinCode}</strong></span>
                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-200 bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-500/30"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied Link!' : 'Copy Invite Link'}</span>
                </button>
              </div>

              {myRegistration && activeStatus && (
                <div className={`rounded-xl p-3.5 border flex items-start justify-between gap-3 ${activeStatus.color}`}>
                  <div className="flex items-start gap-2.5">
                    <StatusIcon className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-mono uppercase tracking-wider font-bold">
                        Application Status: {activeStatus.label}
                      </p>
                      {myRegistration.adminNote && (
                        <p className="text-xs mt-1 opacity-90">Note: {myRegistration.adminNote}</p>
                      )}
                      {regSettings.entryFee && (
                        <p className="text-[11px] font-mono mt-1 opacity-80">
                          Payment: {myRegistration.paymentStatus || 'UNPAID'}
                        </p>
                      )}
                    </div>
                  </div>
                  {(myRegistration.status === 'PENDING' || myRegistration.status === 'WAITLIST') &&
                    regSettings.allowSelfWithdraw !== false && (
                      <button
                        type="button"
                        onClick={handleWithdraw}
                        disabled={withdrawing}
                        className="text-xs px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/70 text-red-200 border border-red-500/40 flex items-center gap-1 shrink-0"
                      >
                        <Trash2 className="w-3 h-3" /> {withdrawing ? '…' : 'Withdraw'}
                      </button>
                    )}
                </div>
              )}

              {deadlinePassed && !myRegistration && (
                <p className="text-xs text-red-300 bg-red-950/40 border border-red-500/30 rounded-xl p-3">
                  The registration deadline ({regSettings.deadline}) has passed.
                </p>
              )}

              {isAtCapacity && !myRegistration && (
                <p className="text-xs text-purple-300 bg-purple-950/40 border border-purple-500/30 rounded-xl p-3">
                  Tournament capacity ({maxPlayers} players) is full. Submitting now places you on the <strong>Waitlist</strong>.
                </p>
              )}

              {regSettings.paymentInstructions && (
                <div className="bg-[#050814]/80 border border-amber-900/40 rounded-xl p-3 text-xs text-amber-200/90">
                  <p className="font-mono uppercase text-[10px] text-amber-400 mb-1">Payment Instructions</p>
                  <p className="whitespace-pre-wrap">{regSettings.paymentInstructions}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="flex items-center gap-3 bg-[#050814]/60 border border-amber-900/30 rounded-xl p-3">
                  {form.avatar ? (
                    <img src={form.avatar} alt="" className="w-12 h-12 rounded-xl object-cover border border-amber-500/40 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#0b132b] border border-amber-900/50 flex items-center justify-center font-serif font-bold text-amber-300 shrink-0">
                      {(form.name || 'P')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <ImageUploadButton
                      storagePath={`tournaments/${tournamentId}/avatars`}
                      label="Upload Player Photo"
                      onUploaded={(url) => setForm(f => ({ ...f, avatar: url }))}
                    />
                    <p className="text-[10px] text-amber-500/50">Compressed automatically for fast loading.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-amber-500/70">Full Name *</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Your name"
                      required
                      className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-amber-500/70">WhatsApp / Phone</label>
                    <input
                      value={form.whatsapp}
                      onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                      placeholder="+880..."
                      className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-amber-500/70">Primary Position</label>
                    <select
                      value={form.position}
                      onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                      className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
                    >
                      {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-amber-500/70">Sub-Positions</label>
                    <input
                      value={form.rawPositionsInput}
                      onChange={e => setForm(f => ({ ...f, rawPositionsInput: e.target.value }))}
                      placeholder="CM, ATM"
                      className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-amber-500/70">Jersey #</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={form.jerseyNumber}
                      onChange={e => setForm(f => ({ ...f, jerseyNumber: e.target.value }))}
                      placeholder="10"
                      className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-amber-500/70">Short Bio / Playstyle</label>
                  <input
                    value={form.bio}
                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="e.g. Box-to-box midfielder, high stamina"
                    className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {regSettings.entryFee && (
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-amber-500/70">
                      Payment Transaction ID / Reference (optional now)
                    </label>
                    <input
                      value={form.paymentRef}
                      onChange={e => setForm(f => ({ ...f, paymentRef: e.target.value }))}
                      placeholder="e.g. bKash TrxID 9X8A7..."
                      className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-sm text-amber-100 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                {error && <p className="text-xs text-red-400">{error}</p>}
                {successMsg && <p className="text-xs text-emerald-300">{successMsg}</p>}

                <div className="flex gap-2.5 pt-2 border-t border-dashed border-amber-900/30">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl bg-[#050814] border border-amber-900/40 text-amber-300 text-xs font-serif"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || (deadlinePassed && !myRegistration)}
                    className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors"
                  >
                    {submitting
                      ? 'Submitting…'
                      : myRegistration
                        ? 'Update Application'
                        : isAtCapacity
                          ? 'Join Waitlist'
                          : 'Submit Registration'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
