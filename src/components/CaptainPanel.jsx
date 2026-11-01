import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import {
  Crown, Users, Edit3, Save, X, Palette, Shield, User,
  Type, Smile, ChevronDown, ChevronUp, Dices, Key, Eye, EyeOff, Check,
  Trash2, Link
} from 'lucide-react';

const POSITION_COLORS = {
  GK: 'bg-yellow-500/20 text-yellow-300',
  DEF: 'bg-blue-500/20 text-blue-300',
  MID: 'bg-green-500/20 text-green-300',
  FWD: 'bg-red-500/20 text-red-300',
  FLEX: 'bg-purple-500/20 text-purple-300',
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
      <div className="text-center py-12 text-gray-500">
        <Crown className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-lg font-medium">Captain not found</p>
        <p className="text-sm">Please login again from the navigation menu.</p>
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
    setPinSuccessMsg(`PIN successfully updated to ${cleanPin}!`);
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
    <div className="space-y-4">
      {/* Captain Header */}
      <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/10 border border-amber-500/20 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          {/* Captain Avatar or Team Logo */}
          {captain.avatar ? (
            captain.avatar.startsWith('http') || captain.avatar.startsWith('data:image') ? (
              <img src={captain.avatar} alt={captain.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/50 shadow-md shrink-0" />
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 border-amber-500/40 shadow-md shrink-0"
                style={{ backgroundColor: (team?.primaryColor || '#F59E0B') + '25' }}
              >
                {captain.avatar}
              </div>
            )
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 border-amber-500/40 shadow-md shrink-0"
              style={{ backgroundColor: (team?.primaryColor || '#F59E0B') + '25' }}
            >
              {team?.logo || '👑'}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white flex items-center gap-2 truncate">
              <Crown className="w-5 h-5 text-amber-400 shrink-0" />
              {captain.name}
            </h1>
            <p className="text-amber-300/80 text-sm font-semibold truncate">{team?.name || 'No team assigned'}</p>
            {team?.motto && (
              <p className="text-gray-400 text-xs italic mt-0.5 line-clamp-2">"{team.motto}"</p>
            )}
          </div>

          <button
            onClick={() => {
              setCapForm({ ...captain });
              setTeamForm(team ? { ...team, photo: team.photo || '' } : {});
              setModalTab('CAPTAIN');
              setEditingModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-950 shrink-0"
            title="Edit Captain Profile, Photo & Team"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile & Team</span>
          </button>
        </div>

        {/* Team Squad Photo Banner */}
        {team?.photo && (
          <div className="mt-4 rounded-xl overflow-hidden border border-amber-500/30 shadow-md relative h-36 bg-gray-900 group">
            <img
              src={team.photo}
              alt={team.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent flex items-end p-3">
              <span className="text-xs font-bold text-white drop-shadow flex items-center gap-1.5">
                📸 {team.name} Official Squad Photo
              </span>
            </div>
          </div>
        )}

        {/* Team stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-gray-900/40 rounded-lg p-2.5 text-center">
            <div className="text-lg font-bold text-white">{roster.length}</div>
            <div className="text-xs text-gray-400">Squad</div>
          </div>
          <div className="bg-gray-900/40 rounded-lg p-2.5 text-center">
            <div className="text-lg font-bold text-white">
              {roster.filter(p => p.availability === 'AVAILABLE').length}
            </div>
            <div className="text-xs text-gray-400">Available</div>
          </div>
          <div className="bg-gray-900/40 rounded-lg p-2.5 text-center">
            <div className="text-lg font-bold text-white">
              {state.matches.filter(m =>
                (m.teamAId === team?.id || m.teamBId === team?.id) && m.status === 'COMPLETED'
              ).length}
            </div>
            <div className="text-xs text-gray-400">Played</div>
          </div>
        </div>
      </div>

      {/* Security & PIN Change Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <Key className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Captain Login PIN</p>
              <p className="text-xs text-gray-400">Use this 4-digit PIN to login as team captain</p>
            </div>
          </div>

          {!editingPin && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-xl font-mono text-sm text-amber-400 font-bold">
                <span>{showPin ? captain.pin : '••••'}</span>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-gray-400 hover:text-white ml-1"
                  title={showPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => { setEditingPin(true); setNewPin(''); setPinErrorMsg(''); }}
                className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl transition-colors font-medium"
              >
                Change PIN
              </button>
            </div>
          )}
        </div>

        {pinSuccessMsg && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-2 rounded-xl">
            <Check className="w-4 h-4 shrink-0" />
            <span>{pinSuccessMsg}</span>
          </div>
        )}

        {editingPin && (
          <form onSubmit={handleSavePin} className="bg-gray-800/80 border border-amber-500/30 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400">Set New 4-Digit Captain PIN</span>
              <button
                type="button"
                onClick={() => setEditingPin(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                pattern="[0-9]*"
                maxLength={4}
                value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 1111"
                className="w-32 bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-white font-mono text-center tracking-widest text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                autoFocus
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <Save className="w-3.5 h-3.5" /> Save New PIN
              </button>
              <button
                type="button"
                onClick={() => setEditingPin(false)}
                className="text-gray-400 hover:text-white text-xs px-2.5 py-1.5 rounded-lg"
              >
                Cancel
              </button>
            </div>

            {pinErrorMsg && (
              <p className="text-xs text-red-400">{pinErrorMsg}</p>
            )}
          </form>
        )}
      </div>

      {/* Action banner */}
      <div className="bg-gradient-to-r from-amber-600/15 to-orange-600/10 border border-amber-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
        <Dices className="w-8 h-8 text-amber-400 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Ready to pick players?</p>
          <p className="text-xs text-gray-400">Switch to the <span className="text-amber-400 font-medium">Draft</span> tab to spin the wheel.</p>
        </div>
      </div>

      {/* Roster Section */}
      <div>
        <button
          onClick={() => setShowRoster(!showRoster)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            <Users className="w-4 h-4 text-amber-400" /> Squad Roster
            <span className="bg-gray-700 text-gray-400 text-xs px-2 py-0.5 rounded-full">{roster.length}</span>
          </span>
          {showRoster ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {showRoster && (
          <div className="space-y-1.5 mt-2">
            {roster.length === 0 ? (
              <div className="text-center py-6 text-gray-500 border border-dashed border-gray-800 rounded-xl">
                <p className="text-sm">No players drafted yet.</p>
                <p className="text-xs mt-1">Wait for the draft or ask your Admin.</p>
              </div>
            ) : (
              roster.map(player => (
                <div key={player.id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                  {player.avatar ? (
                    player.avatar.startsWith('http') || player.avatar.startsWith('data:image') ? (
                      <img src={player.avatar} alt={player.name} className="w-8 h-8 rounded-lg object-cover border border-gray-600 shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-sm shrink-0">
                        {player.avatar}
                      </div>
                    )
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300 shrink-0">
                      {player.jerseyNumber || '#'}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-white text-sm truncate block">{player.name}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${POSITION_COLORS[player.position]}`}>
                        {player.position}
                      </span>
                      {player.rawPositions?.filter(r => r !== 'ANY').map((rp, j) => (
                        <span key={j} className="text-xs px-1 py-0.5 rounded bg-gray-700 text-gray-400 font-mono">
                          {rp}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    player.availability === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-400' :
                    player.availability === 'INJURED' ? 'bg-red-500/10 text-red-400' :
                    'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {player.availability}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Unified Edit Modal: Captain Profile & Team Details */}
      {editingModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                Edit Profile & Team
              </h3>
              <button onClick={() => setEditingModal(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex gap-1 p-1 bg-gray-950 rounded-xl border border-gray-800">
              <button
                type="button"
                onClick={() => setModalTab('CAPTAIN')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  modalTab === 'CAPTAIN'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" /> Captain Profile
              </button>
              <button
                type="button"
                onClick={() => setModalTab('TEAM')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  modalTab === 'TEAM'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" /> Team Details
              </button>
            </div>

            {modalTab === 'CAPTAIN' ? (
              <div className="space-y-3">
                {/* Captain Photo / Avatar Section */}
                <div className="bg-gray-950/70 border border-gray-800 rounded-xl p-3.5 space-y-3">
                  <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <Smile className="w-3.5 h-3.5 text-amber-400" /> Captain Photo & Avatar
                  </label>

                  <div className="flex items-center gap-3">
                    {/* Avatar Preview */}
                    {capForm.avatar ? (
                      capForm.avatar.startsWith('http') || capForm.avatar.startsWith('data:image') ? (
                        <img src={capForm.avatar} alt="Captain" className="w-14 h-14 rounded-xl object-cover border-2 border-amber-500/50 shrink-0 shadow-md" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gray-800 border-2 border-amber-500/50 flex items-center justify-center text-3xl shrink-0 shadow-md">
                          {capForm.avatar}
                        </div>
                      )
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gray-800 border-2 border-gray-700 flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-md">
                        {(capForm.name || 'C').charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 space-y-2">
                      {/* URL Input */}
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1 flex items-center gap-1">
                          <Link className="w-3 h-3" /> Paste Photo URL
                        </label>
                        <input
                          value={capForm.avatar?.startsWith('data:') ? '' : (capForm.avatar?.startsWith('http') ? capForm.avatar : '')}
                          onChange={e => setCapForm(f => ({ ...f, avatar: e.target.value.trim() }))}
                          placeholder="https://example.com/photo.jpg"
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                        />
                      </div>
                      {capForm.avatar && (
                        <button
                          type="button"
                          onClick={() => setCapForm(f => ({ ...f, avatar: '' }))}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Emoji Presets */}
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 mb-1.5 flex items-center gap-1">
                      <Smile className="w-3 h-3 text-amber-400" /> Captain Emoji Badges:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {CAPTAIN_AVATAR_PRESETS.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setCapForm(f => ({ ...f, avatar: emoji }))}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                            capForm.avatar === emoji
                              ? 'bg-amber-500/30 border-2 border-amber-400 scale-110 shadow-lg'
                              : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Name & PIN */}
                <div>
                  <label className="text-xs text-gray-400 font-medium">Captain Name</label>
                  <input
                    value={capForm.name || ''}
                    onChange={e => setCapForm({ ...capForm, name: e.target.value })}
                    className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-medium">Captain 4-Digit Login PIN</label>
                  <input
                    maxLength={4}
                    value={capForm.pin || ''}
                    onChange={e => setCapForm({ ...capForm, pin: e.target.value.replace(/\D/g, '') })}
                    placeholder="4 digits"
                    className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-amber-400 font-mono text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Team Info */}
                <div>
                  <label className="text-xs text-gray-400 font-medium flex items-center gap-1">
                    <Type className="w-3.5 h-3.5 text-amber-400" /> Team Name
                  </label>
                  <input
                    value={teamForm.name || ''}
                    onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                    className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                {/* Team Logo / Badge */}
                <div className="bg-gray-950/70 border border-gray-800 rounded-xl p-3 space-y-2">
                  <label className="text-xs font-bold text-gray-300 flex items-center gap-1">
                    <Smile className="w-3.5 h-3.5 text-amber-400" /> Team Badge / Emoji
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      value={teamForm.logo || ''}
                      onChange={e => setTeamForm({ ...teamForm, logo: e.target.value })}
                      placeholder="e.g. ⚡"
                      className="w-14 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-center text-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="flex flex-wrap gap-1 flex-1">
                      {TEAM_LOGO_PRESETS.map(logo => (
                        <button
                          key={logo}
                          type="button"
                          onClick={() => setTeamForm({ ...teamForm, logo })}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-base transition-all ${
                            teamForm.logo === logo
                              ? 'bg-amber-500/30 border border-amber-400 scale-110'
                              : 'bg-gray-800 hover:bg-gray-700'
                          }`}
                        >
                          {logo}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Team Color */}
                <div className="bg-gray-950/70 border border-gray-800 rounded-xl p-3 space-y-2">
                  <label className="text-xs font-bold text-gray-300 flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-amber-400" /> Primary Team Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={teamForm.primaryColor || '#10B981'}
                      onChange={e => setTeamForm({ ...teamForm, primaryColor: e.target.value })}
                      className="w-10 h-8 rounded-lg border border-gray-700 cursor-pointer bg-transparent"
                    />
                    <span className="text-xs text-gray-400 font-mono">{teamForm.primaryColor}</span>
                    <div className="flex gap-1 ml-auto">
                      {COLOR_PRESETS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setTeamForm({ ...teamForm, primaryColor: c })}
                          className={`w-5 h-5 rounded-full border transition-all ${
                            teamForm.primaryColor === c ? 'border-white scale-125 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Motto */}
                <div>
                  <label className="text-xs text-gray-400 font-medium">Team Motto / Slogan</label>
                  <input
                    value={teamForm.motto || ''}
                    onChange={e => setTeamForm({ ...teamForm, motto: e.target.value })}
                    placeholder="e.g. Strike Fast, Win First"
                    className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Team Photo (via Link) */}
                <div className="bg-gray-950/70 border border-gray-800 rounded-xl p-3.5 space-y-3">
                  <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <Link className="w-3.5 h-3.5 text-amber-400" /> Team Photo / Squad Picture (via Link)
                  </label>

                  {/* Team Photo Preview */}
                  {teamForm.photo ? (
                    <div className="relative rounded-xl overflow-hidden border border-amber-500/40 bg-gray-900">
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
                        className="absolute top-2 right-2 bg-black/75 hover:bg-red-600/90 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors backdrop-blur-sm"
                        title="Remove Team Photo"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-700 rounded-xl p-3 text-center text-gray-500 text-xs">
                      No team photo added yet. Paste a photo link below.
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Paste Direct Image URL</label>
                    <input
                      value={teamForm.photo || ''}
                      onChange={e => setTeamForm({ ...teamForm, photo: e.target.value.trim() })}
                      placeholder="https://example.com/squad-photo.jpg"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">Direct link (JPG, PNG, WebP) to your team or squad photo.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setEditingModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAllEdits}
                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-950"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
