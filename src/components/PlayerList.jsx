import React, { useState, useMemo } from 'react';
import { useTournament } from '../context/TournamentContext';
import PlayerProfileModal from './PlayerProfileModal';
import {
  Search, Filter, Users, ChevronDown, X
} from 'lucide-react';

const POSITION_META = {
  ALL:  { label: 'All',  color: 'bg-[#050814] text-amber-500/60 border border-amber-900/30 hover:text-amber-200', activeColor: 'bg-amber-900/40 text-amber-200 border border-amber-500/40 shadow-sm' },
  GK:   { label: 'GK',   color: 'bg-[#050814] text-yellow-400/70 border border-yellow-500/30 hover:text-yellow-300', activeColor: 'bg-yellow-950/40 text-yellow-300 border border-yellow-500/60 shadow-sm' },
  DEF:  { label: 'DEF',  color: 'bg-[#050814] text-blue-400/70 border border-blue-500/30 hover:text-blue-300', activeColor: 'bg-blue-950/40 text-blue-300 border border-blue-500/60 shadow-sm' },
  MID:  { label: 'MID',  color: 'bg-[#050814] text-emerald-400/70 border border-emerald-500/30 hover:text-emerald-300', activeColor: 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/60 shadow-sm' },
  FWD:  { label: 'FWD',  color: 'bg-[#050814] text-red-400/70 border border-red-500/30 hover:text-red-300', activeColor: 'bg-red-950/40 text-red-300 border border-red-500/60 shadow-sm' },
  FLEX: { label: 'FLEX', color: 'bg-[#050814] text-purple-400/70 border border-purple-500/30 hover:text-purple-300', activeColor: 'bg-purple-950/40 text-purple-300 border border-purple-500/60 shadow-sm' },
};

const POS_BADGE = {
  GK:   'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  DEF:  'bg-blue-500/10   text-blue-400   border border-blue-500/30',
  MID:  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
  FWD:  'bg-red-500/10    text-red-400    border border-red-500/30',
  FLEX: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
};

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL',       label: 'All Warriors' },
  { value: 'UNDRAFTED', label: 'Free Agents' },
  { value: 'DRAFTED',   label: 'Enlisted' },
];

