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
    <div
      className="sketch-border bg-[#0b132b]/60 p-6 flex flex-col items-center text-center relative overflow-hidden group hover:bg-[#0b132b]/90 transition-all shadow-lg"
      style={{ borderRadius: '1rem 2.5rem 1rem 2.5rem' }}
    >
      <div className="absolute inset-0 bg-amber-500/5 blur-[20px] mix-blend-overlay rounded-full pointer-events-none" />

      {/* Icon */}
      <div className="text-4xl sm:text-5xl mb-3 relative z-10 drop-shadow-[0_0_12px_rgba(251,191,36,0.3)]">
        {award.icon}
      </div>

      {/* Title */}
      <h3 className="font-serif text-lg sm:text-xl text-amber-200 mb-2 relative z-10 leading-tight">
        {award.title}
      </h3>

      {/* Winner */}
      {winner ? (
        <div className="relative z-10 mt-auto pt-4 border-t border-dashed border-amber-900/30 w-full flex flex-col items-center">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-serif font-bold text-amber-200 border border-amber-700/40"
              style={{ backgroundColor: (team?.primaryColor ?? '#6B7280') + '30' }}
            >
              {winner.name.charAt(0)}
            </div>
            <div className="text-left">
              <p className="font-serif text-sm font-semibold text-amber-50 leading-tight">
                {winner.name}
              </p>
              {team && (
                <p className="text-[10px] font-mono tracking-widest uppercase text-cyan-400/80">
                  {team.logo} {team.name}
                </p>
              )}
            </div>
          </div>
          {award.statNote && (
            <p className="text-[11px] text-amber-500/60 mt-2 italic font-serif">
              "{award.statNote}"
            </p>
          )}
        </div>
      ) : (
        <p className="text-[10px] font-mono tracking-widest uppercase text-amber-500/40 mt-auto pt-4 border-t border-dashed border-amber-900/30 w-full">
          Unclaimed Relic
        </p>
      )}

      {/* Actions */}
      {editable && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            onClick={() => onEdit(award)}
            title="Edit Relic"
            className="p-1.5 bg-[#050814]/90 rounded-lg text-amber-400 hover:text-amber-200 border border-amber-700/40 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(award.id)}
            title="Shatter Relic"
            className="p-1.5 bg-[#050814]/90 rounded-lg text-red-400 hover:text-red-300 border border-red-900/50 transition-colors"
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
    <div
      className="fixed inset-0 bg-[#050814]/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="sketch-border bg-[#0b132b] rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-dashed border-amber-900/40 pb-3">
          <h3 className="font-serif text-2xl text-amber-200 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            {isNew ? 'Forge Relic' : 'Modify Relic'}
          </h3>
          <button
            onClick={onClose}
            className="text-amber-500/60 hover:text-amber-300 p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset chips (only for new) */}
        {isNew && (
          <div>
            <p className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60 mb-2">
              Relic Presets:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map(p => (
                <button
                  key={p.title}
                  onClick={() => applyPreset(p)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#050814]/70 hover:bg-amber-950/40 border border-amber-900/40 hover:border-amber-500/50 rounded-lg text-xs font-serif text-amber-200/80 transition-colors"
                >
                  <span>{p.icon}</span> <span>{p.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3.5">
          {/* Icon + Title row */}
          <div className="flex gap-2.5">
            <div>
              <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60">
                Icon
              </label>
              <input
                value={form.icon}
                onChange={e => setForm({ ...form, icon: e.target.value })}
                className="w-16 mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-2 py-2 text-amber-100 text-center text-xl focus:outline-none focus:border-amber-500 shadow-inner"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60">
                Relic Title *
              </label>
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Best Player / Golden Boot…"
                className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-amber-100 font-serif text-sm focus:outline-none focus:border-amber-500 shadow-inner"
                autoFocus
              />
            </div>
          </div>

          {/* Player selector */}
          <div>
            <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60">
              Anointed Champion (Optional)
            </label>
            <div className="mt-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-600" />
              <input
                value={playerSearch}
                onChange={e => setPlayerSearch(e.target.value)}
                placeholder="Search warriors of the realm…"
                className="w-full bg-[#050814] border border-amber-900/50 rounded-t-xl pl-8 pr-3 py-2 text-sm text-amber-100 font-serif focus:outline-none focus:border-amber-500"
              />
            </div>
            <select
              size={4}
              value={form.winnerPlayerId ?? ''}
              onChange={e => setForm({ ...form, winnerPlayerId: e.target.value })}
              className="w-full bg-[#050814] border border-amber-900/50 border-t-0 rounded-b-xl px-3 py-1.5 text-amber-100 text-sm font-serif focus:outline-none focus:border-amber-500"
            >
              <option value="" className="text-amber-500/50">— Unassigned —</option>
              {filteredPlayers.map(p => {
                const team = state.teams.find(t => t.id === p.teamId);
                return (
                  <option key={p.id} value={p.id} className="py-1">
                    {p.name}{team ? ` (${team.name})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Stat note */}
          <div>
            <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60">
              Chronicled Achievement (Optional)
            </label>
            <input
              value={form.statNote ?? ''}
              onChange={e => setForm({ ...form, statNote: e.target.value })}
              placeholder="e.g. 6 Goals, 3 Assists, Unbeaten Clean Sheet"
              className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-amber-100 font-serif text-sm focus:outline-none focus:border-amber-500 shadow-inner"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2 border-t border-dashed border-amber-900/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono tracking-widest uppercase text-amber-500/60 hover:text-amber-200 rounded-xl hover:bg-[#050814] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!form.title.trim()}
            className="flex items-center gap-2 bg-[#050814] border border-amber-500/50 text-amber-300 hover:bg-amber-950/40 disabled:border-amber-900/30 disabled:text-amber-500/30 font-serif px-5 py-2 rounded-xl text-sm transition-all shadow-[0_0_12px_rgba(217,119,6,0.2)]"
          >
            <Save className="w-4 h-4" /> {isNew ? 'Forge Relic' : 'Seal Inscription'}
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dashed border-amber-900/40 pb-4">
        <h2 className="text-2xl font-serif text-amber-200 flex items-center gap-3">
          <Trophy className="w-6 h-6 text-amber-500 stroke-[1.5]" />
          {publicView ? 'Hall of Relics' : 'Tournament Honors & Awards'}
        </h2>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#050814] border border-amber-500/40 text-amber-400 font-serif px-4 py-2 rounded-xl text-sm transition-all shadow-[0_0_10px_rgba(217,119,6,0.2)] hover:bg-amber-900/40 hover:text-amber-300"
          >
            <Plus className="w-4 h-4" /> Forge Relic
          </button>
        )}
      </div>

      {/* Awards grid */}
      {state.awards.length === 0 ? (
        <div className="text-center py-16 sketch-border rounded-2xl flex flex-col items-center">
          <Trophy className="w-12 h-12 mb-3 text-amber-900/40" />
          <p className="font-serif text-amber-500/60 text-lg">No relics forged yet in this realm.</p>
          {isAdmin ? (
            <p className="text-xs font-mono tracking-widest uppercase text-amber-500/40 mt-1">
              Select <span className="text-amber-400">Forge Relic</span> above to ordain tournament accolades.
            </p>
          ) : (
            <p className="text-xs font-mono tracking-widest uppercase text-amber-500/40 mt-1">
              Relics will be unveiled here once ordained by the Tournament Herald.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
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
        <div className="sketch-border bg-[#050814]/60 rounded-xl p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-serif text-amber-300">Da Vinci Relic Blueprints Available</p>
            <p className="text-xs font-serif text-amber-500/60 mt-0.5">
              Opening <strong>Forge Relic</strong> provides instant templates for Best Player, Top Scorer, Golden Glove, Playmaker, and Fair Play honors.
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
