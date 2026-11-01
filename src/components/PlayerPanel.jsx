import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import {
  User, Edit3, Save, X, Shield, Calendar, Crown,
  Heart, AlertTriangle, CircleDot, Trophy, Target, Zap, Award,
  Key, Eye, EyeOff, Check, Smile, Trash2, Link
} from 'lucide-react';

const POSITION_COLORS = {
  GK:   'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  DEF:  'bg-blue-500/10   text-blue-400   border border-blue-500/30',
  MID:  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
  FWD:  'bg-red-500/10    text-red-400    border border-red-500/30',
  FLEX: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
};

const AVAILABILITY_OPTIONS = [
  { value: 'AVAILABLE', label: 'Combat Ready', icon: Heart,         color: 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40' },
  { value: 'INJURED',   label: 'Wounded',      icon: AlertTriangle, color: 'bg-red-950/40 text-red-300 border border-red-500/40'       },
  { value: 'DOUBTFUL',  label: 'Uncertain',    icon: CircleDot,     color: 'bg-yellow-950/40 text-yellow-300 border border-yellow-500/40' },
];

const AVATAR_PRESETS = [
  '⚽', '⚡', '🔥', '🧤', '🦁', '🦅', '🎯', '🚀', '👑', '💎', '🐉', '🐺', '🛡️', '🏃', '🥇', '👟',
];

export default function PlayerPanel() {
  const { state, updatePlayer } = useTournament();
  const { authenticatedId, logout } = useAuth();

  const players    = state?.players    || [];
  const teams      = state?.teams      || [];
  const captains   = state?.captains   || [];
  const matches    = state?.matches    || [];
  const awardsList = state?.awards     || [];

  const player  = players.find(p => p.id === authenticatedId);
  const team    = player?.teamId ? teams.find(t => t.id === player.teamId) : null;
  const captain = team ? captains.find(c => c.id === team.captainId) : null;
  const awards  = awardsList.filter(a => player && a.winnerPlayerId === player.id);

  // ── Edit modal state ──
  const [editing, setEditing]   = useState(false);
  const [form,    setForm]      = useState({});
  const [saveMsg, setSaveMsg]   = useState('');

  // ── PIN state ──
  const [showPin,       setShowPin]       = useState(false);
  const [editingPin,    setEditingPin]    = useState(false);
  const [newPin,        setNewPin]        = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');
  const [pinErrorMsg,   setPinErrorMsg]   = useState('');

  // ── URL preview error ──
  const [avatarUrlError, setAvatarUrlError] = useState(false);

  if (!player) {
    return (
      <div className="text-center py-16 sketch-border rounded-2xl flex flex-col items-center max-w-md mx-auto p-6 space-y-3">
        <User className="w-12 h-12 mx-auto mb-2 text-amber-500/50" />
        <h3 className="text-xl font-serif text-amber-200">Warrior Scroll Not Selected</h3>
        <p className="text-xs font-serif text-amber-500/60">
          Please select your warrior title from the navigation menu and enter your 4-digit cipher.
        </p>
        <button
          onClick={logout}
          className="mt-2 px-4 py-2 bg-[#050814] border border-amber-500/40 hover:bg-amber-950/40 text-amber-300 rounded-xl text-xs font-serif transition-colors"
        >
          Return to Grand Hub
        </button>
      </div>
    );
  }

  const upcomingMatches = matches.filter(m =>
    player?.teamId &&
    (m.teamAId === player.teamId || m.teamBId === player.teamId) &&
    m.status !== 'COMPLETED'
  );

  // ── Helpers ──
  function openEdit() {
    const rawPos = Array.isArray(player.rawPositions)
      ? player.rawPositions.filter(r => r !== 'ANY').join(', ')
      : '';
    setForm({
      id:                player.id,
      name:              player.name         || '',
      bio:               player.bio          || '',
      jerseyNumber:      player.jerseyNumber ?? '',
      position:          player.position     || 'FLEX',
      rawPositionsInput: rawPos,
      avatar:            player.avatar       || '',
      pin:               player.pin          || '',
    });
    setSaveMsg('');
    setAvatarUrlError(false);
    setEditing(true);
  }

  function handleSave() {
    if (!form.name?.trim()) return;
    if (form.pin && form.pin.replace(/\D/g, '').length !== 4) return;

    // Parse comma-separated roles cleanly
    const parsedRoles = (form.rawPositionsInput || '')
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);

    const cleaned = {
      ...player,
      ...form,
      name:         form.name.trim(),
      bio:          form.bio ? form.bio.trim() : '',
      jerseyNumber: (form.jerseyNumber !== '' && form.jerseyNumber !== null && form.jerseyNumber !== undefined)
                      ? Number(form.jerseyNumber) : null,
      pin:          form.pin ? form.pin.replace(/\D/g, '') : player.pin,
      position:     form.position || 'FLEX',
      rawPositions: parsedRoles.length > 0 ? parsedRoles : ['ANY'],
      avatar:       form.avatar || '',
    };
    delete cleaned.rawPositionsInput;

    updatePlayer(cleaned);
    setEditing(false);
    setSaveMsg('Warrior scroll updated!');
    setTimeout(() => setSaveMsg(''), 3000);
  }

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
    setPinSuccessMsg(`Cipher updated to ${cleanPin}!`);
    setTimeout(() => setPinSuccessMsg(''), 4000);
  }

  // Avatar display helper
  function AvatarDisplay({ avatar, name, size = 'w-16 h-16 sm:w-20 sm:h-20', textSize = 'text-2xl sm:text-3xl' }) {
    const isUrl = avatar && (avatar.startsWith('http') || avatar.startsWith('data:image'));
    const isEmoji = avatar && !isUrl;
    if (isUrl) return (
      <img src={avatar} alt={name}
        className={`${size} rounded-2xl object-cover border border-amber-500/40 shadow-[0_0_15px_rgba(217,119,6,0.15)] shrink-0`} />
    );
    if (isEmoji) return (
      <div className={`${size} rounded-2xl flex items-center justify-center ${textSize} border border-amber-500/40 shadow-[0_0_15px_rgba(217,119,6,0.15)] shrink-0 bg-[#050814]`}>
        {avatar}
      </div>
    );
    return (
      <div className={`${size} rounded-2xl flex items-center justify-center ${textSize} font-serif font-bold text-amber-200 border border-amber-500/40 shadow-[0_0_15px_rgba(217,119,6,0.15)] shrink-0 bg-[#050814]`}>
        {name ? name.charAt(0).toUpperCase() : 'W'}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">

      {/* ── Player Card ── */}
      <div className="sketch-border bg-[#0b132b]/80 rounded-2xl overflow-hidden shadow-xl" style={{ borderRadius: '1.5rem 0.5rem 1.5rem 0.5rem' }}>
        <div className="h-1.5" style={{ backgroundColor: team?.primaryColor || '#d97706' }} />

        <div className="p-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <AvatarDisplay avatar={player.avatar} name={player.name} />

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100 truncate">{player.name}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded border font-semibold ${POSITION_COLORS[player.position] || POSITION_COLORS.FLEX}`}>
                  {player.position}
                </span>
                {player.rawPositions?.filter(r => r !== 'ANY').map((rp, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-[#050814] text-amber-500/60 font-mono border border-amber-900/30">{rp}</span>
                ))}
                {player.jerseyNumber && (
                  <span className="text-xs text-amber-400 font-mono font-bold">#{player.jerseyNumber}</span>
                )}
              </div>
              {player.bio && (
                <p className="text-xs font-serif text-amber-500/60 mt-1.5 italic line-clamp-2">"{player.bio}"</p>
              )}
            </div>

            <button
              onClick={openEdit}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#050814] hover:bg-amber-950/40 text-amber-300 border border-amber-500/40 rounded-xl font-serif text-xs font-bold transition-all shadow-[0_0_10px_rgba(217,119,6,0.15)] shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Modify</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-5 pt-4 border-t border-dashed border-amber-900/30">
            {[
              { label: 'Clashes', value: player.stats?.matches ?? 0,    icon: Calendar, color: 'text-amber-200' },
              { label: 'Strikes', value: player.stats?.goals   ?? 0,    icon: Target,   color: 'text-cyan-300' },
              { label: 'Assists', value: player.stats?.assists  ?? 0,   icon: Zap,      color: 'text-emerald-300' },
              { label: 'Clean S.',value: player.stats?.cleanSheets ?? 0, icon: Shield,   color: 'text-purple-300' },
              { label: 'Saves',   value: player.stats?.saves    ?? 0,   icon: Shield,   color: 'text-blue-300' },
              { label: 'Mastery', value: player.stats?.avgRating ? `${player.stats.avgRating}★` : '–', icon: Trophy, color: 'text-amber-400' },
            ].map(s => (
              <div key={s.label} className="bg-[#050814]/40 border border-amber-900/20 rounded-xl p-2.5 text-center">
                <s.icon className="w-3.5 h-3.5 text-amber-500/50 mx-auto mb-1" />
                <div className={`text-lg font-mono font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[9px] font-mono tracking-widest uppercase text-amber-500/50">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save success toast */}
      {saveMsg && (
        <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs px-3.5 py-2.5 rounded-xl font-serif shadow-sm">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{saveMsg}</span>
        </div>
      )}

      {/* ── Security & Cipher PIN Card ── */}
      <div className="sketch-border bg-[#050814]/60 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-950/40 border border-cyan-500/30 rounded-xl">
            <Key className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="font-serif text-base text-amber-100 font-bold">Warrior Cipher (PIN)</p>
            <p className="text-[10px] font-mono tracking-widest uppercase text-amber-500/50">Required for warrior login and scroll authentication</p>
          </div>
        </div>

        {!editingPin && (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-[#0b132b] border border-amber-900/50 px-3 py-1.5 rounded-xl font-mono text-sm text-cyan-300 font-bold">
              <span>{showPin ? player.pin : '••••'}</span>
              <button type="button" onClick={() => setShowPin(!showPin)} className="text-amber-500/60 hover:text-amber-300 ml-1 transition-colors">
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
            <Check className="w-4 h-4 shrink-0 text-emerald-400" /><span>{pinSuccessMsg}</span>
          </div>
        )}

        {editingPin && (
          <form onSubmit={handleSavePin} className="bg-[#0b132b] border border-cyan-500/30 rounded-xl p-3 flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="1234"
              className="w-24 bg-[#050814] border border-cyan-900/60 rounded-lg px-2 py-1.5 text-cyan-200 font-mono text-center tracking-widest text-sm focus:outline-none focus:border-cyan-500"
              autoFocus
            />
            <button type="submit"
              className="flex items-center gap-1 bg-emerald-600/40 hover:bg-emerald-600/60 border border-emerald-500/40 text-emerald-200 text-xs font-serif px-3 py-1.5 rounded-lg transition-colors">
              <Save className="w-3.5 h-3.5" /> Save
            </button>
            <button type="button" onClick={() => setEditingPin(false)}
              className="text-amber-500/60 hover:text-amber-200 text-xs font-serif px-2 py-1.5">Cancel</button>
            {pinErrorMsg && <p className="text-[10px] font-mono text-red-400 w-full">{pinErrorMsg}</p>}
          </form>
        )}
      </div>

      {/* ── Availability Toggle ── */}
      <div className="sketch-border bg-[#0b132b]/50 rounded-2xl p-5 space-y-3">
        <h3 className="font-serif text-base text-amber-200 flex items-center gap-2">
          <Heart className="w-4 h-4 text-emerald-400" /> Matchday Battle Status
        </h3>
        <div className="grid grid-cols-3 gap-2.5">
          {AVAILABILITY_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isActive = player.availability === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => updatePlayer({ id: player.id, availability: opt.value })}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-serif transition-all ${
                  isActive
                    ? `${opt.color} shadow-[0_0_12px_rgba(217,119,6,0.15)]`
                    : 'bg-[#050814]/70 border border-amber-900/30 text-amber-500/50 hover:text-amber-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Team Info ── */}
      {team && (
        <div className="sketch-border bg-[#0b132b]/50 rounded-2xl p-5 space-y-3">
          <h3 className="font-serif text-base text-amber-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" /> Ordained Faction
          </h3>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-amber-500/40 bg-[#050814]">
              {team.logo}
            </div>
            <div>
              <p className="font-serif font-bold text-base text-amber-100">{team.name}</p>
              {team.motto && <p className="text-xs font-serif text-amber-500/60 italic">"{team.motto}"</p>}
            </div>
          </div>
          {captain && (
            <div className="flex items-center gap-2 text-xs font-serif text-amber-200/80 bg-[#050814]/60 border border-amber-900/30 rounded-xl px-3 py-2">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Faction Leader: <span className="text-amber-300 font-bold">{captain.name}</span></span>
            </div>
          )}
        </div>
      )}

      {/* ── Upcoming Matches ── */}
      {upcomingMatches.length > 0 && (
        <div className="sketch-border bg-[#0b132b]/50 rounded-2xl p-5 space-y-3">
          <h3 className="font-serif text-base text-amber-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" /> Impending Clashes
          </h3>
          <div className="space-y-2">
            {upcomingMatches.map(match => {
              const teamA = state.teams.find(t => t.id === match.teamAId);
              const teamB = state.teams.find(t => t.id === match.teamBId);
              return (
                <div key={match.id} className="flex items-center justify-between bg-[#050814]/70 border border-amber-900/30 rounded-xl px-3.5 py-2.5 font-serif text-xs">
                  <span className="text-amber-100 font-medium">{teamA?.logo} {teamA?.name || '?'}</span>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400 bg-amber-950/40 border border-amber-900/50 px-2.5 py-0.5 rounded-full">
                    {match.stage} • R{match.round}
                  </span>
                  <span className="text-amber-100 font-medium">{teamB?.name || '?'} {teamB?.logo}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Awards ── */}
      {awards.length > 0 && (
        <div className="sketch-border bg-[#0b132b]/50 rounded-2xl p-5 space-y-3">
          <h3 className="font-serif text-base text-amber-200 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> Honored Relics
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {awards.map(award => (
              <div key={award.id} className="bg-[#050814]/70 border border-amber-500/30 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">{award.icon}</div>
                <p className="font-serif text-xs font-bold text-amber-200">{award.title}</p>
                {award.statNote && <p className="text-[10px] font-serif text-amber-500/50 italic mt-0.5">{award.statNote}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editing && (
        <div className="fixed inset-0 bg-[#050814]/90 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="sketch-border bg-[#0b132b] rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[92vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-dashed border-amber-900/40 shrink-0">
              <h3 className="text-xl font-serif text-amber-200 flex items-center gap-2">
                <User className="w-5 h-5 text-amber-400" /> Modify Warrior Scroll
              </h3>
              <button onClick={() => setEditing(false)} className="text-amber-500/60 hover:text-amber-300 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">

              {/* ── Avatar Section ── */}
              <div className="bg-[#050814]/70 border border-amber-900/30 rounded-xl p-4 space-y-3">
                <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/70 flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-amber-400" /> Avatar / Emblem Image
                </label>

                {/* Preview */}
                <div className="flex items-center gap-3">
                  {form.avatar ? (
                    form.avatar.startsWith('http') || form.avatar.startsWith('data:image') ? (
                      <img
                        src={form.avatar}
                        alt="Avatar"
                        onError={() => setAvatarUrlError(true)}
                        onLoad={() => setAvatarUrlError(false)}
                        className="w-14 h-14 rounded-xl object-cover border border-amber-500/40 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-[#0b132b] border border-amber-500/40 flex items-center justify-center text-3xl shrink-0">
                        {form.avatar}
                      </div>
                    )
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-[#0b132b] border border-amber-900/50 flex items-center justify-center text-2xl font-serif font-bold text-amber-200 shrink-0">
                      {(form.name || 'W').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 space-y-1.5">
                    {/* URL input */}
                    <div>
                      <label className="text-[10px] font-mono text-amber-500/60 block mb-1 flex items-center gap-1 uppercase tracking-wider">
                        <Link className="w-3 h-3 text-amber-400" /> Direct Image Link
                      </label>
                      <input
                        value={form.avatar?.startsWith('data:') ? '' : (form.avatar?.startsWith('http') ? form.avatar : '')}
                        onChange={e => {
                          setAvatarUrlError(false);
                          setForm(f => ({ ...f, avatar: e.target.value.trim() }));
                        }}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full bg-[#0b132b] border border-amber-900/50 rounded-lg px-2.5 py-1.5 text-xs text-amber-100 focus:outline-none focus:border-amber-500 font-mono"
                      />
                      {avatarUrlError && (
                        <p className="text-[10px] font-mono text-red-400 mt-1 uppercase">Could not reach image URL</p>
                      )}
                    </div>
                    {form.avatar && (
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, avatar: '' }))}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-500/30 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Emoji Presets */}
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-amber-500/60 mb-2">Or choose a symbol badge:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {AVATAR_PRESETS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, avatar: emoji }))}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                          form.avatar === emoji
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

              {/* ── Profile Fields ── */}
              <div className="space-y-4">

                <div>
                  <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/70">Warrior Name / Title</label>
                  <input
                    value={form.name || ''}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your battle name"
                    className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-amber-100 font-serif text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/70">Jersey Number</label>
                    <input
                      type="number"
                      min="1" max="99"
                      value={form.jerseyNumber ?? ''}
                      onChange={e => setForm(f => ({ ...f, jerseyNumber: e.target.value }))}
                      placeholder="e.g. 10"
                      className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-amber-300 font-mono text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/70">Primary Vocation</label>
                    <select
                      value={form.position || 'FLEX'}
                      onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                      className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-amber-100 font-serif text-sm focus:outline-none focus:border-amber-500"
                    >
                      {['GK', 'DEF', 'MID', 'FWD', 'FLEX'].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/70 flex items-center justify-between">
                    <span>Sub-positions / Roles <span className="text-amber-500/40 font-normal">(comma separated)</span></span>
                    <span className="text-[9px] font-mono text-amber-500/50">e.g. CAM, RW, ST</span>
                  </label>
                  <input
                    value={form.rawPositionsInput ?? ''}
                    onChange={e => setForm(f => ({ ...f, rawPositionsInput: e.target.value }))}
                    placeholder="e.g. CAM, CM, RW"
                    className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-amber-200 font-mono text-sm focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] font-mono uppercase tracking-wider text-amber-500/40 mt-1">Separate roles with commas.</p>
                </div>

                <div>
                  <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/70">Warrior Motto / Battle Inscription</label>
                  <input
                    value={form.bio ?? ''}
                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="e.g. Fleet of foot, decisive in the crucible"
                    className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-amber-100 font-serif text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/70">4-Digit Warrior Cipher (PIN)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={form.pin ?? ''}
                    onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))}
                    placeholder="4 digits"
                    className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-amber-300 font-mono text-sm tracking-widest focus:outline-none focus:border-amber-500"
                  />
                  {form.pin && form.pin.length > 0 && form.pin.length < 4 && (
                    <p className="text-[10px] font-mono text-red-400 mt-1 uppercase">Cipher must be exactly 4 digits</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-dashed border-amber-900/40 shrink-0">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-xs font-serif text-amber-500/70 hover:text-amber-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!form.name?.trim() || (form.pin && form.pin.length > 0 && form.pin.length < 4)}
                onClick={handleSave}
                className="flex items-center gap-2 bg-amber-600/40 hover:bg-amber-600/60 border border-amber-500/50 disabled:opacity-30 text-amber-100 text-xs font-serif font-bold px-5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(217,119,6,0.2)]"
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
