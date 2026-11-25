import React, { useState, useEffect } from 'react';
import { useGlobal, useOrganizer } from '../context/GlobalContext';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../services/firebase';
import { applyPageSeo, SITE_ORIGIN } from '../utils/seo';
import {
  Trophy, Plus, Trash2, Play, Calendar, Users, Crown,
  ChevronRight, Settings, Globe, Dices, X, Edit3, Check,
  LogIn, LogOut, Lock, RefreshCw, Search, Shield, Copy
} from 'lucide-react';

const FORMAT_OPTIONS = [
  { value: 'LEAGUE',   label: 'League',   desc: 'Round-robin, full standings' },
  { value: 'KNOCKOUT', label: 'Knockout', desc: 'Elimination bracket' },
  { value: 'HYBRID',   label: 'Hybrid',   desc: 'League + Knockout playoffs' },
];

const FORMAT_COLORS = {
  LEAGUE:   'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  KNOCKOUT: 'text-red-400    bg-red-400/10    border-red-400/30',
  HYBRID:   'text-amber-400  bg-amber-400/10  border-amber-400/30',
};

function OrganizerProfileModal({ onClose }) {
  const { organizer, updateOrganizer } = useOrganizer();
  const [form, setForm] = useState({ ...organizer });

  function save() {
    updateOrganizer(form);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-[#050814]/85 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="sketch-border bg-[#0b132b] rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl text-amber-50">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif text-amber-200 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            Organizer Profile
          </h2>
          <button onClick={onClose} className="text-amber-500/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Your Name',  key: 'name',            placeholder: 'e.g. Shourav' },
            { label: 'Avatar URL', key: 'avatar',          placeholder: 'https://...' },
            { label: 'Bio',        key: 'bio',             placeholder: 'Organizer bio...' },
            { label: 'WhatsApp',   key: 'contactWhatsApp', placeholder: '+880...' },
            { label: 'Email',      key: 'email',           placeholder: 'you@example.com' },
          ].map(({ label, key, placeholder }) => (
            <div key={key} className="space-y-1">
              <label className="text-sm text-amber-500/60 font-medium">{label}</label>
              <input
                value={form[key] || ''}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-[#050814] border border-amber-900/50 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-600 text-amber-100 hover:bg-[#050814] text-sm font-medium transition-colors">
            Cancel
          </button>
          <button onClick={save} className="flex-1 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

function TournamentCard({ t, user, canEdit, canDelete, canClone, onOpen, onEdit, onClone, confirmDelete, onRequestDelete, onCancelDelete, onConfirmDelete }) {
  const color = FORMAT_COLORS[t.format] || FORMAT_COLORS.HYBRID;

  let localPlayers = 0;
  let localTeams = 0;
  try {
    const raw = localStorage.getItem(`mt_state_${t.id}`);
    if (raw) {
      const s = JSON.parse(raw);
      localPlayers = s.players?.length ?? 0;
      localTeams = s.teams?.length ?? 0;
    }
  } catch {}

  const playersCount = t.playerCount ?? localPlayers;
  const teamsCount = t.teamCount ?? localTeams;
  const isOwner = Boolean(user?.uid && t.ownerUid === user.uid);
  const isCoAdmin = Boolean(user?.uid && Array.isArray(t.coAdminUids) && t.coAdminUids.includes(user.uid));

  return (
    <div className="sketch-border bg-[#0b132b]/60 rounded-2xl p-5 hover:bg-[#0b132b]/90 transition-all group">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-serif text-amber-100 text-lg truncate group-hover:text-amber-300 transition-colors">{t.name}</h3>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
              {t.format}
            </span>
            {t.isPublic === false && (
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-800 text-amber-300/80 border border-amber-900/50 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Private
              </span>
            )}
            {isOwner && (
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Owner
              </span>
            )}
            {!isOwner && isCoAdmin && (
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                Co-Admin
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-amber-500/50 flex-wrap">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {playersCount} players
            </span>
            <span className="flex items-center gap-1">
              <Crown className="w-3 h-3" /> {teamsCount} teams
            </span>
            {t.ownerName && (
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" /> {t.ownerName}
              </span>
            )}
            {t.createdAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(t.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {confirmDelete === t.id ? (
            <>
              <button
                onClick={onCancelDelete}
                className="text-xs px-2 py-1 rounded bg-gray-700 text-amber-100 hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirmDelete(t.id)}
                className="text-xs px-2 py-1 rounded bg-red-700 text-white hover:bg-red-600 font-semibold"
              >
                Delete
              </button>
            </>
          ) : (
            <>
              {canClone && (
                <button
                  onClick={() => onClone(t)}
                  className="p-1.5 rounded-lg text-amber-500/40 hover:text-cyan-300 hover:bg-cyan-950/30 transition-colors"
                  title="Clone tournament for a new season"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => onEdit(t)}
                  className="p-1.5 rounded-lg text-amber-500/40 hover:text-amber-400 hover:bg-gray-850 transition-colors"
                  title="Edit tournament name & format"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onRequestDelete(t.id)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-70 group-hover:opacity-100"
                  title="Delete tournament"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onOpen(t.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#050814] hover:bg-amber-600 text-sm font-semibold text-amber-100 hover:text-white transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Open
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TournamentManager({ embedded = false }) {
  const {
    myTournaments,
    joinedTournaments,
    discoverTournaments,
    loadingPublic,
    refreshPublicTournaments,
    createTournament,
    cloneTournament,
    deleteTournament,
    selectTournament,
    updateTournamentMeta,
    openTournamentByIdOrUrl,
  } = useGlobal();
  const { organizer } = useOrganizer();
  const { user, authLoading, authError, signInGoogle, signOutUser } = useAuth();

  const [showCreate, setShowCreate] = useState(false);
  const [showOrgProfile, setShowOrgProfile] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFormat, setNewFormat] = useState('HYBRID');
  const [newIsPublic, setNewIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingTournament, setEditingTournament] = useState(null);
  const [editName, setEditName] = useState('');
  const [editFormat, setEditFormat] = useState('HYBRID');
  const [joinInput, setJoinInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState('ALL');

  const hasCloud = isFirebaseConfigured();

  useEffect(() => {
    const listed = [...myTournaments, ...joinedTournaments, ...discoverTournaments].slice(0, 15);
    applyPageSeo({
      title: 'Tournaments Directory — Live Leagues, Auction Drafts & Cups',
      description:
        'Browse public football and local sports tournaments, create a new league or knockout cup, or enter a 6-character Join Code on ArenaPro.',
      canonicalPath: '/tournaments/',
      ogImage: './screenshots/02-tournaments-hub.png',
      jsonLdGraph: [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
            { '@type': 'ListItem', position: 2, name: 'Tournaments', item: `${SITE_ORIGIN}/tournaments/` },
          ],
        },
        {
          '@type': 'ItemList',
          name: 'ArenaPro Tournaments Directory',
          numberOfItems: listed.length,
          itemListElement: listed.map((t, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'SportsEvent',
              name: t.name || 'Tournament',
              url: `${SITE_ORIGIN}/?t=${encodeURIComponent(t.id)}`,
              eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
            },
          })),
        },
      ],
    });
  }, [myTournaments, joinedTournaments, discoverTournaments]);

  async function handleGoogleSignIn() {
    setSigningIn(true);
    try {
      await signInGoogle();
    } catch {
      // AuthContext holds authError
    } finally {
      setSigningIn(false);
    }
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      await createTournament(name, newFormat, { isPublic: newIsPublic });
      setNewName('');
      setNewFormat('HYBRID');
      setNewIsPublic(true);
      setShowCreate(false);
    } finally {
      setCreating(false);
    }
  }

  function handleStartEditTournament(t) {
    setEditingTournament(t);
    setEditName(t.name);
    setEditFormat(t.format || 'HYBRID');
  }

  function handleSaveEditTournament() {
    if (!editingTournament || !editName.trim()) return;
    updateTournamentMeta({
      id: editingTournament.id,
      name: editName.trim(),
      format: editFormat,
    });
    try {
      const raw = localStorage.getItem(`mt_state_${editingTournament.id}`);
      if (raw) {
        const s = JSON.parse(raw);
        s.organizer = { ...s.organizer, name: editName.trim(), format: editFormat };
        localStorage.setItem(`mt_state_${editingTournament.id}`, JSON.stringify(s));
      }
    } catch {}
    setEditingTournament(null);
  }

  async function handleDelete(id) {
    await deleteTournament(id);
    setConfirmDelete(null);
  }

  async function handleOpenById(e) {
    e.preventDefault();
    setJoinError('');
    const res = await openTournamentByIdOrUrl(joinInput);
    if (!res.ok) {
      setJoinError(res.error || 'Could not open tournament.');
    } else {
      setJoinInput('');
    }
  }

  const filterList = (list) => list.filter(t => {
    if (formatFilter !== 'ALL' && (t.format || 'HYBRID') !== formatFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (t.name || '').toLowerCase().includes(q) || (t.ownerName || '').toLowerCase().includes(q);
    }
    return true;
  });

  const filteredMy = filterList(myTournaments);
  const filteredJoined = filterList(joinedTournaments);
  const filteredDiscover = filterList(discoverTournaments);

  async function handleClone(t) {
    const newSeasonName = window.prompt('Name for cloned season:', `${t.name} (Season 2)`);
    if (!newSeasonName || !newSeasonName.trim()) return;
    await cloneTournament(t.id, newSeasonName.trim());
  }

  return (
    <div className={embedded ? 'text-amber-50' : 'min-h-screen bg-[#050814] text-amber-50'}>
      {/* Header (only when standalone) */}
      {!embedded && (
      <header className="sketch-border bg-[#0b132b]/80 border-b border-dashed border-amber-900/40 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span className="font-bold text-white text-lg">Mini Tournament</span>
          </div>

          <div className="flex items-center gap-2">
            {hasCloud && (
              user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowOrgProfile(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#050814] hover:bg-gray-800 text-sm text-amber-100 hover:text-white transition-colors border border-amber-900/40"
                    title="Edit your organizer profile"
                  >
                    {(organizer.avatar || user.photoURL) ? (
                      <img src={organizer.avatar || user.photoURL} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center text-xs font-bold text-white">
                        {(organizer.name || user.displayName || 'O')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:inline">{organizer.name || user.displayName || 'Profile'}</span>
                    <Settings className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                  <button
                    onClick={signOutUser}
                    className="p-2 rounded-lg bg-[#050814] hover:bg-red-950/40 text-amber-500/60 hover:text-red-300 border border-amber-900/30 transition-colors"
                    title="Sign out of Google"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGoogleSignIn}
                  disabled={signingIn || authLoading}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-semibold transition-colors shadow-lg"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{signingIn ? 'Signing in…' : 'Sign in with Google'}</span>
                </button>
              )
            )}

            {!hasCloud && (
              <button
                onClick={() => setShowOrgProfile(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#050814] hover:bg-gray-700 text-sm text-amber-100 hover:text-white transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{organizer.name || 'Set Profile'}</span>
              </button>
            )}
          </div>
        </div>
      </header>
      )}

      <main className={embedded ? 'space-y-6' : 'max-w-4xl mx-auto px-4 py-8 space-y-8'}>
        {/* Welcome & Auth Banner */}
        <div className="sketch-border bg-[#0b132b]/70 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <h1 className="text-3xl font-serif text-amber-200 mb-1">
            {user
              ? `Welcome back, ${organizer.name || user.displayName}!`
              : organizer.name
                ? `Welcome back, ${organizer.name}!`
                : 'Welcome to Mini Tournament'}
          </h1>
          <p className="text-amber-500/70 text-sm">
            {user
              ? `Signed in as ${user.email}. Your tournaments & profile are isolated to your account.`
              : hasCloud
                ? 'Sign in with Google to create your own tournaments, invite co-admins, and sync live across devices.'
                : 'Offline mode active. Create local tournaments in this browser.'}
          </p>

          {authError && (
            <p className="mt-3 text-xs text-red-300 bg-red-950/40 border border-red-500/30 rounded-lg px-3 py-2">
              {authError}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            {hasCloud && !user && (
              <button
                onClick={handleGoogleSignIn}
                disabled={signingIn || authLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
              >
                <LogIn className="w-4 h-4" />
                {signingIn ? 'Signing in…' : 'Sign in with Google'}
              </button>
            )}
            {user && !organizer.name && (
              <button
                onClick={() => setShowOrgProfile(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-100 text-sm font-medium transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> Complete Organizer Profile
              </button>
            )}
          </div>
        </div>

        {/* Open by Link or ID */}
        <form onSubmit={handleOpenById} className="sketch-border bg-[#0b132b]/50 rounded-2xl p-4 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-amber-500/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={joinInput}
              onChange={e => { setJoinInput(e.target.value); setJoinError(''); }}
              placeholder="Paste tournament invite link, ID, or Join Code (e.g. ABC123)..."
              className="w-full bg-[#050814] border border-amber-900/50 rounded-xl pl-9 pr-3 py-2 text-sm text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={!joinInput.trim()}
            className="px-4 py-2 rounded-xl bg-[#050814] hover:bg-amber-600/40 border border-amber-500/40 disabled:opacity-40 text-amber-200 text-xs font-mono uppercase tracking-wider transition-colors shrink-0"
          >
            Open Arena
          </button>
        </form>
        {joinError && <p className="text-xs text-red-400 -mt-5 px-1">{joinError}</p>}

        {/* Search & Format Filter */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-amber-500/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter tournaments by name or host..."
              className="w-full bg-[#050814] border border-amber-900/50 rounded-xl pl-9 pr-3 py-2 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {['ALL', 'LEAGUE', 'KNOCKOUT', 'HYBRID'].map(fmt => (
              <button
                key={fmt}
                type="button"
                onClick={() => setFormatFilter(fmt)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-mono uppercase transition-colors ${
                  formatFilter === fmt
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-[#0b132b] text-amber-200/70 border border-amber-900/40'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* My Tournaments */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif text-amber-200">My Tournaments</h2>
            <button
              onClick={() => setShowCreate(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Tournament
            </button>
          </div>

          {showCreate && (
            <div className="sketch-border bg-[#0b132b]/90 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="font-semibold text-white">Create Tournament</h3>

              <div className="space-y-1.5">
                <label className="text-sm text-amber-500/60">Tournament Name</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="e.g. Summer Football Cup 2026"
                  autoFocus
                  className="w-full bg-[#050814] border border-amber-900/50 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-amber-500/60">Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {FORMAT_OPTIONS.map(opt => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setNewFormat(opt.value)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        newFormat === opt.value
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                          : 'border-gray-700 bg-[#050814] text-amber-500/60 hover:border-gray-500'
                      }`}
                    >
                      <div className="font-semibold text-sm">{opt.label}</div>
                      <div className="text-xs opacity-70 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-xs text-amber-200/80 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newIsPublic}
                  onChange={e => setNewIsPublic(e.target.checked)}
                  className="rounded border-amber-700 bg-[#050814] text-amber-500 focus:ring-amber-500"
                />
                <span>List in Public Arenas directory (uncheck for link-only private tournament)</span>
              </label>

              {hasCloud && !user && (
                <p className="text-xs text-amber-300/80 bg-amber-950/40 border border-amber-500/30 rounded-lg p-2.5">
                  Note: You are not signed in with Google. This tournament will be saved only in this browser until you sign in and claim it.
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-600 text-amber-100 hover:bg-[#050814] text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                  className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-amber-500/40 text-white text-sm font-semibold transition-colors"
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </div>
          )}

          {myTournaments.length === 0 && !showCreate && (
            <div className="text-center py-10 sketch-border bg-[#0b132b]/30 rounded-2xl text-amber-500/50">
              <Globe className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No personal tournaments yet.</p>
              <p className="text-xs mt-1">Click "New Tournament" to host your own, or browse Public Arenas below.</p>
            </div>
          )}

          <div className="space-y-3">
            {filteredMy.map(t => (
              <TournamentCard
                key={t.id}
                t={t}
                user={user}
                canEdit={!t.ownerUid || t.ownerUid === user?.uid || t.coAdminUids?.includes(user?.uid)}
                canDelete={!t.ownerUid || t.ownerUid === user?.uid}
                canClone={!t.ownerUid || t.ownerUid === user?.uid}
                onOpen={selectTournament}
                onEdit={handleStartEditTournament}
                onClone={handleClone}
                confirmDelete={confirmDelete}
                onRequestDelete={setConfirmDelete}
                onCancelDelete={() => setConfirmDelete(null)}
                onConfirmDelete={handleDelete}
              />
            ))}
          </div>
        </div>

        {/* Joined Tournaments (where user is Captain or Player) */}
        {filteredJoined.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-serif text-cyan-200 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Tournaments I&apos;m Playing In
            </h2>
            <div className="space-y-3">
              {filteredJoined.map(t => (
                <TournamentCard
                  key={t.id}
                  t={t}
                  user={user}
                  canEdit={false}
                  canDelete={false}
                  onOpen={selectTournament}
                />
              ))}
            </div>
          </div>
        )}

        {/* Public / Discoverable Arenas */}
        {hasCloud && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif text-amber-200/90 flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                Public Tournaments
              </h2>
              <button
                onClick={refreshPublicTournaments}
                disabled={loadingPublic}
                className="flex items-center gap-1.5 text-xs text-amber-400/80 hover:text-amber-300 px-2.5 py-1 rounded-lg bg-[#0b132b] border border-amber-900/40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingPublic ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {filteredDiscover.length === 0 ? (
              <p className="text-xs text-amber-500/40 py-4">
                {loadingPublic ? 'Loading public tournaments…' : 'No other public tournaments found right now.'}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredDiscover.map(t => (
                  <TournamentCard
                    key={t.id}
                    t={t}
                    user={user}
                    canEdit={false}
                    canDelete={false}
                    onOpen={selectTournament}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tip box */}
        <div className="sketch-border bg-[#050814]/60 rounded-xl p-4 text-xs font-serif text-amber-500/50 flex items-start gap-3">
          <Dices className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
          <p>Each tournament is isolated to its organizer &amp; co-admins, with separate players, teams, draft, matches, and awards.</p>
        </div>
      </main>

      {showOrgProfile && <OrganizerProfileModal onClose={() => setShowOrgProfile(false)} />}

      {/* Edit Tournament Modal */}
      {editingTournament && (
        <div className="fixed inset-0 bg-[#050814]/85 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="sketch-border bg-[#0b132b] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-amber-50">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif text-amber-200 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                Edit Tournament
              </h2>
              <button onClick={() => setEditingTournament(null)} className="text-amber-500/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-amber-500/60">Tournament Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-amber-500/60">Format</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {FORMAT_OPTIONS.map(opt => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setEditFormat(opt.value)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        editFormat === opt.value
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                          : 'border-gray-700 bg-[#050814] text-amber-500/60 hover:border-gray-600'
                      }`}
                    >
                      <div className="font-semibold text-xs">{opt.label}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingTournament(null)}
                className="flex-1 py-2 rounded-lg border border-gray-600 text-amber-100 hover:bg-[#050814] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditTournament}
                disabled={!editName.trim()}
                className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 text-white text-xs font-semibold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-[100]" onClick={() => setConfirmDelete(null)} />
      )}
    </div>
  );
}
