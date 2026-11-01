import React, { useState } from 'react';
import { useTournament, generateId, generatePin } from '../context/TournamentContext';
import OrganizerProfile from './OrganizerProfile';
import BulkDumpWizard   from './BulkDumpWizard';
import AwardsSystem     from './AwardsSystem';
import FirebaseSyncModal from './FirebaseSyncModal';
import { isFirebaseConfigured } from '../services/firebase';
import {
  Shield, Users, UserPlus, Crown, Trash2, Sparkles, Download, Upload,
  Key, Eye, EyeOff, Edit3, Save, X, AlertCircle, ChevronDown, ChevronUp,
  Settings, Dices, Trophy, Calendar, Copy, Check, Palette, Coins, UserCheck, Cloud,
  RefreshCw, BookOpen, ShieldCheck, History
} from 'lucide-react';

const POSITION_COLORS = {
  GK: 'bg-yellow-500/20 text-yellow-300',
  DEF: 'bg-blue-500/20 text-blue-300',
  MID: 'bg-green-500/20 text-green-300',
  FWD: 'bg-red-500/20 text-red-300',
  FLEX: 'bg-purple-500/20 text-purple-300',
};

const COLOR_PRESETS = [
  '#10B981', '#EF4444', '#3B82F6', '#F59E0B',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
  '#6366F1', '#84CC16', '#06B6D4', '#E11D48'
];