export default function PlayerList() {
  const { state } = useTournament();

  const players = Array.isArray(state?.players) ? state.players : [];
  const teams = Array.isArray(state?.teams) ? state.teams : [];

  const [posFilter, setPosFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  // Build set of all unique raw sub-tags across every player
  const allSubTags = useMemo(() => {
    const tags = new Set();
    players.forEach(p => p.rawPositions?.forEach(t => { if (t !== 'ANY') tags.add(t); }));
    return [...tags].sort();
  }, [players]);

  const [subTagFilter, setSubTagFilter] = useState(null);

  const filtered = useMemo(() => {
    return players.filter(p => {
      if (!p) return false;
      if (posFilter !== 'ALL' && p.position !== posFilter) return false;
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (subTagFilter && !p.rawPositions?.includes(subTagFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const tagMatch = p.rawPositions?.some(t => t.toLowerCase().includes(q));
        if (!nameMatch && !tagMatch) return false;
      }
      return true;
    });
  }, [players, posFilter, statusFilter, subTagFilter, search]);

  const selectedPlayer = players.find(p => p.id === selectedId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dashed border-amber-900/40 pb-4">
        <h2 className="text-2xl font-serif text-amber-200 flex items-center gap-3">
          <Users className="w-6 h-6 text-amber-500 stroke-[1.5]" />
          Warriors of the Realm
        </h2>
        <span className="text-xs font-mono tracking-widest text-amber-500/60 uppercase border border-amber-900/40 px-2 py-1 rounded bg-[#0b132b]/40">
          Showing: {filtered.length} / {players.length}
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search warrior scroll by title or role…"
          className="w-full bg-[#050814] border border-amber-900/50 rounded-xl pl-10 pr-10 py-3 text-sm text-amber-100 placeholder-amber-500/40 font-serif focus:outline-none focus:border-amber-500 shadow-inner"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-500/60 hover:text-amber-300">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Position category pills */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(POSITION_META).map(([key, meta]) => {
          const isActive = posFilter === key;
          return (
            <button
              key={key}
              onClick={() => { setPosFilter(key); setSubTagFilter(null); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-serif transition-all ${
                isActive ? meta.activeColor : meta.color
              }`}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Sub-tag pills (dynamic) */}
      {allSubTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {allSubTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSubTagFilter(subTagFilter === tag ? null : tag)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wider border transition-all ${
                subTagFilter === tag
                  ? 'bg-amber-400 text-gray-950 font-bold border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                  : 'bg-[#050814] text-amber-500/60 border-amber-900/30 hover:border-amber-700/50 hover:text-amber-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Status filter */}
      <div className="flex items-center gap-2 pt-1 border-t border-dashed border-amber-900/30">
        <Filter className="w-3.5 h-3.5 text-amber-500/50 shrink-0" />
        <div className="flex gap-1.5">
          {STATUS_FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-serif transition-colors ${
                statusFilter === opt.value
                  ? 'bg-amber-900/40 text-amber-200 border border-amber-500/40 shadow-sm'
                  : 'bg-[#050814]/60 text-amber-500/60 hover:text-amber-300 border border-amber-900/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Player grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 sketch-border rounded-2xl flex flex-col items-center">
          <Users className="w-12 h-12 mb-3 text-amber-900/40" />
          <p className="font-serif text-amber-500/60 text-lg">No warrior scrolls match this decree.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(player => {
            const team = teams.find(t => t.id === player.teamId);
            const isDrafted = player.status === 'DRAFTED';
            return (
              <button
                key={player.id}
                onClick={() => setSelectedId(player.id)}
                className="sketch-border w-full bg-[#0b132b]/60 p-3.5 rounded-xl flex items-center gap-3.5 hover:bg-[#0b132b]/90 transition-all text-left group"
              >
                {/* Avatar */}
                {player.avatar ? (
                  player.avatar.startsWith('http') || player.avatar.startsWith('data:image') ? (
                    <img
                      src={player.avatar}
                      alt={player.name}
                      className="w-11 h-11 rounded-xl object-cover border border-amber-500/30 shrink-0 shadow-sm"
                    />
                  ) : (
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border border-amber-500/30 bg-[#050814] shadow-sm"
                    >
                      {player.avatar}
                    </div>
                  )
                ) : (
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-mono font-bold text-amber-200 shrink-0 border border-amber-900/40 bg-[#050814]"
                  >
                    {player.name ? player.name.charAt(0).toUpperCase() : 'W'}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-serif font-bold text-amber-100 text-sm truncate group-hover:text-amber-300 transition-colors">
                    {player.name}
                    {player.jerseyNumber && (
                      <span className="ml-1.5 text-xs text-amber-500/60 font-mono font-normal">#{player.jerseyNumber}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {/* Primary position */}
                    <span className={`text-[9px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded border ${POS_BADGE[player.position] || POS_BADGE.FLEX}`}>
                      {player.position}
                    </span>
                    {/* Sub-position tags */}
                    {player.rawPositions?.filter(r => r !== 'ANY').map((rp, i) => (
                      <span key={i} className="text-[9px] px-1 py-0.5 rounded bg-[#050814] text-amber-500/50 font-mono border border-amber-900/30">
                        {rp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right side */}
                <div className="text-right shrink-0 space-y-1">
                  {isDrafted && team ? (
                    <span className="text-xs text-amber-400 block font-mono">{team.logo}</span>
                  ) : null}
                  <span className={`text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded border block ${
                    isDrafted
                      ? 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30'
                      : 'bg-[#050814] text-amber-500/50 border-amber-900/30'
                  }`}>
                    {player.status}
                  </span>
                  <span className={`text-[9px] font-mono tracking-widest uppercase block ${
                    player.availability === 'AVAILABLE' ? 'text-emerald-400' :
                    player.availability === 'INJURED' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {player.availability}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Player Profile Modal */}
      {selectedPlayer && (
        <PlayerProfileModal
          player={selectedPlayer}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
