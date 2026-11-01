import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import {
  Crown, Users, Edit3, Save, X, Palette, Shield, User,
  Type, Smile, ChevronDown, ChevronUp, Dices, Key, Eye, EyeOff, Check,
  Trash2, Link
} from 'lucide-react';

const POSITION_COLORS = {
  GK:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  DEF:  'bg-blue-500/10 text-blue-400 border-blue-500/30',
  MID:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  FWD:  'bg-red-500/10 text-red-400 border-red-500/30',
  FLEX: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
};

const CAPTAIN_AVATAR_PRESETS = [
  '👑', '⚡', '🔥', '🦁', '🦅', '🎯', '🚀', '⚽', '🧤', '💎', '🐉', '🐺', '🛡️', '🥇'
];

const TEAM_LOGO_PRESETS = [
  '⚡', '🔥', '🦁', '🦅', '🎯', '🚀', '💎', '🐉', '🐺', '🛡️', '⚔️', '🌟'
];

const COLOR_PRESETS = [
  '#10B981', '#EF4444', '#3B82F6', '#F59E0B',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
];

export default function CaptainPanel() {
  const { state, updateTeam, updateCaptain } = useTournament();
  const { authenticatedId } = useAuth();

  const captain = state.captains.find(c => c.id === authenticatedId);
  const team = captain ? state.teams.find(t => t.id === captain.teamId) : null;
  const roster = team
    ? state.players.filter(p => team.rosterIds.includes(p.id) || p.teamId === team.id)
    : [];

  const [editingModal, setEditingModal] = useState(false);
  const [modalTab, setModalTab] = useState('CAPTAIN'); // 'CAPTAIN' | 'TEAM'
  const [capForm, setCapForm] = useState({});
  const [teamForm, setTeamForm] = useState({});
  const [showRoster, setShowRoster] = useState(true);

  // PIN change state
  const [showPin, setShowPin] = useState(false);
  const [editingPin, setEditingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');
  const [pinErrorMsg, setPinErrorMsg] = useState('');

  if (!captain) {
    return (
      <div className="text-center py-16 sketch-border rounded-2xl flex flex-col items-center">
        <Crown className="w-12 h-12 mb-3 text-amber-900/40" />
        <p className="font-serif text-lg text-amber-500/60">Faction Leader not ordained.</p>
        <p className="text-[10px] font-mono tracking-widest uppercase text-amber-500/40 mt-1">Please authenticate via the top navigation cipher.</p>
      </div>
    );
  }

  function handleSavePin(e) {
    e.preventDefault();
    setPinErrorMsg('');
    const cleanPin = newPin.replace(/\D/g, '');
    if (cleanPin.length !== 4) {
      setPinErrorMsg('PIN must be exactly 4 digits');
      return;
    }
    updateCaptain({ ...captain, pin: cleanPin });
    setEditingPin(false);
    setNewPin('');
    setPinSuccessMsg(`Cipher updated to ${cleanPin}!`);
    setTimeout(() => setPinSuccessMsg(''), 4000);
  }

  function handleSaveAllEdits() {
    updateCaptain({
      ...captain,
      ...capForm,
      name: capForm.name ? capForm.name.trim() : captain.name,
      avatar: capForm.avatar || '',
      pin: capForm.pin ? capForm.pin.replace(/\D/g, '') : captain.pin,
    });
    if (team) {
      updateTeam({
        ...team,
        ...teamForm,
        name: teamForm.name ? teamForm.name.trim() : team.name,
        photo: (teamForm.photo || '').trim(),
      });
    }
    setEditingModal(false);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* ── Captain Header Card ── */}
      <div className="sketch-border bg-[#0b132b]/80 p-6 rounded-2xl shadow-xl" style={{ borderRadius: '1.5rem 0.5rem 1.5rem 0.5rem' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {captain.avatar ? (
              captain.avatar.startsWith('http') || captain.avatar.startsWith('data:image') ? (
                <img src={captain.avatar} alt={captain.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-amber-500/40 shadow-[0_0_15px_rgba(217,119,6,0.15)] shrink-0" />
              ) : (
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl border border-amber-500/40 shadow-[0_0_15px_rgba(217,119,6,0.15)] shrink-0 bg-[#050814]"
                >
                  {captain.avatar}
                </div>
              )
            ) : (
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl border border-amber-500/40 shadow-[0_0_15px_rgba(217,119,6,0.15)] shrink-0 bg-[#050814]"
              >
                {team?.logo || '👑'}
              </div>
            )}

            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100 flex items-center gap-2 truncate">
                <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                {captain.name}
              </h1>
              <p className="text-xs font-mono tracking-widest uppercase text-cyan-400/90 mt-1 flex items-center gap-1.5 truncate">
                <Shield className="w-3 h-3 text-cyan-400" />
                {team?.name || 'No Faction Assigned'}
              </p>
              {team?.motto && (
                <p className="text-xs font-serif text-amber-500/50 italic mt-1 line-clamp-2">"{team.motto}"</p>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setCapForm({ ...captain });
              setTeamForm(team ? { ...team, photo: team.photo || '' } : {});
              setModalTab('CAPTAIN');
              setEditingModal(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#050814] hover:bg-amber-950/40 text-amber-300 border border-amber-500/40 rounded-xl font-serif text-sm transition-all shadow-[0_0_10px_rgba(217,119,6,0.15)] shrink-0"
            title="Edit Captain Profile, Photo & Team"
          >
            <Edit3 className="w-4 h-4 text-amber-400" />
            <span>Edit Profile &amp; Faction</span>
          </button>
        </div>

        {/* Team Squad Photo Banner if set */}
        {team?.photo && (
          <div className="mt-5 rounded-xl overflow-hidden border border-amber-500/30 shadow-lg relative h-36 sm:h-44 bg-[#050814] group">
            <img
              src={team.photo}
              alt={team.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050814]/90 via-transparent to-transparent flex items-end p-3.5">
              <span className="text-xs font-serif font-bold text-amber-200 drop-shadow flex items-center gap-1.5">
                📸 {team.name} Official Squad Scroll
              </span>
            </div>
          </div>
        )}

        {/* Team stats row */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-dashed border-amber-900/30">
          <div className="bg-[#050814]/40 border border-amber-900/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-mono font-bold text-amber-200">{roster.length}</div>
            <div className="text-[10px] font-mono tracking-widest uppercase text-amber-500/50 mt-0.5">Squad Total</div>
          </div>
          <div className="bg-[#050814]/40 border border-amber-900/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-mono font-bold text-emerald-300">
              {roster.filter(p => p.availability === 'AVAILABLE').length}
            </div>
            <div className="text-[10px] font-mono tracking-widest uppercase text-amber-500/50 mt-0.5">Combat Ready</div>
          </div>
          <div className="bg-[#050814]/40 border border-amber-900/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-mono font-bold text-cyan-300">
              {state.matches.filter(m =>
                (m.teamAId === team?.id || m.teamBId === team?.id) && m.status === 'COMPLETED'
              ).length}
            </div>
            <div className="text-[10px] font-mono tracking-widest uppercase text-amber-500/50 mt-0.5">Clashes Fought</div>
          </div>
        </div>
      </div>

      {/* ── Security & Cipher PIN Card ── */}
      <div className="sketch-border bg-[#050814]/60 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-950/40 border border-amber-500/30 rounded-xl">
            <Key className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="font-serif text-base text-amber-100 font-bold">Leader Cipher (Login PIN)</p>
            <p className="text-[10px] font-mono tracking-widest uppercase text-amber-500/50">4-digit code required to ordain faction commands</p>
          </div>
        </div>

        {!editingPin && (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-[#0b132b] border border-amber-900/50 px-3 py-1.5 rounded-xl font-mono text-sm text-amber-300 font-bold">
              <span>{showPin ? captain.pin : '••••'}</span>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-amber-500/60 hover:text-amber-300 ml-1 transition-colors"
                title={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => { setEditingPin(true); setNewPin(''); setPinErrorMsg(''); }}
              className="text-xs font-mono uppercase tracking-widest bg-cyan-950/30 hover:bg-cyan-950/50 text-cyan-300 border border-cyan-500/30 px-3 py-1.5 rounded-xl transition-colors"
            >
              Change
            </button>
          </div>
        )}

        {pinSuccessMsg && (
          <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-2 rounded-xl">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-serif">{pinSuccessMsg}</span>
          </div>
        )}

        {editingPin && (
          <form onSubmit={handleSavePin} className="bg-[#0b132b] border border-amber-500/30 rounded-xl p-3 flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              pattern="[0-9]*"
              maxLength={4}
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="1234"
              className="w-24 bg-[#050814] border border-amber-900/60 rounded-lg px-2 py-1.5 text-amber-200 font-mono text-center tracking-widest text-sm focus:outline-none focus:border-amber-500"
              autoFocus
            />
            <button
              type="submit"
              className="flex items-center gap-1 bg-emerald-600/40 hover:bg-emerald-600/60 border border-emerald-500/40 text-emerald-200 text-xs font-serif px-3 py-1.5 rounded-lg transition-colors"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
            <button
              type="button"
              onClick={() => setEditingPin(false)}
              className="text-amber-500/60 hover:text-amber-200 text-xs font-serif px-2 py-1.5"
            >
              Cancel
            </button>
            {pinErrorMsg && <p className="text-[10px] font-mono text-red-400 w-full">{pinErrorMsg}</p>}
          </form>
        )}
      </div>

      {/* ── Action Banner ── */}
      <div className="sketch-border bg-[#0b132b]/50 p-4 rounded-2xl flex items-center gap-3.5 shadow-md">
        <Dices className="w-7 h-7 text-amber-400 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-serif font-bold text-amber-100">Ready to Draft New Warriors?</p>
          <p className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60">
            Head to the <span className="text-amber-300 font-bold">Draft</span> scroll in the navigation tab to spin the wheel of fortune.
          </p>
        </div>
      </div>

      {/* ── Active Roster Section ── */}
      <div className="sketch-border bg-[#0b132b]/40 rounded-2xl overflow-hidden shadow-lg">
        <button
          onClick={() => setShowRoster(!showRoster)}
          className="w-full flex items-center justify-between p-4 bg-[#050814]/40 hover:bg-[#050814]/60 transition-colors border-b border-dashed border-amber-900/30"
        >
          <span className="flex items-center gap-2.5 font-serif text-lg text-amber-200">
            <Users className="w-5 h-5 text-amber-500" /> Active Faction Roster
            <span className="text-[10px] font-mono tracking-widest uppercase border border-amber-700/50 bg-amber-950/40 px-2 py-0.5 rounded text-amber-300">
              {roster.length} warriors
            </span>
          </span>
          {showRoster ? <ChevronUp className="w-5 h-5 text-amber-500/70" /> : <ChevronDown className="w-5 h-5 text-amber-500/70" />}
        </button>

        {showRoster && (
          <div className="p-4 space-y-2">
            {roster.length === 0 ? (
              <div className="text-center py-8 text-amber-500/40 font-serif border border-dashed border-amber-900/30 rounded-xl">
                <p className="text-base">No warriors drafted into this faction yet.</p>
                <p className="text-xs mt-1">Spin the auction draft wheel or consult the Admin council.</p>
              </div>
            ) : (
              roster.map(player => (
                <div key={player.id} className="flex items-center gap-3 p-3 bg-[#050814]/80 border border-amber-900/20 rounded-xl hover:border-amber-700/40 transition-colors">
                  {player.avatar ? (
                    player.avatar.startsWith('http') || player.avatar.startsWith('data:image') ? (
                      <img src={player.avatar} alt={player.name} className="w-10 h-10 rounded-lg object-cover border border-amber-900/50 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#0b132b] border border-amber-900/50 flex items-center justify-center text-lg shrink-0">
                        {player.avatar}
                      </div>
                    )
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#0b132b] border border-amber-900/50 flex items-center justify-center text-xs font-mono font-bold text-amber-400 shrink-0">
                      {player.jerseyNumber ? `#${player.jerseyNumber}` : (player.name?.charAt(0) || 'W')}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <span className="font-serif text-sm font-semibold text-amber-100 truncate block">{player.name}</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border ${POSITION_COLORS[player.position] || POSITION_COLORS.FLEX}`}>
                        {player.position}
                      </span>
                      {player.rawPositions?.filter(r => r !== 'ANY').map((rp, j) => (
                        <span key={j} className="text-[9px] font-mono text-amber-500/50 border border-amber-900/30 px-1 py-0.5 rounded">
                          {rp}
                        </span>
                      ))}
                    </div>
                  </div>

                  <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-1 rounded border shrink-0 ${
                    player.availability === 'AVAILABLE' ? 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30' :
                    player.availability === 'INJURED' ? 'bg-red-950/30 text-red-300 border-red-500/30' :
                    'bg-yellow-950/30 text-yellow-300 border-yellow-500/30'
                  }`}>
                    {player.availability}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Unified Edit Modal: Captain Profile & Team Details ── */}
      {editingModal && (
        <div className="fixed inset-0 bg-[#050814]/90 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="sketch-border bg-[#0b132b] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-dashed border-amber-900/40 pb-3">
              <h3 className="text-xl font-serif text-amber-200 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                Modify Ledger
              </h3>
              <button onClick={() => setEditingModal(false)} className="text-amber-500/60 hover:text-amber-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex gap-1.5 p-1 bg-[#050814] rounded-xl border border-amber-900/40">
              <button
                type="button"
                onClick={() => setModalTab('CAPTAIN')}
                className={`flex-1 py-2 rounded-lg text-xs font-serif transition-all flex items-center justify-center gap-1.5 ${
                  modalTab === 'CAPTAIN'
                    ? 'bg-amber-900/40 text-amber-200 border border-amber-500/40 shadow-sm'
                    : 'text-amber-500/50 hover:text-amber-200'
                }`}
              >
                <User className="w-3.5 h-3.5" /> Leader Scroll
              </button>
              <button
                type="button"
                onClick={() => setModalTab('TEAM')}
                className={`flex-1 py-2 rounded-lg text-xs font-serif transition-all flex items-center justify-center gap-1.5 ${
                  modalTab === 'TEAM'
                    ? 'bg-amber-900/40 text-amber-200 border border-amber-500/40 shadow-sm'
                    : 'text-amber-500/50 hover:text-amber-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" /> Faction Details
              </button>
            </div>

            {modalTab === 'CAPTAIN' ? (
              <div className="space-y-4">
                {/* Captain Photo / Avatar Section */}
                <div className="bg-[#050814]/70 border border-amber-900/30 rounded-xl p-4 space-y-3">
                  <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/70 flex items-center gap-1.5">
                    <Smile className="w-3.5 h-3.5 text-amber-400" /> Leader Emblem &amp; Avatar
                  </label>

                  <div className="flex items-center gap-3">
                    {capForm.avatar ? (
                      capForm.avatar.startsWith('http') || capForm.avatar.startsWith('data:image') ? (
                        <img src={capForm.avatar} alt="Captain" className="w-14 h-14 rounded-xl object-cover border border-amber-500/40 shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-[#0b132b] border border-amber-500/40 flex items-center justify-center text-3xl shrink-0">
                          {capForm.avatar}
                        </div>
                      )
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-[#0b132b] border border-amber-900/50 flex items-center justify-center text-2xl font-serif font-bold text-amber-200 shrink-0">
                        {(capForm.name || 'C').charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 space-y-2">
                      <div>
                        <label className="text-[10px] font-mono text-amber-500/60 block mb-1 flex items-center gap-1 uppercase tracking-wider">
                          <Link className="w-3 h-3 text-amber-400" /> Image URL Link
                        </label>
                        <input
                          value={capForm.avatar?.startsWith('data:') ? '' : (capForm.avatar?.startsWith('http') ? capForm.avatar : '')}
                          onChange={e => setCapForm(f => ({ ...f, avatar: e.target.value.trim() }))}
                          placeholder="https://example.com/photo.jpg"
                          className="w-full bg-[#0b132b] border border-amber-900/50 rounded-lg px-2.5 py-1.5 text-xs text-amber-100 focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                      {capForm.avatar && (
                        <button
                          type="button"
                          onClick={() => setCapForm(f => ({ ...f, avatar: '' }))}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-500/30 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Emoji Presets */}
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-amber-500/60 mb-2 flex items-center gap-1">
                      <Smile className="w-3 h-3 text-amber-400" /> Presets:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {CAPTAIN_AVATAR_PRESETS.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setCapForm(f => ({ ...f, avatar: emoji }))}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                            capForm.avatar === emoji
                              ? 'bg-amber-950/60 border border-amber-400 scale-110 shadow-[0_0_10px_rgba(217,119,6,0.3)]'
                              : 'bg-[#0b132b] border border-amber-900/30 hover:bg-amber-950/30'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/70">Leader Title / Name</label>
                  <input
                    value={capForm.name || ''}
                    onChange={e => setCapForm({ ...capForm, name: e.target.value })}
                    className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-amber-100 font-serif text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* PIN */}
                <div>
                  <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/70">Leader 4-Digit Cipher (PIN)</label>
                  <input
                    maxLength={4}
                    value={capForm.pin || ''}
                    onChange={e => setCapForm({ ...capForm, pin: e.target.value.replace(/\D/g, '') })}
                    placeholder="4 digits"
                    className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-amber-300 font-mono text-sm tracking-widest focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Team Info */}
                <div>
                  <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/70 flex items-center gap-1">
                    <Type className="w-3.5 h-3.5 text-amber-400" /> Faction Name
                  </label>
                  <input
                    value={teamForm.name || ''}
                    onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                    className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-amber-100 font-serif text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Team Logo / Badge */}
                <div className="bg-[#050814]/70 border border-amber-900/30 rounded-xl p-3.5 space-y-2">
                  <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/70 flex items-center gap-1">
                    <Smile className="w-3.5 h-3.5 text-amber-400" /> Faction Crest / Emoji
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      value={teamForm.logo || ''}
                      onChange={e => setTeamForm({ ...teamForm, logo: e.target.value })}
                      placeholder="e.g. ⚡"
                      className="w-14 bg-[#0b132b] border border-amber-900/50 rounded-lg px-2 py-1.5 text-center text-xl text-white focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex flex-wrap gap-1 flex-1">
                      {TEAM_LOGO_PRESETS.map(logo => (
                        <button
                          key={logo}
                          type="button"
                          onClick={() => setTeamForm({ ...teamForm, logo })}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-base transition-all ${
                            teamForm.logo === logo
                              ? 'bg-amber-950/60 border border-amber-400 scale-110 shadow-[0_0_8px_rgba(217,119,6,0.3)]'
                              : 'bg-[#0b132b] border border-amber-900/30 hover:bg-amber-950/30'
                          }`}
                        >
                          {logo}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Team Color */}
                <div className="bg-[#050814]/70 border border-amber-900/30 rounded-xl p-3.5 space-y-2">
                  <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/70 flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-amber-400" /> Faction Primary Hue
                  </label>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={teamForm.primaryColor || '#10B981'}
                      onChange={e => setTeamForm({ ...teamForm, primaryColor: e.target.value })}
                      className="w-10 h-8 rounded-lg border border-amber-900/50 cursor-pointer bg-transparent"
                    />
                    <span className="text-xs text-amber-400 font-mono">{teamForm.primaryColor}</span>
                    <div className="flex gap-1.5 ml-auto">
                      {COLOR_PRESETS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setTeamForm({ ...teamForm, primaryColor: c })}
                          className={`w-5 h-5 rounded-full border transition-all ${
                            teamForm.primaryColor === c ? 'border-amber-200 scale-125 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Motto */}
                <div>
                  <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/70">Faction Motto / Battle Cry</label>
                  <input
                    value={teamForm.motto || ''}
                    onChange={e => setTeamForm({ ...teamForm, motto: e.target.value })}
                    placeholder="e.g. Strike Fast, Win First"
                    className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-amber-100 font-serif text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Team Photo (via Link) */}
                <div className="bg-[#050814]/70 border border-amber-900/30 rounded-xl p-3.5 space-y-3">
                  <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/70 flex items-center gap-1.5">
                    <Link className="w-3.5 h-3.5 text-amber-400" /> Faction Squad Photo (via Link)
                  </label>

                  {/* Team Photo Preview */}
                  {teamForm.photo ? (
                    <div className="relative rounded-xl overflow-hidden border border-amber-500/40 bg-[#0b132b]">
                      <img
                        src={teamForm.photo}
                        alt="Team Photo Preview"
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setTeamForm(f => ({ ...f, photo: '' }))}
                        className="absolute top-2 right-2 bg-[#050814]/85 hover:bg-red-950/80 text-red-300 border border-red-500/40 px-2 py-1 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1 transition-colors backdrop-blur-sm"
                        title="Remove Team Photo"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-amber-900/40 rounded-xl p-3 text-center text-amber-500/40 font-serif text-xs">
                      No squad picture linked yet. Paste a link below.
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60 block mb-1">Direct Image URL</label>
                    <input
                      value={teamForm.photo || ''}
                      onChange={e => setTeamForm({ ...teamForm, photo: e.target.value.trim() })}
                      placeholder="https://example.com/squad-photo.jpg"
                      className="w-full bg-[#0b132b] border border-amber-900/50 rounded-lg px-2.5 py-1.5 text-xs text-amber-100 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <p className="text-[10px] font-mono text-amber-500/40 mt-1 uppercase tracking-wider">Direct web link (JPG, PNG, WebP) to your faction squad scroll.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-dashed border-amber-900/40">
              <button
                type="button"
                onClick={() => setEditingModal(false)}
                className="px-4 py-2 text-xs font-serif text-amber-500/70 hover:text-amber-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAllEdits}
                className="flex items-center gap-2 bg-amber-600/40 hover:bg-amber-600/60 border border-amber-500/50 text-amber-100 font-serif font-bold px-5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(217,119,6,0.2)]"
              >
                <Save className="w-4 h-4 text-amber-300" /> Seal Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