export default function AdminPanel() {
  const {
    state, dispatch,
    addPlayer, updatePlayer, deletePlayer, toggleCaptain, toggleOfficial,
    addCaptain, updateCaptain, deleteCaptain,
    addTeam, updateTeam, deleteTeam,
    exportState, importState, setAdminPin, resetState,
    setDraftMode, setDefaultBudget, recomputeStats, clearAuditLog,
  } = useTournament();

  const [showWizard, setShowWizard] = useState(false);
  const [showPins, setShowPins] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [playerForm, setPlayerForm] = useState({});
  const [editingCaptainId, setEditingCaptainId] = useState(null);
  const [captainForm, setCaptainForm] = useState({});
  const [expandedSection, setExpandedSection] = useState('organizer');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [newAdminPin, setNewAdminPin] = useState('');
  const [showAdminPinEdit, setShowAdminPinEdit] = useState(false);
  const [copiedCapPins, setCopiedCapPins] = useState(false);
  const [copiedPlayerPins, setCopiedPlayerPins] = useState(false);
  const [showCloudModal, setShowCloudModal] = useState(false);

  /* ── Copy PINs ── */
  function copyCaptainPins() {
    if (state.captains.length === 0) return;
    const text = state.captains.map(c => {
      const team = state.teams.find(t => t.id === c.teamId);
      return `👑 ${team?.name || 'Team'}: ${c.name} → PIN: ${c.pin}`;
    }).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedCapPins(true);
    setTimeout(() => setCopiedCapPins(false), 2000);
  }

  function copyPlayerPins() {
    if (state.players.length === 0) return;
    const text = state.players.map(p => `⚽ ${p.name} (${p.position}) → PIN: ${p.pin}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedPlayerPins(true);
    setTimeout(() => setCopiedPlayerPins(false), 2000);
  }

  /* ── Player CRUD ── */
  function handleAddPlayer() {
    const player = {
      id: generateId('plr'),
      name: 'New Player',
      pin: generatePin(),
      position: 'FLEX',
      rawPositions: ['ANY'],
      jerseyNumber: null,
      avatar: '',
      bio: '',
      status: 'UNDRAFTED',
      teamId: null,
      availability: 'AVAILABLE',
      stats: { matches: 0, goals: 0, assists: 0, cleanSheets: 0, saves: 0, avgRating: 0, mvpCount: 0 },
    };
    addPlayer(player);
    handleStartEditPlayer(player);
  }

  function handleStartEditPlayer(player) {
    const rawPos = Array.isArray(player.rawPositions)
      ? player.rawPositions.filter(r => r !== 'ANY').join(', ')
      : '';
    setEditingPlayer(player.id);
    setPlayerForm({
      ...player,
      pin: player.pin || generatePin(),
      jerseyNumber: player.jerseyNumber ?? '',
      rawPositions: player.rawPositions || [],
      rawPositionsInput: rawPos,
      status: player.status || 'UNDRAFTED',
      teamId: player.teamId || '',
      availability: player.availability || 'AVAILABLE',
      avatar: player.avatar || '',
      bio: player.bio || '',
      stats: {
        matches: player.stats?.matches ?? 0,
        goals: player.stats?.goals ?? 0,
        assists: player.stats?.assists ?? 0,
        cleanSheets: player.stats?.cleanSheets ?? 0,
        saves: player.stats?.saves ?? 0,
        avgRating: player.stats?.avgRating ?? 0,
        mvpCount: player.stats?.mvpCount ?? 0,
      },
    });
  }

  function handleSavePlayer() {
    const assignedTeamId = playerForm.teamId || null;
    const assignedStatus = assignedTeamId ? 'DRAFTED' : playerForm.status;

    const parsedRaw = (playerForm.rawPositionsInput ?? '')
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);

    const toSave = {
      ...playerForm,
      rawPositions: parsedRaw.length > 0 ? parsedRaw : ['ANY'],
      jerseyNumber: playerForm.jerseyNumber ? Number(playerForm.jerseyNumber) : null,
      teamId: assignedTeamId,
      status: assignedStatus,
    };
    delete toSave.rawPositionsInput;

    updatePlayer(toSave);
    setEditingPlayer(null);
  }

  /* ── Captain & Team CRUD ── */
  function handleCreateTeamWithCaptain() {
    const capId = generateId('cap');
    const teamId = generateId('team');
    const newCap = {
      id: capId,
      name: 'New Captain',
      pin: generatePin(),
      teamId,
      avatar: '',
    };
    const newTeam = {
      id: teamId,
      name: 'New Team',
      captainId: capId,
      logo: '⚡',
      primaryColor: '#3B82F6',
      motto: '',
      rosterIds: [],
      budget: state.defaultBudget || 1000,
      spent: 0,
    };
    addCaptain(newCap);
    addTeam(newTeam);
    handleStartEditCaptain(newCap);
  }

  function handleStartEditCaptain(cap) {
    const team = state.teams.find(t => t.id === cap.teamId) || {};
    setEditingCaptainId(cap.id);
    setCaptainForm({
      captainId: cap.id,
      captainName: cap.name || '',
      captainPin: cap.pin || '',
      captainAvatar: cap.avatar || '',
      teamId: team.id || '',
      teamName: team.name || '',
      teamLogo: team.logo || '⚡',
      teamColor: team.primaryColor || '#10B981',
      teamMotto: team.motto || '',
      teamPhoto: team.photo || '',
      teamBudget: team.budget ?? state.defaultBudget ?? 1000,
      teamSpent: team.spent ?? 0,
    });
  }

  function handleSaveCaptainAndTeam() {
    updateCaptain({
      id: captainForm.captainId,
      name: captainForm.captainName,
      pin: captainForm.captainPin,
      avatar: captainForm.captainAvatar,
    });

    if (captainForm.teamId) {
      updateTeam({
        id: captainForm.teamId,
        name: captainForm.teamName,
        logo: captainForm.teamLogo,
        primaryColor: captainForm.teamColor,
        motto: captainForm.teamMotto,
        photo: (captainForm.teamPhoto || '').trim(),
        budget: Number(captainForm.teamBudget),
        spent: Number(captainForm.teamSpent),
      });
    }
    setEditingCaptainId(null);
  }

  /* ── State export / import ── */
  function handleExport() {
    const data = exportState();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tournament_state.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const success = importState(ev.target.result);
        if (!success) alert('Invalid JSON file.');
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function SectionToggle({ id, label, icon: Icon, count }) {
    const isOpen = expandedSection === id;
    return (
      <button
        onClick={() => setExpandedSection(isOpen ? null : id)}
        className="w-full flex items-center justify-between px-5 py-3.5 sketch-border bg-[#0b132b]/70 hover:bg-[#0b132b]/90 rounded-2xl transition-all shadow-md font-serif"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-5 h-5 text-amber-400" />
          <span className="font-serif text-amber-200 text-base">{label}</span>
          {count !== undefined && (
            <span className="text-xs bg-[#050814] text-amber-400 border border-amber-900/40 px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase">
              {count}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-amber-500/60" /> : <ChevronDown className="w-4 h-4 text-amber-500/60" />}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Admin Panel Header */}
      <div className="sketch-border bg-[#0b132b]/80 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-serif text-amber-200">Magistrate's Grand Console</h1>
              <p className="text-xs text-amber-500/60">
                Full management: edit tournament, teams, captains, players, and match schedules.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 font-serif text-amber-100 px-4 py-2 rounded-xl text-sm transition-all shadow-lg shadow-amber-900/20"
          >
            <Sparkles className="w-4 h-4" /> Quick-Start Wizard
          </button>
        </div>
      </div>

      {/* ── 1. Tournament Info Section ── */}
      <SectionToggle id="organizer" label="Tournament Info & Details" icon={Settings} />
      {expandedSection === 'organizer' && (
        <OrganizerProfile editable={true} />
      )}

      {/* ── 2. Players Section (Full Edit) ── */}
      <SectionToggle id="players" label="Player Profiles & Roster" icon={Users} count={state.players.length} />
      {expandedSection === 'players' && (
        <div className="space-y-3">
          {/* Actions toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPins(!showPins)}
                className="flex items-center gap-1.5 text-xs text-amber-500/60 hover:text-white transition-colors bg-[#050814] px-2.5 py-1.5 rounded-lg border border-amber-900/30"
              >
                {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPins ? 'Hide' : 'Show'} PINs
              </button>
              {state.players.length > 0 && (
                <>
                  <button
                    onClick={copyPlayerPins}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1.5 rounded-lg border border-amber-500/30 transition-colors"
                    title="Copy player PINs list to clipboard"
                  >
                    {copiedPlayerPins ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPlayerPins ? 'Copied list!' : 'Copy Player PINs'}</span>
                  </button>
                  <button
                    onClick={() => {
                      recomputeStats();
                      alert('Player stats recomputed from all completed matches!');
                    }}
                    className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1.5 rounded-lg border border-purple-500/30 transition-colors"
                    title="Recalculate player stats from match events"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync Match Stats</span>
                  </button>
                </>
              )}
            </div>
            <button
              onClick={handleAddPlayer}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add Player
            </button>
          </div>

          {state.players.length === 0 ? (
            <div className="text-center py-8 text-amber-500/40">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No players added yet. Use Quick-Start to bulk dump!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {state.players.map(player => {
                const team = state.teams.find(t => t.id === player.teamId);
                const isEditing = editingPlayer === player.id;

                if (isEditing) {
                  return (
                    <div key={player.id} className="sketch-border bg-[#0b132b]/90 rounded-2xl p-5 space-y-4 shadow-2xl">
                      <div className="flex items-center justify-between border-b border-amber-900/30 pb-2">
                        <span className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
                          <Edit3 className="w-4 h-4" /> Edit Player: {player.name}
                        </span>
                        <button onClick={() => setEditingPlayer(null)} className="text-amber-500/60 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[11px] font-semibold text-amber-500/60">Full Name</label>
                          <input
                            type="text"
                            value={playerForm.name || ''}
                            onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                            className="w-full mt-1 bg-[#0b132b] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-amber-500/60">4-Digit PIN</label>
                          <input
                            type="text"
                            maxLength={4}
                            value={playerForm.pin || ''}
                            onChange={(e) => setPlayerForm({ ...playerForm, pin: e.target.value.replace(/\D/g, '') })}
                            className="w-full mt-1 bg-[#0b132b] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-amber-400 font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-amber-500/60">Primary Position</label>
                          <select
                            value={playerForm.position || 'FLEX'}
                            onChange={(e) => setPlayerForm({ ...playerForm, position: e.target.value })}
                            className="w-full mt-1 bg-[#0b132b] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-white text-sm"
                          >
                            {['GK', 'DEF', 'MID', 'FWD', 'FLEX'].map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[11px] font-semibold text-amber-500/60">Assigned Team</label>
                          <select
                            value={playerForm.teamId || ''}
                            onChange={(e) => setPlayerForm({ ...playerForm, teamId: e.target.value })}
                            className="w-full mt-1 bg-[#0b132b] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-white text-sm"
                          >
                            <option value="">None (Free Agent / Undrafted)</option>
                            {state.teams.map(t => (
                              <option key={t.id} value={t.id}>{t.logo} {t.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-amber-500/60">Status</label>
                          <select
                            value={playerForm.status || 'UNDRAFTED'}
                            onChange={(e) => setPlayerForm({ ...playerForm, status: e.target.value })}
                            className="w-full mt-1 bg-[#0b132b] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-white text-sm"
                          >
                            <option value="UNDRAFTED">UNDRAFTED</option>
                            <option value="DRAFTED">DRAFTED</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-amber-500/60">Availability</label>
                          <select
                            value={playerForm.availability || 'AVAILABLE'}
                            onChange={(e) => setPlayerForm({ ...playerForm, availability: e.target.value })}
                            className="w-full mt-1 bg-[#0b132b] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-white text-sm"
                          >
                            <option value="AVAILABLE">🟢 Available</option>
                            <option value="INJURED">🔴 Injured</option>
                            <option value="BUSY">🟡 Unavailable / Busy</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[11px] font-semibold text-amber-500/60">Jersey Number</label>
                          <input
                            type="number"
                            value={playerForm.jerseyNumber || ''}
                            onChange={(e) => setPlayerForm({ ...playerForm, jerseyNumber: e.target.value ? Number(e.target.value) : '' })}
                            placeholder="e.g. 10"
                            className="w-full mt-1 bg-[#0b132b] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-white text-sm"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-semibold text-amber-500/60">Sub-positions (comma separated)</label>
                          <input
                            type="text"
                            value={playerForm.rawPositionsInput ?? ''}
                            onChange={(e) => setPlayerForm({ ...playerForm, rawPositionsInput: e.target.value })}
                            placeholder="e.g. CM, ATM, CDM"
                            className="w-full mt-1 bg-[#0b132b] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-white text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-amber-500/60">Avatar Image URL</label>
                        <input
                          type="text"
                          value={playerForm.avatar || ''}
                          onChange={(e) => setPlayerForm({ ...playerForm, avatar: e.target.value })}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full mt-1 bg-[#0b132b] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-white text-sm"
                        />
                      </div>

                      {/* Performance Stats */}
                      <div className="bg-[#050814]/60 p-2.5 rounded-lg border border-amber-900/30">
                        <label className="text-[11px] font-semibold text-amber-500/60 block mb-1">Career / Tournament Stats</label>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 text-center text-xs">
                          {[
                            { key: 'matches', label: 'Matches' },
                            { key: 'goals', label: 'Goals' },
                            { key: 'assists', label: 'Assists' },
                            { key: 'cleanSheets', label: 'Clean Sheets' },
                            { key: 'saves', label: 'GK Saves' },
                            { key: 'avgRating', label: 'Avg Rating' },
                            { key: 'mvpCount', label: 'MVPs' },
                          ].map(s => (
                            <div key={s.key}>
                              <span className="text-[10px] text-amber-500/40 block truncate">{s.label}</span>
                              <input
                                type={s.key === 'avgRating' ? 'number' : 'number'}
                                step={s.key === 'avgRating' ? '0.1' : '1'}
                                min="0"
                                max={s.key === 'avgRating' ? '10' : '999'}
                                value={playerForm.stats?.[s.key] ?? 0}
                                onChange={e => setPlayerForm({
                                  ...playerForm,
                                  stats: { ...playerForm.stats, [s.key]: Number(e.target.value) }
                                })}
                                className="w-full bg-[#050814] border border-amber-900/40 rounded text-center py-1 text-white font-mono"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1 border-t border-amber-900/30">
                        <button
                          type="button"
                          onClick={() => setEditingPlayer(null)}
                          className="px-3 py-1.5 text-xs text-amber-500/60 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSavePlayer}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" /> Save Player
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={player.id} className="flex items-center justify-between px-3.5 py-2.5 sketch-border bg-[#050814]/60 rounded-xl border border-amber-900/30 hover:border-amber-700/50 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#0b132b] flex items-center justify-center font-bold text-xs text-white shrink-0 overflow-hidden">
                        {player.avatar ? (
                          <img src={player.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          player.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-serif text-amber-200 text-base truncate">{player.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${POSITION_COLORS[player.position] || POSITION_COLORS.FLEX}`}>
                            {player.position}
                          </span>
                          {player.jerseyNumber && (
                            <span className="text-[10px] text-amber-500/40 font-mono">#{player.jerseyNumber}</span>
                          )}
                          {player.isOfficial && (
                            <span className="text-[9px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded border bg-emerald-950/40 text-emerald-300 border-emerald-500/40 shadow-[0_0_6px_rgba(16,185,129,0.2)]">
                              Scribe
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-amber-500/60">
                          {showPins && (
                            <span className="font-mono text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded text-[11px]">
                              PIN: {player.pin}
                            </span>
                          )}
                          <span className="truncate">{team ? `${team.logo} ${team.name}` : 'Free Agent'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleStartEditPlayer(player)}
                        className="p-1.5 text-amber-500/60 hover:text-amber-400 rounded-lg hover:bg-[#0b132b] transition-colors"
                        title="Edit Player Profile"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleOfficial(player.id)}
                        className={`p-1.5 rounded-lg transition-colors border ${
                          player.isOfficial
                            ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                            : 'text-amber-500/30 border-transparent hover:text-emerald-400 hover:bg-[#0b132b]'
                        }`}
                        title={player.isOfficial ? 'Ordained Match Scribe (Click to Revoke)' : 'Appoint as Official Match Scribe (Can enter scores & ratings)'}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleCaptain(player.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          state.captains.some(c => c.name === player.name)
                            ? 'text-amber-400 hover:text-amber-500/60 hover:bg-[#0b132b]'
                            : 'text-gray-600 hover:text-amber-400 hover:bg-[#0b132b]'
                        }`}
                        title="Toggle Captain Status"
                      >
                        <Crown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deletePlayer(player.id)}
                        className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-[#0b132b] transition-colors"
                        title="Delete Player"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 3. Captains & Teams Section (Full Edit) ── */}
      <SectionToggle id="captains" label="Captains & Team Profiles" icon={Crown} count={state.captains.length} />
      {expandedSection === 'captains' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-500/60">
              Manage captain credentials, team branding, logo emoji, and budget.
            </span>
            <button
              onClick={handleCreateTeamWithCaptain}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Crown className="w-3.5 h-3.5" /> Add Team & Captain
            </button>
          </div>

          {state.captains.length === 0 ? (
            <div className="text-center py-8 text-amber-500/40">
              <Crown className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No teams or captains yet. Click "Add Team & Captain" above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {state.captains.map(cap => {
                const team = state.teams.find(t => t.id === cap.teamId) || {};
                const isEditing = editingCaptainId === cap.id;

                if (isEditing) {
                  return (
                    <div key={cap.id} className="sketch-border bg-[#0b132b]/90 rounded-2xl p-5 space-y-4 shadow-2xl">
                      <div className="flex items-center justify-between border-b border-amber-900/30 pb-2">
                        <span className="font-bold text-amber-400 text-sm flex items-center gap-2">
                          <Crown className="w-4 h-4" /> Edit Team: {team.name || cap.name}
                        </span>
                        <button onClick={() => setEditingCaptainId(null)} className="text-amber-500/60 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Captain info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-amber-100">Captain Name</label>
                          <input
                            type="text"
                            value={captainForm.captainName || ''}
                            onChange={e => setCaptainForm({ ...captainForm, captainName: e.target.value })}
                            className="w-full mt-1 bg-[#0b132b] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-amber-100">Captain PIN</label>
                          <input
                            type="text"
                            maxLength={4}
                            value={captainForm.captainPin || ''}
                            onChange={e => setCaptainForm({ ...captainForm, captainPin: e.target.value.replace(/\D/g, '') })}
                            className="w-full mt-1 bg-[#0b132b] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-amber-400 font-mono text-sm"
                          />
                        </div>
                      </div>

                      {/* Team branding */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-amber-100">Team Name</label>
                          <input
                            type="text"
                            value={captainForm.teamName || ''}
                            onChange={e => setCaptainForm({ ...captainForm, teamName: e.target.value })}
                            className="w-full mt-1 bg-[#0b132b] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-amber-100">Team Logo (Emoji)</label>
                          <input
                            type="text"
                            maxLength={4}
                            value={captainForm.teamLogo || ''}
                            onChange={e => setCaptainForm({ ...captainForm, teamLogo: e.target.value })}
                            className="w-full mt-1 bg-[#0b132b] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-white text-center text-lg"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-amber-100">Team Motto</label>
                          <input
                            type="text"
                            value={captainForm.teamMotto || ''}
                            onChange={e => setCaptainForm({ ...captainForm, teamMotto: e.target.value })}
                            placeholder="Victory or nothing"
                            className="w-full mt-1 bg-[#0b132b] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-white text-sm"
                          />
                        </div>
                      </div>

                      {/* Team Photo URL */}
                      <div>
                        <label className="text-xs font-semibold text-amber-100">Team Photo / Squad Picture (Image URL)</label>
                        <input
                          type="text"
                          value={captainForm.teamPhoto || ''}
                          onChange={e => setCaptainForm({ ...captainForm, teamPhoto: e.target.value })}
                          placeholder="https://example.com/team-squad.jpg"
                          className="w-full mt-1 bg-[#0b132b] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-white text-sm font-mono"
                        />
                      </div>

                      {/* Color Picker & Presets */}
                      <div>
                        <label className="text-xs font-semibold text-amber-100 block mb-1.5">Team Primary Color</label>
                        <div className="flex items-center gap-2 flex-wrap">
                          {COLOR_PRESETS.map(c => (
                            <button
                              type="button"
                              key={c}
                              onClick={() => setCaptainForm({ ...captainForm, teamColor: c })}
                              className="w-6 h-6 rounded-full border border-amber-900/40 hover:scale-110 transition-transform"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                          <input
                            type="color"
                            value={captainForm.teamColor || '#10B981'}
                            onChange={e => setCaptainForm({ ...captainForm, teamColor: e.target.value })}
                            className="w-8 h-8 rounded-lg bg-transparent cursor-pointer"
                          />
                          <span className="text-xs font-mono text-amber-500/60">{captainForm.teamColor}</span>
                        </div>
                      </div>

                      {/* Budget and Spent Coins */}
                      <div className="grid grid-cols-2 gap-3 bg-[#050814]/60 p-3 rounded-xl border border-amber-900/30">
                        <div>
                          <label className="text-xs font-semibold text-amber-100 flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-amber-400" /> Auction Budget (coins)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={captainForm.teamBudget ?? 1000}
                            onChange={e => setCaptainForm({ ...captainForm, teamBudget: Number(e.target.value) })}
                            className="w-full mt-1 bg-[#050814] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-white font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-amber-100">Spent in Auction</label>
                          <input
                            type="number"
                            min="0"
                            value={captainForm.teamSpent ?? 0}
                            onChange={e => setCaptainForm({ ...captainForm, teamSpent: Number(e.target.value) })}
                            className="w-full mt-1 bg-[#050814] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-white font-mono text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-amber-900/30">
                        <button
                          type="button"
                          onClick={() => setEditingCaptainId(null)}
                          className="px-3 py-1.5 text-xs text-amber-500/60 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveCaptainAndTeam}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" /> Save Changes
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={cap.id} className="flex items-center justify-between px-4 py-3 sketch-border bg-[#050814]/60 rounded-xl border border-amber-700/40 hover:border-amber-500/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border shrink-0"
                        style={{
                          backgroundColor: `${team.primaryColor || '#F59E0B'}25`,
                          borderColor: `${team.primaryColor || '#F59E0B'}60`
                        }}
                      >
                        {team.logo || '🛡️'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-amber-100 text-sm truncate">{team.name || cap.name}</span>
                          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                            <Crown className="w-3 h-3" /> {cap.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-amber-500/60 mt-0.5">
                          <span>{team.rosterIds?.length || 0} players</span>
                          <span className="text-emerald-400 font-mono">
                            💰 {(team.budget ?? 1000) - (team.spent ?? 0)} / {team.budget ?? 1000} coins
                          </span>
                          {showPins && (
                            <span className="text-amber-400 font-mono bg-amber-500/10 px-1 py-0.2 rounded text-[11px]">
                              PIN: {cap.pin}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleStartEditCaptain(cap)}
                        className="p-1.5 text-amber-500/60 hover:text-amber-400 rounded-lg hover:bg-[#0b132b] transition-colors"
                        title="Edit Captain & Team"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete team "${team.name || cap.name}" and captain "${cap.name}"?`)) {
                            deleteCaptain(cap.id);
                          }
                        }}
                        className="p-1.5 text-amber-500/40 hover:text-red-400 rounded-lg hover:bg-[#0b132b] transition-colors"
                        title="Delete Team & Captain"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 4. Official Scribes & Match Update Logbook ── */}
      <SectionToggle id="logbook" label="Official Scribes & Match Update Logbook" icon={BookOpen} count={state.auditLog?.length || 0} />
      {expandedSection === 'logbook' && (
        <div className="sketch-border bg-[#0b132b]/80 rounded-2xl p-5 space-y-6">
          {/* Subheader / Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-dashed border-amber-900/30 pb-4">
            <div>
              <h3 className="font-serif text-xl text-amber-200 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                Tournament Scribes & Audit Ledger
              </h3>
              <p className="text-xs font-serif text-amber-500/60 mt-0.5">
                Delegate score & rating authority to specific players. Every match update is chronicled below in real-time.
              </p>
            </div>
            {state.auditLog && state.auditLog.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Clear all entries from the match update logbook?')) {
                    clearAuditLog();
                  }
                }}
                className="text-xs font-serif text-red-400 hover:text-red-300 bg-red-950/30 border border-red-900/40 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Logbook
              </button>
            )}
          </div>

          {/* Scribe Delegation Bento */}
          <div className="sketch-border bg-[#050814]/70 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-serif text-sm font-semibold text-amber-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Appointed Match Scribes ({state.players.filter(p => p.isOfficial).length})
              </span>
              <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                {state.players.filter(p => p.isOfficial).length} Appointed
              </span>
            </div>
            <p className="text-xs font-serif text-amber-500/50">
              Appointed players can sign in with their individual Player PIN and log match scores, goals, assists, saves, and ratings from the Fixtures tab.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
              {state.players.map(p => {
                const team = state.teams.find(t => t.id === p.teamId);
                const isOff = Boolean(p.isOfficial);
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isOff
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                        : 'bg-[#0b132b]/50 border-amber-900/20 text-amber-100/70 hover:border-amber-700/40'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-serif text-sm font-semibold truncate text-amber-100">{p.name}</p>
                      <p className="text-[10px] font-mono text-amber-500/50 truncate">
                        {team ? `${team.logo} ${team.name}` : 'Free Agent'} • {p.position}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleOfficial(p.id)}
                      className={`text-xs font-serif px-2.5 py-1 rounded-lg transition-all shrink-0 border ${
                        isOff
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                          : 'bg-[#050814] text-amber-500/60 border-amber-900/40 hover:text-amber-200 hover:border-amber-600'
                      }`}
                    >
                      {isOff ? 'Scribe ✓' : '+ Appoint'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historical Logbook */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-serif text-sm font-semibold text-amber-100 flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                Chronicled Match Updates Log
              </span>
              <span className="text-[10px] font-mono text-amber-500/50 uppercase tracking-widest">
                {state.auditLog?.length || 0} Chronicles
              </span>
            </div>

            {(!state.auditLog || state.auditLog.length === 0) ? (
              <div className="text-center py-10 sketch-border rounded-xl bg-[#050814]/40 flex flex-col items-center justify-center p-4">
                <BookOpen className="w-8 h-8 text-amber-900/40 mb-2" />
                <p className="font-serif text-amber-500/50 text-sm">No match updates logged yet.</p>
                <p className="text-[10px] font-mono text-amber-500/30 uppercase tracking-widest mt-0.5">
                  Any score or performance updated by Admin or an appointed Scribe will appear here.
                </p>
              </div>
            ) : (
              <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
                {state.auditLog.map(log => {
                  const dateStr = log.timestamp
                    ? new Date(log.timestamp).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })
                    : 'Just now';
                  const isAdm = log.userRole === 'ADMIN';

                  return (
                    <div
                      key={log.id}
                      className="sketch-border bg-[#050814]/70 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:bg-[#050814]/90 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase border ${
                            log.action === 'SCORED_MATCH'
                              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                              : log.action === 'KNOCKOUT_SCORED'
                              ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                              : 'bg-purple-950/40 text-purple-300 border-purple-500/40'
                          }`}>
                            {log.action === 'SCORED_MATCH' ? 'Match Scored' : log.action === 'KNOCKOUT_SCORED' ? 'Knockout Scored' : 'Fixture Edited'}
                          </span>
                          <span className="font-serif font-bold text-amber-100 text-sm">
                            {log.summary}
                          </span>
                        </div>
                        <p className="text-amber-500/60 font-serif text-[11px]">
                          {log.details}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 gap-1 pt-1 sm:pt-0 border-t sm:border-0 border-dashed border-amber-900/30">
                        <span className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full border ${
                          isAdm
                            ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                        }`}>
                          <UserCheck className="w-3 h-3" /> {log.userName || (isAdm ? 'Admin' : 'Official Scribe')}
                        </span>
                        <span className="font-mono text-[10px] text-amber-500/40">{dateStr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 5. Draft Engine Section ── */}
      <SectionToggle id="draft" label="Draft Engine & Auction Rules" icon={Dices} />
      {expandedSection === 'draft' && (
        <div className="sketch-border bg-[#0b132b]/70 rounded-2xl p-6 border-dashed border-amber-900/30 space-y-4">
          <div className="flex items-start gap-4">
            <Dices className="w-10 h-10 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-serif text-xl text-amber-200">Draft Engine Settings</h3>
              <p className="text-sm text-amber-500/60 mt-0.5">
                Switch between Auction Draft mode and Free Pick mode. Head to the <span className="text-amber-400 font-semibold">Draft</span> tab in the navbar to spin the wheel.
              </p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-amber-500/40 uppercase tracking-wider">Draft Mode</p>
            <div className="flex gap-2">
              {[
                { id: 'AUCTION', label: '🪙 Auction', desc: 'Captains bid from budget' },
                { id: 'FREE',    label: '🎰 Free Pick', desc: 'Admin assigns directly' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setDraftMode && setDraftMode(opt.id)}
                  className={`flex-1 p-3 rounded-xl border text-left transition-all ${
                    state.draftMode === opt.id
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                      : 'border-amber-900/30 bg-[#050814] text-amber-500/60 hover:border-gray-500'
                  }`}
                >
                  <p className="font-semibold text-sm">{opt.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Budget Setting */}
          {state.draftMode === 'AUCTION' && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-amber-500/40 uppercase tracking-wider">Default Starting Budget</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={100}
                  max={10000}
                  step={50}
                  value={state.defaultBudget ?? 1000}
                  onChange={e => setDefaultBudget && setDefaultBudget(Number(e.target.value))}
                  className="w-28 bg-[#050814] border border-amber-900/40 rounded-lg px-3 py-2 text-white text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-sm text-amber-500/60">coins</span>
              </div>
            </div>
          )}

          {/* Captain PIN Reference */}
          {state.captains.length > 0 && (
            <div className="border-t border-amber-900/30/60 pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-amber-500/60 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" /> Captain PIN Reference
                </p>
                <button
                  onClick={copyCaptainPins}
                  className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg transition-colors border border-amber-500/30"
                  title="Copy captain PINs for WhatsApp"
                >
                  {copiedCapPins ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCapPins ? 'Copied PIN list!' : 'Copy for WhatsApp'}</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {state.captains.map(cap => {
                  const team = state.teams.find(t => t.id === cap.teamId);
                  return (
                    <div key={cap.id} className="flex items-center justify-between bg-[#050814]/60 rounded-lg px-3 py-2 border border-amber-900/30">
                      <span className="text-xs text-white truncate">{team?.logo} {cap.name}</span>
                      <span className="font-mono text-amber-400 text-xs bg-amber-500/10 px-2 py-0.5 rounded font-bold">
                        {cap.pin}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 5. Admin Settings & Master Controls ── */}
      <SectionToggle id="settings" label="Admin Master PIN & Data Management" icon={Key} />
      {expandedSection === 'settings' && (
        <div className="space-y-4 sketch-border bg-[#0b132b]/70 rounded-2xl p-6 border-dashed border-amber-900/30">
          {/* Admin Master PIN */}
          <div>
            <label className="text-xs font-semibold text-amber-500/60 uppercase tracking-wider">Admin Master PIN</label>
            <div className="flex items-center gap-2 mt-1.5">
              {showAdminPinEdit ? (
                <>
                  <input
                    type="text"
                    maxLength={4}
                    value={newAdminPin}
                    onChange={(e) => setNewAdminPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="New 4-digit PIN"
                    className="bg-[#0b132b] border border-amber-900/40 rounded-lg px-3 py-1.5 text-white text-sm font-mono w-32 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    onClick={() => {
                      if (newAdminPin.length === 4) {
                        setAdminPin(newAdminPin);
                        setShowAdminPinEdit(false);
                        setNewAdminPin('');
                      }
                    }}
                    disabled={newAdminPin.length !== 4}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#0b132b] text-white text-xs font-semibold px-3 py-2 rounded-lg"
                  >
                    Save
                  </button>
                  <button onClick={() => setShowAdminPinEdit(false)} className="text-amber-500/60 hover:text-white text-xs px-2">
                    Cancel
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 text-sm">
                    {state.adminPin}
                  </span>
                  <button
                    onClick={() => setShowAdminPinEdit(true)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    Change PIN
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Firebase Cloud Live Sync Card */}
          <div className="sketch-border bg-[#050814]/80 rounded-xl p-4 border border-amber-900/40 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isFirebaseConfigured() ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-[#0b132b] text-amber-500/60'}`}>
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  Firebase Cloud Live Sync
                  {isFirebaseConfigured() ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.2 rounded-full">
                      ● Live Connected
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-500/60 bg-[#0b132b] px-2 py-0.2 rounded-full">
                      Offline / Standalone
                    </span>
                  )}
                </p>
                <p className="text-xs text-amber-500/60">
                  {isFirebaseConfigured()
                    ? 'All friends see scores, goals, and ratings in real-time across devices.'
                    : 'Connect a free Firebase project so everyone viewing your link gets live updates.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCloudModal(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all shadow-md shadow-emerald-950"
            >
              <Cloud className="w-3.5 h-3.5" />
              {isFirebaseConfigured() ? 'Cloud Sync Settings' : 'Connect Firebase Cloud'}
            </button>
          </div>

          {/* Backup / Export / Reset Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-amber-900/30">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 bg-[#0b132b] hover:bg-gray-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
            <button
              onClick={handleImport}
              className="flex items-center gap-1.5 bg-[#0b132b] hover:bg-gray-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              <Upload className="w-3.5 h-3.5" /> Import JSON
            </button>
            <button
              onClick={() => {
                if (window.confirm('Delete all league fixtures and reset the schedule?')) {
                  dispatch({ type: 'SET_STATE', payload: { ...state, matches: [] } });
                }
              }}
              className="flex items-center gap-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 text-xs font-semibold px-3 py-2 rounded-lg transition-colors border border-yellow-500/30"
            >
              <Calendar className="w-3.5 h-3.5" /> Reset Fixtures
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-semibold px-3 py-2 rounded-lg transition-colors border border-red-500/30 ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" /> Reset All Data
            </button>
          </div>

          {showResetConfirm && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3">
              <p className="text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                This will reset players, teams, matches, and awards in this tournament. Are you sure?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { resetState(); setShowResetConfirm(false); }}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                >
                  Yes, Reset Everything
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="text-amber-500/60 hover:text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#0b132b]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 6. Awards Section ── */}
      <SectionToggle id="awards" label="Dynamic Awards & Trophy Room" icon={Trophy} count={state.awards.length} />
      {expandedSection === 'awards' && (
        <AwardsSystem />
      )}

      {/* Quick-Start Wizard Modal */}
      {showWizard && <BulkDumpWizard onClose={() => setShowWizard(false)} />}

      {/* Cloud Sync Settings Modal */}
      {showCloudModal && <FirebaseSyncModal onClose={() => setShowCloudModal(false)} />}
    </div>
  );
}
