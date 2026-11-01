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
  RefreshCw
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
    addPlayer, updatePlayer, deletePlayer, toggleCaptain,
    addCaptain, updateCaptain, deleteCaptain,
    addTeam, updateTeam, deleteTeam,
    exportState, importState, setAdminPin, resetState,
    setDraftMode, setDefaultBudget, recomputeStats,
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
    setEditingPlayer(player.id);
    setPlayerForm({
      ...player,
      pin: player.pin || generatePin(),
      jerseyNumber: player.jerseyNumber ?? '',
      rawPositions: player.rawPositions || [],
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

    updatePlayer({
      ...playerForm,
      jerseyNumber: playerForm.jerseyNumber ? Number(playerForm.jerseyNumber) : null,
      teamId: assignedTeamId,
      status: assignedStatus,
    });
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
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/80 hover:bg-gray-800 rounded-xl transition-colors border border-gray-700/60"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-5 h-5 text-amber-400" />
          <span className="font-semibold text-white text-sm">{label}</span>
          {count !== undefined && (
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full font-mono">
              {count}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Admin Panel Header */}
      <div className="bg-gradient-to-r from-red-950/40 via-gray-900 to-amber-950/30 border border-red-500/20 rounded-2xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin Command Center</h1>
              <p className="text-xs text-gray-400">
                Full management: edit tournament, teams, captains, players, and match schedules.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-lg shadow-amber-900/20"
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
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-gray-800 px-2.5 py-1.5 rounded-lg border border-gray-700"
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
            <div className="text-center py-8 text-gray-500">
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
                    <div key={player.id} className="bg-gray-800 border-2 border-amber-500/50 rounded-xl p-4 space-y-3.5 shadow-lg">
                      <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                        <span className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
                          <Edit3 className="w-4 h-4" /> Edit Player: {player.name}
                        </span>
                        <button onClick={() => setEditingPlayer(null)} className="text-gray-400 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[11px] font-semibold text-gray-400">Full Name</label>
                          <input
                            type="text"
                            value={playerForm.name || ''}
                            onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-gray-400">4-Digit PIN</label>
                          <input
                            type="text"
                            maxLength={4}
                            value={playerForm.pin || ''}
                            onChange={(e) => setPlayerForm({ ...playerForm, pin: e.target.value.replace(/\D/g, '') })}
                            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-amber-400 font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-gray-400">Primary Position</label>
                          <select
                            value={playerForm.position || 'FLEX'}
                            onChange={(e) => setPlayerForm({ ...playerForm, position: e.target.value })}
                            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-white text-sm"
                          >
                            {['GK', 'DEF', 'MID', 'FWD', 'FLEX'].map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[11px] font-semibold text-gray-400">Assigned Team</label>
                          <select
                            value={playerForm.teamId || ''}
                            onChange={(e) => setPlayerForm({ ...playerForm, teamId: e.target.value })}
                            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-white text-sm"
                          >
                            <option value="">None (Free Agent / Undrafted)</option>
                            {state.teams.map(t => (
                              <option key={t.id} value={t.id}>{t.logo} {t.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-gray-400">Status</label>
                          <select
                            value={playerForm.status || 'UNDRAFTED'}
                            onChange={(e) => setPlayerForm({ ...playerForm, status: e.target.value })}
                            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-white text-sm"
                          >
                            <option value="UNDRAFTED">UNDRAFTED</option>
                            <option value="DRAFTED">DRAFTED</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-gray-400">Availability</label>
                          <select
                            value={playerForm.availability || 'AVAILABLE'}
                            onChange={(e) => setPlayerForm({ ...playerForm, availability: e.target.value })}
                            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-white text-sm"
                          >
                            <option value="AVAILABLE">🟢 Available</option>
                            <option value="INJURED">🔴 Injured</option>
                            <option value="BUSY">🟡 Unavailable / Busy</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[11px] font-semibold text-gray-400">Jersey Number</label>
                          <input
                            type="number"
                            value={playerForm.jerseyNumber || ''}
                            onChange={(e) => setPlayerForm({ ...playerForm, jerseyNumber: e.target.value ? Number(e.target.value) : '' })}
                            placeholder="e.g. 10"
                            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-white text-sm"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-semibold text-gray-400">Sub-positions (comma separated)</label>
                          <input
                            type="text"
                            value={(playerForm.rawPositions || []).join(', ')}
                            onChange={(e) => setPlayerForm({ ...playerForm, rawPositions: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) })}
                            placeholder="e.g. CM, ATM, CDM"
                            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-white text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-gray-400">Avatar Image URL</label>
                        <input
                          type="text"
                          value={playerForm.avatar || ''}
                          onChange={(e) => setPlayerForm({ ...playerForm, avatar: e.target.value })}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-white text-sm"
                        />
                      </div>

                      {/* Performance Stats */}
                      <div className="bg-gray-900/60 p-2.5 rounded-lg border border-gray-700">
                        <label className="text-[11px] font-semibold text-gray-400 block mb-1">Career / Tournament Stats</label>
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
                              <span className="text-[10px] text-gray-500 block truncate">{s.label}</span>
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
                                className="w-full bg-gray-800 border border-gray-600 rounded text-center py-1 text-white font-mono"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1 border-t border-gray-700">
                        <button
                          type="button"
                          onClick={() => setEditingPlayer(null)}
                          className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
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
                  <div key={player.id} className="flex items-center justify-between px-3.5 py-2.5 bg-gray-800/40 border border-gray-700/60 rounded-xl hover:border-gray-600 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center font-bold text-xs text-white shrink-0 overflow-hidden">
                        {player.avatar ? (
                          <img src={player.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          player.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-white text-sm truncate">{player.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${POSITION_COLORS[player.position] || POSITION_COLORS.FLEX}`}>
                            {player.position}
                          </span>
                          {player.jerseyNumber && (
                            <span className="text-[10px] text-gray-500 font-mono">#{player.jerseyNumber}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
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
                        className="p-1.5 text-gray-400 hover:text-amber-400 rounded-lg hover:bg-gray-700 transition-colors"
                        title="Edit Player Profile"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleCaptain(player.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          state.captains.some(c => c.name === player.name)
                            ? 'text-amber-400 hover:text-gray-400 hover:bg-gray-700'
                            : 'text-gray-600 hover:text-amber-400 hover:bg-gray-700'
                        }`}
                        title="Toggle Captain Status"
                      >
                        <Crown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deletePlayer(player.id)}
                        className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-gray-700 transition-colors"
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
            <span className="text-xs text-gray-400">
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
            <div className="text-center py-8 text-gray-500">
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
                    <div key={cap.id} className="bg-gray-800 border-2 border-amber-500/50 rounded-xl p-4 space-y-4 shadow-xl">
                      <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                        <span className="font-bold text-amber-400 text-sm flex items-center gap-2">
                          <Crown className="w-4 h-4" /> Edit Team: {team.name || cap.name}
                        </span>
                        <button onClick={() => setEditingCaptainId(null)} className="text-gray-400 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Captain info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-300">Captain Name</label>
                          <input
                            type="text"
                            value={captainForm.captainName || ''}
                            onChange={e => setCaptainForm({ ...captainForm, captainName: e.target.value })}
                            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-300">Captain PIN</label>
                          <input
                            type="text"
                            maxLength={4}
                            value={captainForm.captainPin || ''}
                            onChange={e => setCaptainForm({ ...captainForm, captainPin: e.target.value.replace(/\D/g, '') })}
                            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-amber-400 font-mono text-sm"
                          />
                        </div>
                      </div>

                      {/* Team branding */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-300">Team Name</label>
                          <input
                            type="text"
                            value={captainForm.teamName || ''}
                            onChange={e => setCaptainForm({ ...captainForm, teamName: e.target.value })}
                            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-300">Team Logo (Emoji)</label>
                          <input
                            type="text"
                            maxLength={4}
                            value={captainForm.teamLogo || ''}
                            onChange={e => setCaptainForm({ ...captainForm, teamLogo: e.target.value })}
                            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-white text-center text-lg"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-300">Team Motto</label>
                          <input
                            type="text"
                            value={captainForm.teamMotto || ''}
                            onChange={e => setCaptainForm({ ...captainForm, teamMotto: e.target.value })}
                            placeholder="Victory or nothing"
                            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-white text-sm"
                          />
                        </div>
                      </div>

                      {/* Color Picker & Presets */}
                      <div>
                        <label className="text-xs font-semibold text-gray-300 block mb-1.5">Team Primary Color</label>
                        <div className="flex items-center gap-2 flex-wrap">
                          {COLOR_PRESETS.map(c => (
                            <button
                              type="button"
                              key={c}
                              onClick={() => setCaptainForm({ ...captainForm, teamColor: c })}
                              className="w-6 h-6 rounded-full border border-gray-600 hover:scale-110 transition-transform"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                          <input
                            type="color"
                            value={captainForm.teamColor || '#10B981'}
                            onChange={e => setCaptainForm({ ...captainForm, teamColor: e.target.value })}
                            className="w-8 h-8 rounded-lg bg-transparent cursor-pointer"
                          />
                          <span className="text-xs font-mono text-gray-400">{captainForm.teamColor}</span>
                        </div>
                      </div>

                      {/* Budget and Spent Coins */}
                      <div className="grid grid-cols-2 gap-3 bg-gray-900/60 p-3 rounded-xl border border-gray-700">
                        <div>
                          <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-amber-400" /> Auction Budget (coins)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={captainForm.teamBudget ?? 1000}
                            onChange={e => setCaptainForm({ ...captainForm, teamBudget: Number(e.target.value) })}
                            className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg px-2.5 py-1.5 text-white font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-300">Spent in Auction</label>
                          <input
                            type="number"
                            min="0"
                            value={captainForm.teamSpent ?? 0}
                            onChange={e => setCaptainForm({ ...captainForm, teamSpent: Number(e.target.value) })}
                            className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg px-2.5 py-1.5 text-white font-mono text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-700">
                        <button
                          type="button"
                          onClick={() => setEditingCaptainId(null)}
                          className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
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
                  <div key={cap.id} className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border border-amber-500/20 rounded-xl hover:border-amber-500/40 transition-colors">
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
                          <span className="font-bold text-white text-sm truncate">{team.name || cap.name}</span>
                          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                            <Crown className="w-3 h-3" /> {cap.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
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
                        className="p-1.5 text-gray-400 hover:text-amber-400 rounded-lg hover:bg-gray-700 transition-colors"
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
                        className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-gray-700 transition-colors"
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

      {/* ── 4. Draft Engine Section ── */}
      <SectionToggle id="draft" label="Draft Engine & Auction Rules" icon={Dices} />
      {expandedSection === 'draft' && (
        <div className="bg-gradient-to-br from-amber-600/10 to-orange-600/5 border border-amber-500/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-4">
            <Dices className="w-10 h-10 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white text-base">Draft Engine Settings</h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Switch between Auction Draft mode and Free Pick mode. Head to the <span className="text-amber-400 font-semibold">Draft</span> tab in the navbar to spin the wheel.
              </p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Draft Mode</p>
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
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'
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
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Default Starting Budget</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={100}
                  max={10000}
                  step={50}
                  value={state.defaultBudget ?? 1000}
                  onChange={e => setDefaultBudget && setDefaultBudget(Number(e.target.value))}
                  className="w-28 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-400">coins</span>
              </div>
            </div>
          )}

          {/* Captain PIN Reference */}
          {state.captains.length > 0 && (
            <div className="border-t border-gray-700/60 pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
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
                    <div key={cap.id} className="flex items-center justify-between bg-gray-800/80 rounded-lg px-3 py-2 border border-gray-700">
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
        <div className="space-y-4 bg-gray-800/50 rounded-xl p-5 border border-gray-700">
          {/* Admin Master PIN */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin Master PIN</label>
            <div className="flex items-center gap-2 mt-1.5">
              {showAdminPinEdit ? (
                <>
                  <input
                    type="text"
                    maxLength={4}
                    value={newAdminPin}
                    onChange={(e) => setNewAdminPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="New 4-digit PIN"
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm font-mono w-32 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white text-xs font-semibold px-3 py-2 rounded-lg"
                  >
                    Save
                  </button>
                  <button onClick={() => setShowAdminPinEdit(false)} className="text-gray-400 hover:text-white text-xs px-2">
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
          <div className="bg-gray-800/60 border border-gray-700/80 rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isFirebaseConfigured() ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-gray-700 text-gray-400'}`}>
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
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-700 px-2 py-0.2 rounded-full">
                      Offline / Standalone
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400">
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
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-700">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
            <button
              onClick={handleImport}
              className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
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
                  className="text-gray-400 hover:text-white text-xs px-3 py-1.5 rounded-lg hover:bg-gray-700"
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
