import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { upsertUserProfile } from '../../services/firebase';
import ImageUploadButton from '../ImageUploadButton';
import PlayerRadarChart from '../PlayerRadarChart';
import {
  Users, Search, Award, Star, Target, Zap, Shield, X,
  Edit3, GitCompare, Check, Trophy
} from 'lucide-react';

const POSITIONS = ['ALL', 'GK', 'DEF', 'MID', 'FWD', 'FLEX'];

export default function PlayersDirectoryPage({ careerPlayers = [], onRefresh }) {
  const { user, userProfile } = useAuth();

  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('goals'); // goals | assists | matches | rating
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [comparePlayer, setComparePlayer] = useState(null);
  const [editingPassport, setEditingPassport] = useState(false);

  const [passportForm, setPassportForm] = useState({
    name: '',
    position: 'FLEX',
    preferredFoot: 'Right',
    city: '',
    bio: '',
    avatar: '',
  });
  const [savingPassport, setSavingPassport] = useState(false);

  const filtered = useMemo(() => {
    const list = careerPlayers.filter(p => {
      if (posFilter !== 'ALL' && p.position !== posFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q) ||
          p.tournaments?.some(t => t.toLowerCase().includes(q))
        );
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === 'assists') return (b.stats.assists || 0) - (a.stats.assists || 0);
      if (sortBy === 'matches') return (b.stats.matches || 0) - (a.stats.matches || 0);
      if (sortBy === 'rating')  return (b.stats.avgRating || 0) - (a.stats.avgRating || 0);
      return (b.stats.goals || 0) - (a.stats.goals || 0) || (b.stats.assists || 0) - (a.stats.assists || 0);
    });
    return list;
  }, [careerPlayers, posFilter, search, sortBy]);

  function openEditPassport() {
    setPassportForm({
      name: userProfile?.name || user?.displayName || '',
      position: userProfile?.position || 'FLEX',
      preferredFoot: userProfile?.preferredFoot || 'Right',
      city: userProfile?.city || '',
      bio: userProfile?.bio || '',
      avatar: userProfile?.avatar || user?.photoURL || '',
    });
    setEditingPassport(true);
  }

  async function savePassport(e) {
    e.preventDefault();
    if (!user?.uid || !passportForm.name.trim()) return;
    setSavingPassport(true);
    try {
      await upsertUserProfile(user, {
        ...passportForm,
        name: passportForm.name.trim(),
      });
      setEditingPassport(false);
      onRefresh?.();
    } finally {
      setSavingPassport(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="pro-card rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-400" /> Players &amp; Career Passports
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Cross-tournament player stats, attributes radar, and head-to-head player comparisons.
          </p>
        </div>

        {user && (
          <button
            type="button"
            onClick={openEditPassport}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit My Player Passport
          </button>
        )}
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-col md:flex-row gap-3 justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {POSITIONS.map(pos => (
            <button
              key={pos}
              type="button"
              onClick={() => setPosFilter(pos)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-colors ${
                posFilter === pos
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-[#0b132b] text-slate-300 border border-slate-800 hover:border-emerald-500/40'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search player or tournament..."
              className="w-full bg-[#050814] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-[#050814] border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-200 font-mono"
          >
            <option value="goals">Sort: Goals</option>
            <option value="assists">Sort: Assists</option>
            <option value="matches">Sort: Matches</option>
            <option value="rating">Sort: Rating</option>
          </select>
        </div>
      </div>

      {/* Players Grid */}
      {filtered.length === 0 ? (
        <div className="pro-glass rounded-2xl p-12 text-center text-xs text-slate-400">
          No player career records found matching your filter.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div
              key={p.key}
              onClick={() => { setSelectedPlayer(p); setComparePlayer(null); }}
              className="pro-card rounded-2xl p-4 cursor-pointer hover:border-emerald-400/50 transition-all space-y-3"
            >
              <div className="flex items-center gap-3">
                {p.avatar && (p.avatar.startsWith('http') || p.avatar.startsWith('data:image')) ? (
                  <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-amber-500/30 shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#050814] border border-amber-500/30 flex items-center justify-center font-bold text-amber-300 text-lg shrink-0">
                    {p.avatar || (p.name || 'P')[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white truncate">{p.name}</h3>
                    {p.uid && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    {p.position || 'FLEX'} • {p.tournamentsCount} tournament{p.tournamentsCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-800/80 text-center">
                <div>
                  <div className="text-sm font-mono font-bold text-white">{p.stats.matches}</div>
                  <div className="text-[9px] font-mono text-slate-500">MP</div>
                </div>
                <div>
                  <div className="text-sm font-mono font-bold text-emerald-400">{p.stats.goals}</div>
                  <div className="text-[9px] font-mono text-slate-500">G</div>
                </div>
                <div>
                  <div className="text-sm font-mono font-bold text-amber-300">{p.stats.assists}</div>
                  <div className="text-[9px] font-mono text-slate-500">A</div>
                </div>
                <div>
                  <div className="text-sm font-mono font-bold text-cyan-300">
                    {p.stats.avgRating > 0 ? p.stats.avgRating.toFixed(1) : '-'}
                  </div>
                  <div className="text-[9px] font-mono text-slate-500">RTG</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Career Passport + SVG Radar Comparison Modal ── */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-3 sm:p-5"
          onClick={e => { if (e.target === e.currentTarget) setSelectedPlayer(null); }}
        >
          <div className="pro-card bg-[#0b132b] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {selectedPlayer.avatar && (selectedPlayer.avatar.startsWith('http') || selectedPlayer.avatar.startsWith('data:image')) ? (
                  <img src={selectedPlayer.avatar} alt="" className="w-12 h-12 rounded-xl object-cover border border-amber-500/40" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#050814] border border-amber-500/40 flex items-center justify-center font-bold text-xl text-amber-300">
                    {selectedPlayer.avatar || (selectedPlayer.name || 'P')[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-white truncate">{selectedPlayer.name}</h3>
                  <p className="text-xs font-mono text-slate-400">
                    {selectedPlayer.position} {selectedPlayer.city ? `• ${selectedPlayer.city}` : ''} {selectedPlayer.preferredFoot ? `• ${selectedPlayer.preferredFoot} Foot` : ''}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedPlayer(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {selectedPlayer.bio && <p className="text-xs italic text-slate-300">&quot;{selectedPlayer.bio}&quot;</p>}

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                {[
                  { label: 'Matches', value: selectedPlayer.stats.matches, icon: Shield, color: 'text-white' },
                  { label: 'Goals',   value: selectedPlayer.stats.goals,   icon: Target, color: 'text-emerald-400' },
                  { label: 'Assists', value: selectedPlayer.stats.assists, icon: Zap,    color: 'text-amber-300' },
                  { label: 'Clean S.',value: selectedPlayer.stats.cleanSheets, icon: Shield, color: 'text-cyan-300' },
                  { label: 'MVPs',    value: selectedPlayer.stats.mvpCount, icon: Trophy, color: 'text-purple-300' },
                  { label: 'Rating',  value: selectedPlayer.stats.avgRating > 0 ? selectedPlayer.stats.avgRating.toFixed(1) : '-', icon: Star, color: 'text-amber-400' },
                ].map(s => (
                  <div key={s.label} className="bg-[#050814]/80 border border-slate-800 rounded-xl p-2.5">
                    <div className={`text-lg font-mono font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-[9px] font-mono uppercase text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* SVG Radar + Side-by-Side Comparison */}
              <div className="bg-[#050814]/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-mono uppercase text-amber-300 flex items-center gap-1.5">
                    <GitCompare className="w-4 h-4" /> Performance Radar &amp; Compare
                  </span>
                  <select
                    value={comparePlayer?.key || ''}
                    onChange={e => setComparePlayer(careerPlayers.find(x => x.key === e.target.value) || null)}
                    className="bg-[#0b132b] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white max-w-[200px]"
                  >
                    <option value="">-- Compare with player --</option>
                    {careerPlayers.filter(x => x.key !== selectedPlayer.key).map(x => (
                      <option key={x.key} value={x.key}>{x.name} ({x.position})</option>
                    ))}
                  </select>
                </div>

                <PlayerRadarChart playerA={selectedPlayer} playerB={comparePlayer} />
              </div>

              {/* Tournaments Played */}
              {selectedPlayer.tournaments?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" /> Competitions Played
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPlayer.tournaments.map((tName, idx) => (
                      <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-[#050814] border border-slate-800 text-slate-200">
                        {tName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit My Player Passport Modal ── */}
      {editingPassport && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="pro-card bg-[#0b132b] rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white">Edit Player Passport</h3>
              <button onClick={() => setEditingPassport(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={savePassport} className="space-y-3.5">
              <div className="flex items-center gap-3">
                <ImageUploadButton
                  storagePath="avatars/passports"
                  label="Upload Portrait"
                  onUploaded={url => setPassportForm(f => ({ ...f, avatar: url }))}
                />
                {passportForm.avatar && <img src={passportForm.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />}
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400">Display Name *</label>
                <input
                  required
                  value={passportForm.name}
                  onChange={e => setPassportForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full mt-1 bg-[#050814] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono uppercase text-slate-400">Primary Position</label>
                  <select
                    value={passportForm.position}
                    onChange={e => setPassportForm(f => ({ ...f, position: e.target.value }))}
                    className="w-full mt-1 bg-[#050814] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    {['GK', 'DEF', 'MID', 'FWD', 'FLEX'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase text-slate-400">Preferred Foot</label>
                  <select
                    value={passportForm.preferredFoot}
                    onChange={e => setPassportForm(f => ({ ...f, preferredFoot: e.target.value }))}
                    className="w-full mt-1 bg-[#050814] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    {['Right', 'Left', 'Both'].map(ft => <option key={ft} value={ft}>{ft}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400">City / Turf Hub</label>
                <input
                  value={passportForm.city}
                  onChange={e => setPassportForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="e.g. Dhaka"
                  className="w-full mt-1 bg-[#050814] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400">Player Bio</label>
                <textarea
                  rows={2}
                  value={passportForm.bio}
                  onChange={e => setPassportForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Playstyle, strengths..."
                  className="w-full mt-1 bg-[#050814] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingPassport(false)} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs">Cancel</button>
                <button type="submit" disabled={savingPassport} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {savingPassport ? 'Saving…' : 'Save Passport'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
