import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import {
  User, Edit3, Save, X, Shield, Calendar, MapPin, Phone,
  Heart, AlertTriangle, CircleDot, Trophy, Target, Zap, Award,
  Key, Eye, EyeOff, Check, Camera, Upload, Smile, Sparkles, Trash2
} from 'lucide-react';

const POSITION_COLORS = {
  GK: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  DEF: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  MID: 'bg-green-500/20 text-green-300 border-green-500/40',
  FWD: 'bg-red-500/20 text-red-300 border-red-500/40',
  FLEX: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
};

const AVAILABILITY_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available', icon: Heart, color: 'bg-emerald-600 hover:bg-emerald-500' },
  { value: 'INJURED', label: 'Injured', icon: AlertTriangle, color: 'bg-red-600 hover:bg-red-500' },
  { value: 'DOUBTFUL', label: 'Doubtful', icon: CircleDot, color: 'bg-yellow-600 hover:bg-yellow-500' },
];

const AVATAR_PRESETS = [
  '⚽', '⚡', '🔥', '🧤', '🦁', '🦅', '🎯', '🚀', '👑', '💎', '🐉', '🐺', '🛡️', '🏃', '🥇', '👟'
];

function compressImageFile(file, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 220;
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      callback(dataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

export default function PlayerPanel() {
  const { state, updatePlayer } = useTournament();
  const { authenticatedId, logout } = useAuth();

  const players = state?.players || [];
  const teams = state?.teams || [];
  const captains = state?.captains || [];
  const matches = state?.matches || [];
  const awardsList = state?.awards || [];

  const player = players.find(p => p.id === authenticatedId);
  const team = player?.teamId ? teams.find(t => t.id === player.teamId) : null;
  const captain = team ? captains.find(c => c.id === team.captainId) : null;
  const awards = awardsList.filter(a => player && a.winnerPlayerId === player.id);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  // PIN change state
  const [showPin, setShowPin] = useState(false);
  const [editingPin, setEditingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');
  const [pinErrorMsg, setPinErrorMsg] = useState('');

  if (!player) {
    return (
      <div className="text-center py-14 bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-500 max-w-md mx-auto space-y-3">
        <User className="w-12 h-12 mx-auto mb-2 text-blue-400/50" />
        <h3 className="text-lg font-bold text-white">Player Session Expired or Not Selected</h3>
        <p className="text-xs text-gray-400">
          Please select your player profile from the top-right menu and enter your 4-digit PIN.
        </p>
        <button
          onClick={logout}
          className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
        >
          Return to Public Hub
        </button>
      </div>
    );
  }

  const upcomingMatches = matches.filter(m =>
    player?.teamId && (m.teamAId === player.teamId || m.teamBId === player.teamId) &&
    m.status !== 'COMPLETED'
  );

  function handleSavePin(e) {
    e.preventDefault();
    setPinErrorMsg('');
    const cleanPin = newPin.replace(/\D/g, '');
    if (cleanPin.length !== 4) {
      setPinErrorMsg('PIN must be exactly 4 digits');
      return;
    }
    updatePlayer({ id: player.id, pin: cleanPin });
    setEditingPin(false);
    setNewPin('');
    setPinSuccessMsg(`PIN successfully updated to ${cleanPin}!`);
    setTimeout(() => setPinSuccessMsg(''), 4000);
  }

  return (
    <div className="space-y-4">
      {/* Player Card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
        {/* Card top accent */}
        <div
          className="h-2"
          style={{ backgroundColor: team?.primaryColor || '#3B82F6' }}
        />

        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            {player.avatar ? (
              player.avatar.startsWith('http') || player.avatar.startsWith('data:image') ? (
                <img src={player.avatar} alt={player.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-600 shadow-md shrink-0" />
              ) : (
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 border-gray-600 shadow-md shrink-0"
                  style={{ backgroundColor: (team?.primaryColor || '#3B82F6') + '30' }}
                >
                  {player.avatar}
                </div>
              )
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white border-2 border-gray-600 shadow-md shrink-0"
                style={{ backgroundColor: (team?.primaryColor || '#3B82F6') + '30' }}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white truncate">{player.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${POSITION_COLORS[player.position]}`}>
                  {player.position}
                </span>
                {player.rawPositions?.filter(r => r !== 'ANY').map((rp, i) => (
                  <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-400 font-mono">
                    {rp}
                  </span>
                ))}
                {player.jerseyNumber && (
                  <span className="text-xs text-amber-400 font-mono font-bold">#{player.jerseyNumber}</span>
                )}
              </div>
              {player.bio && (
                <p className="text-xs text-gray-400 mt-1 italic line-clamp-2">"{player.bio}"</p>
              )}
            </div>

            <button
              onClick={() => { setForm({ ...player }); setEditing(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600/30 to-orange-600/30 hover:from-amber-600/50 hover:to-orange-600/50 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all shrink-0"
              title="Edit Profile, Photo & Details"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
            {[
              { label: 'Matches', value: player.stats?.matches ?? 0, icon: Calendar },
              { label: 'Goals', value: player.stats?.goals ?? 0, icon: Target },
              { label: 'Assists', value: player.stats?.assists ?? 0, icon: Zap },
              { label: 'Clean S.', value: player.stats?.cleanSheets ?? 0, icon: Shield },
              { label: 'Saves', value: player.stats?.saves ?? 0, icon: Shield },
              { label: 'Rating', value: player.stats?.avgRating ? `${player.stats.avgRating}★` : '–', icon: Trophy },
            ].map(s => (
              <div key={s.label} className="bg-gray-800/60 rounded-lg p-2 text-center">
                <s.icon className="w-3.5 h-3.5 text-gray-500 mx-auto mb-0.5" />
                <div className="text-lg font-bold text-white">{s.value}</div>
                <div className="text-[10px] text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security & PIN Change Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <Key className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Player Login PIN</p>
              <p className="text-xs text-gray-400">Use this 4-digit PIN to login to your player profile</p>
            </div>
          </div>

          {!editingPin && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-xl font-mono text-sm text-blue-400 font-bold">
                <span>{showPin ? player.pin : '••••'}</span>
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
                className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-xl transition-colors font-medium"
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
          <form onSubmit={handleSavePin} className="bg-gray-800/80 border border-blue-500/30 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-400">Set New 4-Digit PIN</span>
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
                placeholder="e.g. 1234"
                className="w-32 bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-white font-mono text-center tracking-widest text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Availability Toggle */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">Matchday Availability</h3>
        <div className="grid grid-cols-3 gap-2">
          {AVAILABILITY_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isActive = player.availability === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => updatePlayer({ id: player.id, availability: opt.value })}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? `${opt.color} text-white ring-2 ring-white/20`
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Team Info */}
      {team && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Your Team</h3>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border"
              style={{
                backgroundColor: team.primaryColor + '20',
                borderColor: team.primaryColor + '40',
              }}
            >
              {team.logo}
            </div>
            <div>
              <p className="font-semibold text-white">{team.name}</p>
              {team.motto && <p className="text-xs text-gray-400 italic">"{team.motto}"</p>}
            </div>
          </div>
          {captain && (
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-800/50 rounded-lg px-3 py-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Captain: <span className="text-amber-300 font-medium">{captain.name}</span></span>
            </div>
          )}
        </div>
      )}

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-400" /> Upcoming Matches
          </h3>
          {upcomingMatches.map(match => {
            const teamA = state.teams.find(t => t.id === match.teamAId);
            const teamB = state.teams.find(t => t.id === match.teamBId);
            return (
              <div key={match.id} className="flex items-center justify-between bg-gray-800/50 rounded-xl px-3 py-2.5">
                <span className="text-sm text-white">
                  {teamA?.logo} {teamA?.name || '?'}
                </span>
                <span className="text-xs text-gray-500 font-medium bg-gray-700 px-2 py-0.5 rounded-full">
                  {match.stage} R{match.round}
                </span>
                <span className="text-sm text-white">
                  {teamB?.name || '?'} {teamB?.logo}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Awards */}
      {awards.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" /> Your Awards
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {awards.map(award => (
              <div key={award.id} className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{award.icon}</div>
                <p className="text-sm font-semibold text-amber-300">{award.title}</p>
                {award.statNote && <p className="text-xs text-gray-400 mt-0.5">{award.statNote}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                Edit Player Profile & Avatar
              </h3>
              <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Avatar Photo & Emoji Selection Section */}
            <div className="bg-gray-950/70 border border-gray-800 rounded-xl p-3.5 space-y-3">
              <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-400" /> Photo & Avatar
              </label>

              <div className="flex items-center gap-3">
                {/* Current Avatar Preview */}
                {form.avatar ? (
                  form.avatar.startsWith('http') || form.avatar.startsWith('data:image') ? (
                    <img src={form.avatar} alt="Avatar" className="w-14 h-14 rounded-xl object-cover border-2 border-amber-500/50 shrink-0 shadow-md" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-800 border-2 border-amber-500/50 flex items-center justify-center text-3xl shrink-0 shadow-md">
                      {form.avatar}
                    </div>
                  )
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gray-800 border-2 border-gray-700 flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-md">
                    {(form.name || 'P').charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Upload photo button */}
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) compressImageFile(file, dataUrl => setForm(f => ({ ...f, avatar: dataUrl })));
                        }}
                      />
                    </label>

                    {form.avatar && (
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, avatar: '' }))}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Clear
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500">Upload a selfie, photo from gallery, or choose an emoji below</p>
                </div>
              </div>

              {/* Emoji avatar presets */}
              <div>
                <p className="text-[11px] font-semibold text-gray-400 mb-1.5 flex items-center gap-1">
                  <Smile className="w-3 h-3 text-amber-400" /> Or Choose a Sports Emoji:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {AVATAR_PRESETS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, avatar: emoji }))}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                        form.avatar === emoji
                          ? 'bg-amber-500/30 border-2 border-amber-400 scale-110 shadow-lg'
                          : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Or paste Image URL */}
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Or Paste Image URL</label>
                <input
                  value={form.avatar?.startsWith('data:') ? '' : (form.avatar || '')}
                  onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>

            {/* Profile fields */}
            <div className="grid gap-3">
              <div>
                <label className="text-xs text-gray-400 font-medium">Display Name</label>
                <input
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 font-medium">Jersey Number</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={form.jerseyNumber ?? ''}
                    onChange={(e) => setForm({ ...form, jerseyNumber: e.target.value ? Number(e.target.value) : null })}
                    placeholder="e.g. 10"
                    className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium">Primary Position</label>
                  <select
                    value={form.position || 'FLEX'}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['GK', 'DEF', 'MID', 'FWD', 'FLEX'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-medium">Sub-positions / Roles (comma separated)</label>
                <input
                  value={(form.rawPositions || []).join(', ')}
                  onChange={(e) => setForm({ ...form, rawPositions: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) })}
                  placeholder="e.g. CAM, CM, RW"
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-medium">Bio / Player Motto</label>
                <input
                  value={form.bio || ''}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="e.g. Speedster on the wings, set-piece specialist"
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-medium">4-Digit Login PIN</label>
                <input
                  maxLength={4}
                  value={form.pin || ''}
                  onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })}
                  placeholder="4 digits"
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-amber-400 font-mono text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updatePlayer({
                    ...form,
                    jerseyNumber: form.jerseyNumber ? Number(form.jerseyNumber) : null,
                  });
                  setEditing(false);
                }}
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
