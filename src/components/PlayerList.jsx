import React, { useState, useMemo } from 'react';
import { useTournament } from '../context/TournamentContext';
import PlayerProfileModal from './PlayerProfileModal';
import {
  Search, Filter, Users, ChevronDown, X
} from 'lucide-react';

const POSITION_META = {
  ALL: { label: 'All', color: 'bg-gray-700 text-gray-200 hover:bg-gray-600', activeColor: 'bg-gray-100 text-gray-900' },
  GK: { label: 'GK', color: 'bg-yellow-500/15 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/30', activeColor: 'bg-yellow-500 text-gray-900' },
  DEF: { label: 'DEF', color: 'bg-blue-500/15 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30', activeColor: 'bg-blue-500 text-white' },
  MID: { label: 'MID', color: 'bg-green-500/15 text-green-300 hover:bg-green-500/30 border border-green-500/30', activeColor: 'bg-green-500 text-white' },
  FWD: { label: 'FWD', color: 'bg-red-500/15 text-red-300 hover:bg-red-500/30 border border-red-500/30', activeColor: 'bg-red-500 text-white' },
  FLEX: { label: 'FLEX', color: 'bg-purple-500/15 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30', activeColor: 'bg-purple-500 text-white' },
};

const POS_BADGE = {
  GK: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
  DEF: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
  MID: 'bg-green-500/20 text-green-300 border border-green-500/40',
  FWD: 'bg-red-500/20 text-red-300 border border-red-500/40',
  FLEX: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
};

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Players' },
  { value: 'UNDRAFTED', label: 'Undrafted' },
  { value: 'DRAFTED', label: 'Drafted' },
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          Players
          <span className="text-sm font-normal text-gray-500">({filtered.length}/{players.length})</span>
        </h2>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name or position…"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
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
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${isActive ? meta.activeColor : meta.color
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
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border transition-all ${subTagFilter === tag
                  ? 'bg-white text-gray-900 border-white'
                  : 'bg-gray-800 text-gray-400 border-gray-600 hover:border-gray-400 hover:text-gray-200'
                }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Status filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        <div className="flex gap-1.5">
          {STATUS_FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${statusFilter === opt.value
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Player grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border border-dashed border-gray-700 rounded-2xl">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No players match this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filtered.map(player => {
            const team = teams.find(t => t.id === player.teamId);
            const isDrafted = player.status === 'DRAFTED';
            return (
              <button
                key={player.id}
                onClick={() => setSelectedId(player.id)}
                className="flex items-center gap-3 px-3 py-3 bg-gray-800/50 border border-gray-700/60 hover:border-gray-500 rounded-xl text-left transition-all group"
              >
                {/* Avatar */}
                {player.avatar ? (
                  player.avatar.startsWith('http') || player.avatar.startsWith('data:image') ? (
                    <img
                      src={player.avatar}
                      alt={player.name}
                      className="w-10 h-10 rounded-lg object-cover border border-gray-600 shrink-0"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 border border-gray-600"
                      style={{ backgroundColor: (team?.primaryColor || '#6B7280') + '30' }}
                    >
                      {player.avatar}
                    </div>
                  )
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold text-white shrink-0 border border-gray-600"
                    style={{ backgroundColor: (team?.primaryColor || '#6B7280') + '30' }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                    {player.name}
                    {player.jerseyNumber && (
                      <span className="ml-1.5 text-xs text-gray-500 font-normal font-mono">#{player.jerseyNumber}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    {/* Primary position */}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${POS_BADGE[player.position] || POS_BADGE.FLEX}`}>
                      {player.position}
                    </span>
                    {/* Sub-position tags */}
                    {player.rawPositions?.filter(r => r !== 'ANY').map((rp, i) => (
                      <span key={i} className="text-[10px] px-1 py-0.5 rounded bg-gray-700 text-gray-400 font-mono">
                        {rp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right side */}
                <div className="text-right shrink-0 space-y-1">
                  {isDrafted && team ? (
                    <span className="text-xs text-gray-400 block">{team.logo}</span>
                  ) : null}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium block ${isDrafted
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-gray-700 text-gray-400'
                    }`}>
                    {player.status}
                  </span>
                  <span className={`text-[10px] block ${player.availability === 'AVAILABLE' ? 'text-emerald-500' :
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

