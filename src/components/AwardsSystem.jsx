import React, { useState } from 'react';
import { useTournament, generateId } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import {
  Award, Plus, Trash2, Edit3, Save, X, ChevronDown,
  Trophy, Star, Search, Sparkles
} from 'lucide-react';

/* ── Default award presets (shown when creating a new award) ── */
const PRESETS = [
  { title: 'Best Player',    icon: '⭐' },
  { title: 'Top Scorer',     icon: '⚽' },
  { title: 'Best GK',        icon: '🧤' },
  { title: 'Best Defender',  icon: '🛡️' },
  { title: 'Best Midfielder',icon: '🎯' },
  { title: 'Playmaker',      icon: '🎪' },
  { title: 'Fair Play',      icon: '🤝' },
  { title: 'Puskás Goal',    icon: '🔥' },
  { title: 'Most Assists',   icon: '✨' },
  { title: 'Best Young',     icon: '🌱' },
];

/* ── Single award card ── */
function AwardCard({ award, editable, onEdit, onDelete }) {
  const { state } = useTournament();
  const winner = state.players.find(p => p.id === award.winnerPlayerId);
  const team   = winner ? state.teams.find(t => t.id === winner.teamId) : null;

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-gray-800/40 to-orange-500/5 border border-amber-500/25 rounded-2xl p-5 relative group transition-all hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10">
      {/* Icon */}
      <div className="text-4xl mb-3">{award.icon}</div>

      {/* Title */}
      <p className="text-sm font-bold text-amber-300 leading-tight">{award.title}</p>

      {/* Winner */}
      {winner ? (
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: (team?.primaryColor ?? '#6B7280') + '40' }}
            >
              {winner.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{winner.name}</p>
              {team && (
                <p className="text-[10px] text-gray-500">{team.logo} {team.name}</p>
              )}
            </div>
          </div>
          {award.statNote && (
            <p className="text-xs text-gray-500 mt-1.5 italic">{award.statNote}</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-600 mt-2 italic">No winner assigned</p>
      )}

      {/* Actions */}
      {editable && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(award)}
            className="p-1.5 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(award.id)}
            className="p-1.5 bg-gray-800 rounded-lg text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-500/50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Award editor modal ── */
function AwardEditor({ award, onSave, onClose }) {
  const { state } = useTournament();
  const isNew = !award?.id;

  const [form, setForm] = useState(award
    ? { ...award }
    : { title: '', icon: '🏆', winnerPlayerId: '', statNote: '', categoryType: 'CUSTOM' }
  );
  const [playerSearch, setPlayerSearch] = useState('');

  const filteredPlayers = state.players.filter(p =>
    !playerSearch || p.name.toLowerCase().includes(playerSearch.toLowerCase())
  );

  function applyPreset(p) {
    setForm(f => ({ ...f, title: p.title, icon: p.icon }));
  }

  function save() {
    if (!form.title.trim()) return;
    onSave({
      ...form,
      id: form.id ?? generateId('awd'),
      winnerPlayerId: form.winnerPlayerId || null,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{isNew ? 'Create Award' : 'Edit Award'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset chips (only for new) */}
        {isNew && (
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">Quick presets:</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map(p => (
                <button
                  key={p.title}
                  onClick={() => applyPreset(p)}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-amber-500/50 rounded-lg text-xs text-gray-300 transition-colors"
                >
                  {p.icon} {p.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {/* Icon + Title row */}
          <div className="flex gap-2">
            <div>
              <label className="text-xs text-gray-400">Icon</label>
              <input
                value={form.icon}
                onChange={e => setForm({ ...form, icon: e.target.value })}
                className="w-16 mt-1 bg-gray-800 border border-gray-600 rounded-lg px-2 py-2 text-white text-center text-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400">Award Title *</label>
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Best Player…"
                className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                autoFocus
              />
            </div>
          </div>

          {/* Player selector */}
          <div>
            <label className="text-xs text-gray-400">Winner (optional)</label>
            <div className="mt-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                value={playerSearch}
                onChange={e => setPlayerSearch(e.target.value)}
                placeholder="Search player…"
                className="w-full bg-gray-800 border border-gray-600 rounded-t-lg pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <select
              size={4}
              value={form.winnerPlayerId ?? ''}
              onChange={e => setForm({ ...form, winnerPlayerId: e.target.value })}
              className="w-full bg-gray-800 border border-gray-600 border-t-0 rounded-b-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">— No winner yet —</option>
              {filteredPlayers.map(p => {
                const team = state.teams.find(t => t.id === p.teamId);
                return (
                  <option key={p.id} value={p.id}>
                    {p.name}{team ? ` (${team.name})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Stat note */}
          <div>
            <label className="text-xs text-gray-400">Stat Note (optional)</label>
            <input
              value={form.statNote ?? ''}
              onChange={e => setForm({ ...form, statNote: e.target.value })}
              placeholder="e.g. 6 Goals, 3 Assists"
              className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!form.title.trim()}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold px-4 py-2 rounded-lg text-sm"
          >
            <Save className="w-4 h-4" /> {isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AwardsSystem({ publicView = false }) {
  const { state, addAward, updateAward, deleteAward } = useTournament();
  const { role } = useAuth();
  const isAdmin  = role === 'ADMIN' && !publicView;

  const [editorOpen, setEditorOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  function handleSave(award) {
    if (award.id && state.awards.find(a => a.id === award.id)) {
      updateAward(award);
    } else {
      addAward(award);
    }
  }

  function openCreate() { setEditTarget(null); setEditorOpen(true); }
  function openEdit(a)  { setEditTarget(a);    setEditorOpen(true); }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          {publicView ? 'Trophy Room' : 'Dynamic Awards'}
        </h2>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" /> Add Award
          </button>
        )}
      </div>

      {/* Awards grid */}
      {state.awards.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-gray-700 rounded-2xl text-gray-500">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-25" />
          <p className="text-base font-medium text-gray-400">No awards yet</p>
          {isAdmin
            ? <p className="text-sm mt-1">Click <span className="text-amber-400 font-medium">Add Award</span> to create the first one.</p>
            : <p className="text-sm mt-1">Awards will appear here once created by the organiser.</p>
          }
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {state.awards.map(a => (
            <AwardCard
              key={a.id}
              award={a}
              editable={isAdmin}
              onEdit={openEdit}
              onDelete={deleteAward}
            />
          ))}
        </div>
      )}

      {/* Admin preset hint */}
      {isAdmin && state.awards.length === 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Pre-built presets available</p>
            <p className="text-xs text-gray-400 mt-0.5">
              When you click <strong>Add Award</strong>, you'll see one-click presets for Best Player, Top Scorer, Best GK, Playmaker, Fair Play, and more.
            </p>
          </div>
        </div>
      )}

      {/* Editor modal */}
      {editorOpen && (
        <AwardEditor
          award={editTarget}
          onSave={handleSave}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}

