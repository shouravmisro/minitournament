import React, { useState } from 'react';
import { useGlobal, useOrganizer } from '../context/GlobalContext';
import {
  Trophy, Plus, Trash2, Play, Calendar, Users, Crown,
  ChevronRight, Settings, Globe, Dices, X, Edit3, Check,
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            Organizer Profile
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Your Name',  key: 'name',           placeholder: 'e.g. Shourav' },
            { label: 'Avatar URL', key: 'avatar',          placeholder: 'https://...' },
            { label: 'Bio',        key: 'bio',             placeholder: 'Organizer bio...' },
            { label: 'WhatsApp',   key: 'contactWhatsApp', placeholder: '+880...' },
            { label: 'Email',      key: 'email',           placeholder: 'you@example.com' },
          ].map(({ label, key, placeholder }) => (
            <div key={key} className="space-y-1">
              <label className="text-sm text-gray-400 font-medium">{label}</label>
              <input
                value={form[key] || ''}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 text-sm font-medium transition-colors">
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

export default function TournamentManager() {
  const { global, createTournament, deleteTournament, selectTournament } = useGlobal();
  const { organizer } = useOrganizer();

  const [showCreate, setShowCreate] = useState(false);
  const [showOrgProfile, setShowOrgProfile] = useState(false);
  const [newName, setNewName]       = useState('');
  const [newFormat, setNewFormat]   = useState('HYBRID');
  const [confirmDelete, setConfirmDelete] = useState(null);

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    createTournament(name, newFormat);
    setNewName('');
    setNewFormat('HYBRID');
    setShowCreate(false);
  }

  function handleDelete(id) {
    deleteTournament(id);
    setConfirmDelete(null);
  }

  // Get per-tournament player/team counts from their localStorage keys
  function getTournamentStats(id) {
    try {
      const raw = localStorage.getItem(`mt_state_${id}`);
      if (!raw) return { players: 0, teams: 0 };
      const s = JSON.parse(raw);
      return { players: s.players?.length ?? 0, teams: s.teams?.length ?? 0 };
    } catch { return { players: 0, teams: 0 }; }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span className="font-bold text-white text-lg">Mini Tournament</span>
          </div>
          <button
            onClick={() => setShowOrgProfile(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 hover:text-white transition-colors"
          >
            {organizer.avatar ? (
              <img src={organizer.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center text-xs font-bold text-white">
                {(organizer.name || 'O')[0].toUpperCase()}
              </div>
            )}
            <span className="hidden sm:inline">{organizer.name || 'Set Profile'}</span>
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600/20 via-gray-900 to-gray-900 border border-amber-500/20 p-6">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <h1 className="text-2xl font-bold text-white mb-1">
            {organizer.name ? `Welcome back, ${organizer.name}!` : 'Welcome to Mini Tournament'}
          </h1>
          <p className="text-gray-400 text-sm">
            {global.tournaments.length === 0
              ? 'Create your first tournament to get started.'
              : `You have ${global.tournaments.length} tournament${global.tournaments.length !== 1 ? 's' : ''} running.`}
          </p>
          {!organizer.name && (
            <button
              onClick={() => setShowOrgProfile(true)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" /> Set up your profile
            </button>
          )}
        </div>

        {/* Create Tournament */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Tournaments</h2>
            <button
              onClick={() => setShowCreate(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Tournament
            </button>
          </div>

          {showCreate && (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-white">Create Tournament</h3>

              <div className="space-y-1.5">
                <label className="text-sm text-gray-400">Tournament Name</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="e.g. Summer Football Cup 2025"
                  autoFocus
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-gray-400">Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {FORMAT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setNewFormat(opt.value)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        newFormat === opt.value
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                          : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <div className="font-semibold text-sm">{opt.label}</div>
                      <div className="text-xs opacity-70 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {/* Tournament List */}
          {global.tournaments.length === 0 && !showCreate && (
            <div className="text-center py-16 text-gray-500">
              <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No tournaments yet.</p>
              <p className="text-sm mt-1">Click "New Tournament" to get started.</p>
            </div>
          )}

          <div className="space-y-3">
            {global.tournaments.map(t => {
              const stats = getTournamentStats(t.id);
              const color = FORMAT_COLORS[t.format] || FORMAT_COLORS.HYBRID;
              return (
                <div
                  key={t.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-white truncate">{t.name}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
                          {t.format}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {stats.players} players
                        </span>
                        <span className="flex items-center gap-1">
                          <Crown className="w-3 h-3" /> {stats.teams} teams
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {confirmDelete === t.id ? (
                        <>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="text-xs px-2 py-1 rounded bg-red-700 text-white hover:bg-red-600 font-semibold"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setConfirmDelete(t.id)}
                            className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete tournament"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => selectTournament(t.id)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 hover:bg-amber-600 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
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
            })}
          </div>
        </div>

        {/* Tip box */}
        {global.tournaments.length > 0 && (
          <div className="rounded-xl bg-gray-900/60 border border-gray-800 p-4 text-sm text-gray-500 flex items-start gap-3">
            <Dices className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
            <p>Each tournament has its own players, teams, draft, matches, and awards — fully isolated.</p>
          </div>
        )}
      </main>

      {showOrgProfile && <OrganizerProfileModal onClose={() => setShowOrgProfile(false)} />}

      {/* Confirm delete overlay */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-[100]" onClick={() => setConfirmDelete(null)} />
      )}
    </div>
  );
}

