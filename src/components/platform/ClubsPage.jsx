import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ImageUploadButton from '../ImageUploadButton';
import {
  createClubCloud,
  updateClubCloud,
  deleteClubCloud,
  subscribeClubRequests,
  subscribeMyClubRequest,
  submitClubJoinRequest,
  updateClubRequestRecord,
  withdrawClubJoinRequest,
  isFirebaseConfigured,
} from '../../services/firebase';
import {
  Shield, Plus, Users, MapPin, Trophy, X, Check, LogIn,
  Search, UserPlus, Trash2, Award, Clock
} from 'lucide-react';

export default function ClubsPage({ clubs = [] }) {
  const { user, signInGoogle } = useAuth();
  const [search, setSearch] = useState('');
  const [onlyRecruiting, setOnlyRecruiting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);

  const [clubForm, setClubForm] = useState({
    name: '',
    shortTag: '',
    city: '',
    homeGround: '',
    foundedYear: new Date().getFullYear(),
    primaryColor: '#10B981',
    logoUrl: '',
    motto: '',
    bio: '',
    isRecruiting: true,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Club detail modal state
  const [clubRequests, setClubRequests] = useState([]);
  const [myRequest, setMyRequest] = useState(null);
  const [joinPosition, setJoinPosition] = useState('FLEX');
  const [joinNote, setJoinNote] = useState('');
  const [honorInput, setHonorInput] = useState('');

  const activeClub = selectedClub ? (clubs.find(c => c.id === selectedClub.id) || selectedClub) : null;
  const isClubMgr = Boolean(
    user?.uid && activeClub && (activeClub.ownerUid === user.uid || activeClub.managerUids?.includes(user.uid))
  );
  const isClubMember = Boolean(
    user?.uid && activeClub && activeClub.members?.some(m => m.uid === user.uid)
  );

  useEffect(() => {
    if (!activeClub?.id || !isFirebaseConfigured()) {
      setClubRequests([]);
      setMyRequest(null);
      return;
    }
    const unsubs = [];
    if (isClubMgr) {
      unsubs.push(subscribeClubRequests(activeClub.id, setClubRequests));
    } else {
      setClubRequests([]);
    }
    if (user?.uid) {
      unsubs.push(subscribeMyClubRequest(activeClub.id, user.uid, setMyRequest));
    }
    return () => unsubs.forEach(u => u());
  }, [activeClub?.id, isClubMgr, user?.uid]);

  const filteredClubs = clubs.filter(c => {
    if (onlyRecruiting && !c.isRecruiting) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.shortTag?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  async function handleCreateClub(e) {
    e.preventDefault();
    if (!user?.uid || !clubForm.name.trim()) return;
    setBusy(true);
    setErr('');
    try {
      await createClubCloud({
        ...clubForm,
        name: clubForm.name.trim(),
        shortTag: (clubForm.shortTag || clubForm.name.slice(0, 3)).toUpperCase(),
        ownerUid: user.uid,
        ownerName: user.displayName || 'Club Owner',
        members: [
          {
            uid: user.uid,
            name: user.displayName || 'Manager',
            photoURL: user.photoURL || '',
            role: 'OWNER',
            position: 'FLEX',
            joinedAt: Date.now(),
          },
        ],
      });
      setShowCreate(false);
      setClubForm({
        name: '', shortTag: '', city: '', homeGround: '',
        foundedYear: new Date().getFullYear(), primaryColor: '#10B981',
        logoUrl: '', motto: '', bio: '', isRecruiting: true,
      });
    } catch (error) {
      setErr(error?.message || 'Failed to create club.');
    } finally {
      setBusy(false);
    }
  }

  async function handleApplyJoin(e) {
    e.preventDefault();
    if (!user?.uid || !activeClub) return;
    setBusy(true);
    try {
      await submitClubJoinRequest(activeClub.id, user.uid, {
        name: user.displayName || 'Player',
        email: user.email || '',
        photoURL: user.photoURL || '',
        position: joinPosition,
        note: joinNote.trim(),
      });
      setJoinNote('');
    } finally {
      setBusy(false);
    }
  }

  async function handleApproveMember(req) {
    if (!activeClub || !isClubMgr) return;
    const existing = activeClub.members || [];
    if (!existing.some(m => m.uid === req.uid)) {
      await updateClubCloud(activeClub.id, {
        members: [
          ...existing,
          {
            uid: req.uid,
            name: req.name,
            photoURL: req.photoURL || '',
            role: 'PLAYER',
            position: req.position || 'FLEX',
            joinedAt: Date.now(),
          },
        ],
      });
    }
    await updateClubRequestRecord(activeClub.id, req.uid, { status: 'APPROVED' });
  }

  async function handleAddHonor(e) {
    e.preventDefault();
    if (!activeClub || !honorInput.trim() || !isClubMgr) return;
    const nextHonors = [...(activeClub.honors || []), { id: Date.now().toString(36), title: honorInput.trim() }];
    await updateClubCloud(activeClub.id, { honors: nextHonors });
    setHonorInput('');
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="pro-card rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-cyan-400" /> Clubs &amp; Franchises
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Persistent clubs that compete across seasons, recruit players, and build trophy cabinets.
          </p>
        </div>

        {isFirebaseConfigured() && (
          user ? (
            <button
              type="button"
              onClick={() => { setErr(''); setShowCreate(true); }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow shrink-0"
            >
              <Plus className="w-4 h-4" /> Register a Club
            </button>
          ) : (
            <button
              type="button"
              onClick={() => signInGoogle().catch(() => {})}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" /> Sign in to Create Club
            </button>
          )
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clubs by name, tag, or city..."
            className="w-full bg-[#050814] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyRecruiting}
            onChange={e => setOnlyRecruiting(e.target.checked)}
            className="rounded border-slate-700 bg-[#050814] text-emerald-500"
          />
          <span>Only Recruiting Clubs</span>
        </label>
      </div>

      {/* Club Cards Grid */}
      {filteredClubs.length === 0 ? (
        <div className="pro-glass rounded-2xl p-12 text-center space-y-2">
          <Shield className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No clubs match your filter</p>
          <p className="text-xs text-slate-500">Create a club to build your squad identity across tournaments.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClubs.map(c => (
            <div
              key={c.id}
              onClick={() => setSelectedClub(c)}
              className="pro-card rounded-2xl p-5 cursor-pointer hover:border-cyan-400/50 transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {c.logoUrl ? (
                    <img src={c.logoUrl} alt={c.name} className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0" />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-sm border shrink-0"
                      style={{ backgroundColor: `${c.primaryColor || '#10B981'}25`, borderColor: `${c.primaryColor || '#10B981'}60` }}
                    >
                      {c.shortTag || c.name?.[0] || 'C'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-base text-white truncate">{c.name}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" /> {c.city || 'Local Arena'}
                    </p>
                  </div>
                </div>
                {c.isRecruiting && (
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                    Recruiting
                  </span>
                )}
              </div>

              {c.motto && <p className="text-xs italic text-slate-400 line-clamp-2">&quot;{c.motto}&quot;</p>}

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-cyan-400" /> {(c.members || []).length} members</span>
                <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-amber-400" /> {(c.honors || []).length} honors</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Club Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="pro-card bg-[#0b132b] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">Register New Club</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateClub} className="p-5 overflow-y-auto space-y-3.5">
              <div className="flex items-center gap-3">
                <ImageUploadButton
                  storagePath="clubs/logos"
                  label="Upload Club Crest"
                  onUploaded={url => setClubForm(f => ({ ...f, logoUrl: url }))}
                />
                {clubForm.logoUrl && <img src={clubForm.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[11px] font-mono uppercase text-slate-400">Club Name *</label>
                  <input
                    required
                    value={clubForm.name}
                    onChange={e => setClubForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Dhaka United FC"
                    className="w-full mt-1 bg-[#050814] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase text-slate-400">Tag (3-4)</label>
                  <input
                    maxLength={4}
                    value={clubForm.shortTag}
                    onChange={e => setClubForm(f => ({ ...f, shortTag: e.target.value.toUpperCase() }))}
                    placeholder="DUFC"
                    className="w-full mt-1 bg-[#050814] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono uppercase text-slate-400">City / Area</label>
                  <input
                    value={clubForm.city}
                    onChange={e => setClubForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="e.g. Dhaka"
                    className="w-full mt-1 bg-[#050814] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase text-slate-400">Club Color</label>
                  <input
                    type="color"
                    value={clubForm.primaryColor}
                    onChange={e => setClubForm(f => ({ ...f, primaryColor: e.target.value }))}
                    className="w-full mt-1 h-9 bg-[#050814] border border-slate-800 rounded-xl px-1 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400">Motto</label>
                <input
                  value={clubForm.motto}
                  onChange={e => setClubForm(f => ({ ...f, motto: e.target.value }))}
                  placeholder="Play as one..."
                  className="w-full mt-1 bg-[#050814] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400">About Club</label>
                <textarea
                  rows={3}
                  value={clubForm.bio}
                  onChange={e => setClubForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Club history, weekly training turf, ambitions..."
                  className="w-full mt-1 bg-[#050814] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clubForm.isRecruiting}
                  onChange={e => setClubForm(f => ({ ...f, isRecruiting: e.target.checked }))}
                  className="rounded border-slate-700 bg-[#050814] text-emerald-500"
                />
                <span>Open for player applications</span>
              </label>

              {err && <p className="text-xs text-red-400">{err}</p>}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs">Cancel</button>
                <button type="submit" disabled={busy} className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs">
                  {busy ? 'Creating…' : 'Create Club'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Club Detail Modal ── */}
      {activeClub && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-3 sm:p-5"
          onClick={e => { if (e.target === e.currentTarget) setSelectedClub(null); }}
        >
          <div className="pro-card bg-[#0b132b] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {activeClub.logoUrl ? (
                  <img src={activeClub.logoUrl} alt="" className="w-14 h-14 rounded-2xl object-cover border border-slate-700" />
                ) : (
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg text-white border"
                    style={{ backgroundColor: `${activeClub.primaryColor || '#10B981'}30`, borderColor: activeClub.primaryColor || '#10B981' }}
                  >
                    {activeClub.shortTag || 'CLB'}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-white truncate">{activeClub.name}</h2>
                  <p className="text-xs text-slate-400">
                    {activeClub.city || 'Community Club'} • Est. {activeClub.foundedYear || 2026}
                  </p>
                  {activeClub.motto && <p className="text-xs italic text-amber-300/80 mt-0.5">&quot;{activeClub.motto}&quot;</p>}
                </div>
              </div>
              <button onClick={() => setSelectedClub(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {activeClub.bio && <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{activeClub.bio}</p>}

              {/* Honors */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4" /> Club Honors ({(activeClub.honors || []).length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(activeClub.honors || []).map(h => (
                    <span key={h.id} className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-200 border border-amber-500/30">
                      🏆 {h.title}
                    </span>
                  ))}
                  {(activeClub.honors || []).length === 0 && <span className="text-xs text-slate-500">No trophies added yet.</span>}
                </div>
                {isClubMgr && (
                  <form onSubmit={handleAddHonor} className="flex gap-2 pt-1">
                    <input
                      value={honorInput}
                      onChange={e => setHonorInput(e.target.value)}
                      placeholder="Add trophy / honor (e.g. Summer Cup 2026 Winners)"
                      className="flex-1 bg-[#050814] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                    <button type="submit" className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold">Add</button>
                  </form>
                )}
              </div>

              {/* Roster */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Squad Roster ({(activeClub.members || []).length})
                </h4>
                <div className="space-y-1.5">
                  {(activeClub.members || []).map(m => (
                    <div key={m.uid} className="flex items-center justify-between p-2.5 rounded-xl bg-[#050814]/80 border border-slate-800">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {m.photoURL ? (
                          <img src={m.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-xs font-bold text-white flex items-center justify-center">
                            {(m.name || 'P')[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{m.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">{m.position || 'FLEX'} • {m.role}</p>
                        </div>
                      </div>
                      {isClubMgr && m.uid !== activeClub.ownerUid && (
                        <button
                          type="button"
                          onClick={() => updateClubCloud(activeClub.id, {
                            members: activeClub.members.filter(x => x.uid !== m.uid),
                          })}
                          className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Join Club Application */}
              {!isClubMember && activeClub.isRecruiting && isFirebaseConfigured() && (
                <div className="bg-[#050814]/80 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4" /> Apply to Join {activeClub.name}
                  </p>
                  {!user ? (
                    <button
                      type="button"
                      onClick={() => signInGoogle().catch(() => {})}
                      className="px-3.5 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold"
                    >
                      Sign in with Google to Apply
                    </button>
                  ) : myRequest?.status === 'PENDING' ? (
                    <div className="flex items-center justify-between text-xs text-amber-300">
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Application Pending Review</span>
                      <button
                        type="button"
                        onClick={() => withdrawClubJoinRequest(activeClub.id, user.uid)}
                        className="text-red-300 underline"
                      >
                        Withdraw
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyJoin} className="space-y-2.5">
                      <div className="flex gap-2">
                        <select
                          value={joinPosition}
                          onChange={e => setJoinPosition(e.target.value)}
                          className="bg-[#0b132b] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          {['GK', 'DEF', 'MID', 'FWD', 'FLEX'].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <input
                          value={joinNote}
                          onChange={e => setJoinNote(e.target.value)}
                          placeholder="Short intro / preferred role..."
                          className="flex-1 bg-[#0b132b] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={busy}
                        className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                      >
                        {busy ? 'Sending…' : 'Send Join Request'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Manager Pending Join Requests */}
              {isClubMgr && clubRequests.filter(r => r.status === 'PENDING').length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-mono uppercase text-amber-300">
                    Pending Join Requests ({clubRequests.filter(r => r.status === 'PENDING').length})
                  </h4>
                  {clubRequests.filter(r => r.status === 'PENDING').map(req => (
                    <div key={req.uid} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#050814] border border-amber-500/30">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white">{req.name} ({req.position})</p>
                        {req.note && <p className="text-[11px] text-slate-400">{req.note}</p>}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleApproveMember(req)}
                          className="p-1.5 rounded-lg bg-emerald-600 text-white"
                          title="Approve"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateClubRequestRecord(activeClub.id, req.uid, { status: 'REJECTED' })}
                          className="p-1.5 rounded-lg bg-red-900/60 text-red-200"
                          title="Decline"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {user?.uid === activeClub.ownerUid && (
                <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => updateClubCloud(activeClub.id, { isRecruiting: !activeClub.isRecruiting })}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300"
                  >
                    {activeClub.isRecruiting ? 'Close Recruiting' : 'Open Recruiting'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm(`Delete ${activeClub.name}?`)) {
                        await deleteClubCloud(activeClub.id);
                        setSelectedClub(null);
                      }
                    }}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Club
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
