import React, { useState } from 'react';
import { useTournament, generateId, generatePin } from '../context/TournamentContext';
import {
  updateRegistrationRecord,
  updateClaimRequestRecord,
  generateJoinCode,
  isFirebaseConfigured,
} from '../services/firebase';
import {
  UserPlus, Check, X, Clock, Copy, RefreshCw, Users,
  Coins, ShieldCheck, ArrowUpCircle, GitMerge, Phone, Link2
} from 'lucide-react';

export default function RegistrationQueuePanel({ registrations = [], claimRequests = [] }) {
  const {
    state,
    tournamentId,
    addPlayer,
    updatePlayer,
    updateRegistrationSettings,
    linkMemberUid,
  } = useTournament();

  const regSettings = state.registrationSettings || {};
  const joinCode = regSettings.joinCode || generateJoinCode(tournamentId);
  const maxPlayers = Number(regSettings.maxPlayers) || 0;

  const [tab, setTab] = useState('PENDING'); // PENDING | LINKS | WAITLIST | APPROVED | REJECTED
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [mergeTarget, setMergeTarget] = useState({}); // regUid -> playerId
  const [rejectNote, setRejectNote] = useState({});   // regUid -> note
  const [busyUid, setBusyUid] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  const pendingList  = registrations.filter(r => r.status === 'PENDING');
  const pendingClaims = claimRequests.filter(c => c.status === 'PENDING');
  const waitlistList = registrations.filter(r => r.status === 'WAITLIST');
  const approvedList = registrations.filter(r => r.status === 'APPROVED');
  const rejectedList = registrations.filter(r => r.status === 'REJECTED');

  const unlinkedPlayers = state.players.filter(p => !p.uid);
  const isAtCapacity = maxPlayers > 0 && state.players.length >= maxPlayers;
  const verifiedPaymentsCount = registrations.filter(r => r.paymentStatus === 'VERIFIED').length;

  function copyInviteLink() {
    const base = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(`${base}?t=${tournamentId}&join=1`);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  }

  async function handleApproveNew(reg) {
    setBusyUid(reg.uid);
    setActionMsg('');
    try {
      // Prevent duplicate player if uid already on roster
      const existing = state.players.find(p => p.uid === reg.uid);
      if (existing) {
        await updateRegistrationRecord(tournamentId, reg.uid, {
          status: 'APPROVED',
          linkedPlayerId: existing.id,
        });
        setActionMsg(`${reg.name} was already on the roster; marked Approved.`);
        return;
      }

      const newPlayer = {
        id: generateId('plr'),
        name: reg.name || 'Player',
        pin: generatePin(),
        uid: reg.uid,
        email: reg.email || '',
        position: reg.position || 'FLEX',
        rawPositions: Array.isArray(reg.rawPositions) && reg.rawPositions.length > 0 ? reg.rawPositions : ['ANY'],
        jerseyNumber: reg.jerseyNumber ?? null,
        avatar: reg.avatar || '',
        bio: reg.bio || '',
        status: 'UNDRAFTED',
        teamId: null,
        availability: 'AVAILABLE',
        paymentStatus: reg.paymentStatus || 'UNPAID',
        paymentRef: reg.paymentRef || '',
        stats: { matches: 0, goals: 0, assists: 0, cleanSheets: 0, saves: 0, avgRating: 0, mvpCount: 0 },
      };

      addPlayer(newPlayer);
      await updateRegistrationRecord(tournamentId, reg.uid, {
        status: 'APPROVED',
        linkedPlayerId: newPlayer.id,
        adminNote: '',
      });
      setActionMsg(`Approved ${reg.name} and added to the player pool.`);
    } finally {
      setBusyUid(null);
    }
  }

  async function handleMergeExisting(reg) {
    const targetPlayerId = mergeTarget[reg.uid];
    if (!targetPlayerId) return;
    const target = state.players.find(p => p.id === targetPlayerId);
    if (!target) return;

    setBusyUid(reg.uid);
    setActionMsg('');
    try {
      updatePlayer({
        ...target,
        uid: reg.uid,
        email: reg.email || target.email || '',
        avatar: target.avatar || reg.avatar || '',
        bio: target.bio || reg.bio || '',
        jerseyNumber: target.jerseyNumber ?? reg.jerseyNumber ?? null,
        paymentStatus: reg.paymentStatus || target.paymentStatus || 'UNPAID',
        paymentRef: reg.paymentRef || target.paymentRef || '',
      });

      await updateRegistrationRecord(tournamentId, reg.uid, {
        status: 'APPROVED',
        linkedPlayerId: target.id,
        adminNote: `Merged with ${target.name}`,
      });
      setActionMsg(`Merged ${reg.name} into existing player "${target.name}".`);
    } finally {
      setBusyUid(null);
    }
  }

  async function handleMoveWaitlist(reg) {
    setBusyUid(reg.uid);
    try {
      await updateRegistrationRecord(tournamentId, reg.uid, { status: 'WAITLIST' });
    } finally {
      setBusyUid(null);
    }
  }

  async function handlePromoteNextWaitlist() {
    if (waitlistList.length === 0) return;
    await handleApproveNew(waitlistList[0]);
  }

  async function handleReject(reg) {
    setBusyUid(reg.uid);
    try {
      await updateRegistrationRecord(tournamentId, reg.uid, {
        status: 'REJECTED',
        adminNote: (rejectNote[reg.uid] || '').trim(),
      });
    } finally {
      setBusyUid(null);
    }
  }

  async function handleCyclePayment(reg) {
    const order = ['UNPAID', 'SUBMITTED', 'VERIFIED'];
    const current = reg.paymentStatus || 'UNPAID';
    const next = order[(order.indexOf(current) + 1) % order.length];
    setBusyUid(reg.uid);
    try {
      await updateRegistrationRecord(tournamentId, reg.uid, { paymentStatus: next });
      if (reg.linkedPlayerId) {
        const linked = state.players.find(p => p.id === reg.linkedPlayerId);
        if (linked) updatePlayer({ ...linked, paymentStatus: next });
      }
    } finally {
      setBusyUid(null);
    }
  }

  async function handleApproveClaim(req) {
    setBusyUid(req.uid);
    setActionMsg('');
    try {
      linkMemberUid({
        role: req.targetRole,
        entityId: req.targetId,
        uid: req.uid,
        email: req.email || '',
      });
      await updateClaimRequestRecord(tournamentId, req.uid, { status: 'APPROVED' });
      setActionMsg(`Connected ${req.email || req.displayName} to ${req.targetName} (${req.targetRole}).`);
    } finally {
      setBusyUid(null);
    }
  }

  async function handleApproveAllVerifiedClaims() {
    const verified = pendingClaims.filter(c => c.pinVerified);
    if (verified.length === 0) return;
    setBusyUid('ALL_CLAIMS');
    setActionMsg('');
    try {
      for (const req of verified) {
        linkMemberUid({
          role: req.targetRole,
          entityId: req.targetId,
          uid: req.uid,
          email: req.email || '',
        });
        await updateClaimRequestRecord(tournamentId, req.uid, { status: 'APPROVED' });
      }
      setActionMsg(`Approved and connected ${verified.length} PIN-verified Google account(s).`);
    } finally {
      setBusyUid(null);
    }
  }

  async function handleDeclineClaim(req) {
    setBusyUid(req.uid);
    try {
      await updateClaimRequestRecord(tournamentId, req.uid, { status: 'REJECTED' });
    } finally {
      setBusyUid(null);
    }
  }

  const visibleList =
    tab === 'PENDING'  ? pendingList  :
    tab === 'WAITLIST' ? waitlistList :
    tab === 'APPROVED' ? approvedList :
                         rejectedList;

  return (
    <div className="space-y-4 sketch-border bg-[#0b132b]/70 rounded-2xl p-5 border-dashed border-amber-900/30">
      {/* Registration Settings Bar */}
      <div className="bg-[#050814]/80 border border-amber-900/40 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs font-semibold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" /> Self-Registration Settings
            </p>
            <p className="text-[11px] text-amber-500/60 mt-0.5">
              Share the Join Code or Invite Link so players can sign in with Google and register themselves.
            </p>
          </div>
          <button
            type="button"
            onClick={() => updateRegistrationSettings({ enabled: regSettings.enabled === false })}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
              regSettings.enabled !== false
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-red-500/20 text-red-300 border-red-500/40'
            }`}
          >
            {regSettings.enabled !== false ? 'REGISTRATION OPEN' : 'REGISTRATION CLOSED'}
          </button>
        </div>

        {/* Join Code & Invite */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex items-center gap-2 bg-[#0b132b] border border-amber-900/40 rounded-lg px-3 py-1.5">
            <span className="text-[10px] font-mono uppercase text-amber-500/60">Join Code:</span>
            <span className="font-mono font-bold text-sm text-amber-300 tracking-wider">{joinCode}</span>
            <button
              type="button"
              onClick={() => updateRegistrationSettings({ joinCode: generateJoinCode() })}
              title="Generate new Join Code"
              className="text-amber-500/60 hover:text-amber-300 ml-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={copyInviteLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/25 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-200 text-xs font-semibold"
          >
            {copiedInvite ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedInvite ? 'Invite Link Copied!' : 'Copy Registration Link'}</span>
          </button>
        </div>

        {/* Cap, Deadline, Entry Fee */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-amber-900/30">
          <div>
            <label className="text-[10px] font-mono uppercase text-amber-500/60">Max Players (0 = Unlimited)</label>
            <input
              type="number"
              min="0"
              value={regSettings.maxPlayers ?? 0}
              onChange={e => updateRegistrationSettings({ maxPlayers: Math.max(0, Number(e.target.value) || 0) })}
              className="w-full mt-1 bg-[#0b132b] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-amber-500/60">Registration Deadline</label>
            <input
              type="date"
              value={regSettings.deadline || ''}
              onChange={e => updateRegistrationSettings({ deadline: e.target.value })}
              className="w-full mt-1 bg-[#0b132b] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-amber-500/60">Entry Fee (optional)</label>
            <input
              type="text"
              value={regSettings.entryFee || ''}
              onChange={e => updateRegistrationSettings({ entryFee: e.target.value })}
              placeholder="e.g. 500 BDT or Free"
              className="w-full mt-1 bg-[#0b132b] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-mono uppercase text-amber-500/60">Payment Instructions (shown on registration form)</label>
          <input
            type="text"
            value={regSettings.paymentInstructions || ''}
            onChange={e => updateRegistrationSettings({ paymentInstructions: e.target.value })}
            placeholder="e.g. bKash Send Money to 017XXXXXXXX and enter TrxID"
            className="w-full mt-1 bg-[#0b132b] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-xs text-white"
          />
        </div>
      </div>

      {!isFirebaseConfigured() && (
        <p className="text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-xl p-3">
          Connect Firebase Cloud sync to receive online player registrations.
        </p>
      )}

      {/* Summary & Waitlist Promotion */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-[#050814] border border-amber-900/40 text-amber-200 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            Roster: {state.players.length}{maxPlayers > 0 ? ` / ${maxPlayers}` : ''}
          </span>
          {regSettings.entryFee && (
            <span className="px-2.5 py-1 rounded-lg bg-[#050814] border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" />
              Verified Paid: {verifiedPaymentsCount} / {registrations.length}
            </span>
          )}
        </div>

        {waitlistList.length > 0 && !isAtCapacity && (
          <button
            type="button"
            onClick={handlePromoteNextWaitlist}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            Promote Next from Waitlist ({waitlistList[0].name})
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 bg-[#050814] rounded-xl border border-amber-900/40 overflow-x-auto">
        {[
          { id: 'PENDING',  label: `Pending (${pendingList.length})` },
          { id: 'LINKS',    label: `Google Links (${pendingClaims.length})` },
          { id: 'WAITLIST', label: `Waitlist (${waitlistList.length})` },
          { id: 'APPROVED', label: `Approved (${approvedList.length})` },
          { id: 'REJECTED', label: `Declined (${rejectedList.length})` },
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-colors ${
              tab === t.id
                ? 'bg-amber-900/40 text-amber-200 border border-amber-500/40'
                : 'text-amber-500/60 hover:text-amber-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {actionMsg && (
        <div className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/40 rounded-xl px-3 py-2">
          {actionMsg}
        </div>
      )}

      {tab === 'LINKS' ? (
        <div className="space-y-3">
          {pendingClaims.some(c => c.pinVerified) && (
            <div className="flex justify-end">
              <button
                type="button"
                disabled={busyUid === 'ALL_CLAIMS'}
                onClick={handleApproveAllVerifiedClaims}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {busyUid === 'ALL_CLAIMS' ? 'Connecting…' : 'Approve All PIN-Verified Links'}
              </button>
            </div>
          )}

          {pendingClaims.length === 0 ? (
            <div className="text-center py-8 text-amber-500/40 text-xs font-serif border border-dashed border-amber-900/30 rounded-xl">
              No pending Google profile link requests.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingClaims.map(req => (
                <div key={req.uid} className="bg-[#050814]/80 border border-amber-900/40 rounded-xl p-3.5 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    {req.photoURL ? (
                      <img src={req.photoURL} alt="" className="w-10 h-10 rounded-full object-cover border border-amber-500/30 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#0b132b] border border-amber-900/40 flex items-center justify-center font-bold text-amber-300 shrink-0">
                        <Link2 className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif font-bold text-sm text-amber-100">{req.targetName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          {req.targetRole}
                        </span>
                        {req.pinVerified ? (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            PIN Verified ✓
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Forgot PIN — Review
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-amber-500/70 truncate">
                        Google: {req.displayName} ({req.email})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={busyUid === req.uid}
                      onClick={() => handleApproveClaim(req)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve &amp; Link
                    </button>
                    <button
                      type="button"
                      disabled={busyUid === req.uid}
                      onClick={() => handleDeclineClaim(req)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/70 border border-red-500/40 text-red-200 text-xs font-semibold"
                    >
                      <X className="w-3.5 h-3.5" /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : visibleList.length === 0 ? (
        <div className="text-center py-8 text-amber-500/40 text-xs font-serif border border-dashed border-amber-900/30 rounded-xl">
          No applications in {tab.toLowerCase()}.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
          {visibleList.map(reg => {
            const isBusy = busyUid === reg.uid;
            return (
              <div key={reg.uid} className="bg-[#050814]/80 border border-amber-900/40 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    {reg.avatar ? (
                      <img src={reg.avatar} alt="" className="w-10 h-10 rounded-lg object-cover border border-amber-500/30 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#0b132b] border border-amber-900/40 flex items-center justify-center font-bold text-amber-300 shrink-0">
                        {(reg.name || 'P')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif font-bold text-sm text-amber-100">{reg.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          {reg.position || 'FLEX'}
                        </span>
                        {reg.jerseyNumber && (
                          <span className="text-[10px] font-mono text-amber-400">#{reg.jerseyNumber}</span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-amber-500/60 truncate">{reg.email}</p>
                      {reg.whatsapp && (
                        <p className="text-[11px] font-mono text-emerald-300/80 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {reg.whatsapp}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Payment pill */}
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleCyclePayment(reg)}
                    title="Click to cycle payment verification status"
                    className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-lg border shrink-0 transition-colors ${
                      reg.paymentStatus === 'VERIFIED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : reg.paymentStatus === 'SUBMITTED'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-gray-800 text-amber-500/60 border-amber-900/40'
                    }`}
                  >
                    Fee: {reg.paymentStatus || 'UNPAID'}
                    {reg.paymentRef ? ` (${reg.paymentRef})` : ''}
                  </button>
                </div>

                {reg.bio && (
                  <p className="text-xs font-serif text-amber-200/70 italic">&quot;{reg.bio}&quot;</p>
                )}

                {/* Actions */}
                {(tab === 'PENDING' || tab === 'WAITLIST') && (
                  <div className="space-y-2 pt-2 border-t border-amber-900/30">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleApproveNew(reg)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {isAtCapacity ? 'Approve Anyway (Over Cap)' : 'Approve as New Player'}
                      </button>

                      {tab === 'PENDING' && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleMoveWaitlist(reg)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold"
                        >
                          <Clock className="w-3.5 h-3.5" /> Waitlist
                        </button>
                      )}

                      <div className="flex items-center gap-1.5 ml-auto">
                        <input
                          type="text"
                          value={rejectNote[reg.uid] || ''}
                          onChange={e => setRejectNote(prev => ({ ...prev, [reg.uid]: e.target.value }))}
                          placeholder="Reason (optional)..."
                          className="bg-[#0b132b] border border-amber-900/40 rounded-lg px-2 py-1 text-xs text-amber-100 w-32"
                        />
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleReject(reg)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/70 border border-red-500/40 text-red-200 text-xs font-semibold"
                        >
                          <X className="w-3.5 h-3.5" /> Decline
                        </button>
                      </div>
                    </div>

                    {unlinkedPlayers.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        <GitMerge className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <select
                          value={mergeTarget[reg.uid] || ''}
                          onChange={e => setMergeTarget(prev => ({ ...prev, [reg.uid]: e.target.value }))}
                          className="flex-1 bg-[#0b132b] border border-amber-900/40 rounded-lg px-2.5 py-1 text-xs text-amber-100"
                        >
                          <option value="">-- Or merge into existing unlinked player --</option>
                          {unlinkedPlayers.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.position})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!mergeTarget[reg.uid] || isBusy}
                          onClick={() => handleMergeExisting(reg)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-semibold shrink-0"
                        >
                          Merge &amp; Approve
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'APPROVED' && (
                  <div className="flex items-center justify-between text-xs text-emerald-300/80 pt-1 border-t border-amber-900/30">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Linked to roster {reg.adminNote ? `(${reg.adminNote})` : ''}
                    </span>
                  </div>
                )}

                {tab === 'REJECTED' && (
                  <div className="flex items-center justify-between pt-1 border-t border-amber-900/30">
                    <span className="text-xs text-red-300/80">
                      {reg.adminNote ? `Reason: ${reg.adminNote}` : 'Declined'}
                    </span>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => updateRegistrationRecord(tournamentId, reg.uid, { status: 'PENDING' })}
                      className="text-xs px-2.5 py-1 rounded-lg bg-[#0b132b] border border-amber-900/40 text-amber-200 hover:text-white"
                    >
                      Reopen to Pending
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
