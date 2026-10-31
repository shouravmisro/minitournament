import React, { useState } from 'react';
import { useTournament, generateId, generatePin } from '../context/TournamentContext';
import OrganizerProfile from './OrganizerProfile';
import BulkDumpWizard   from './BulkDumpWizard';
import AwardsSystem     from './AwardsSystem';
import {
  Shield, Users, UserPlus, Crown, Trash2, Sparkles, Download, Upload,
  Key, Eye, EyeOff, Edit3, Save, X, AlertCircle, ChevronDown, ChevronUp,
  Settings, Dices, Trophy, Calendar
} from 'lucide-react';

const POSITION_COLORS = {
  GK: 'bg-yellow-500/20 text-yellow-300',
  DEF: 'bg-blue-500/20 text-blue-300',
  MID: 'bg-green-500/20 text-green-300',
  FWD: 'bg-red-500/20 text-red-300',
  FLEX: 'bg-purple-500/20 text-purple-300',
};

export default function AdminPanel() {
  const {
    state, dispatch,
    addPlayer, updatePlayer, deletePlayer, toggleCaptain,
    deleteCaptain, exportState, importState, setAdminPin, resetState,
    setDraftMode, setDefaultBudget,
  } = useTournament();

  const [showWizard, setShowWizard] = useState(false);
  const [showPins, setShowPins] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [playerForm, setPlayerForm] = useState({});
  const [expandedSection, setExpandedSection] = useState('organizer');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [newAdminPin, setNewAdminPin] = useState('');
  const [showAdminPinEdit, setShowAdminPinEdit] = useState(false);

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
      stats: { matches: 0, goals: 0, assists: 0, cleanSheets: 0, mvpCount: 0 },
    };
    addPlayer(player);
    setEditingPlayer(player.id);
    setPlayerForm({ ...player });
  }

  function handleSavePlayer() {
    updatePlayer(playerForm);
    setEditingPlayer(null);
  }

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
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-white text-sm">{label}</span>
          {count !== undefined && (
            <span className="bg-gray-700 text-gray-400 text-xs px-2 py-0.5 rounded-full">{count}</span>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Admin Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-red-400" />
          Admin Panel
        </h1>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-lg shadow-amber-600/25"
        >
          <Sparkles className="w-4 h-4" /> Quick Start
        </button>
      </div>

      {/* ── Organizer Profile Section ── */}
      <SectionToggle id="organizer" label="Tournament Info" icon={Settings} />
      {expandedSection === 'organizer' && (
        <OrganizerProfile editable={true} />
      )}

      {/* ── Players Section ── */}
      <SectionToggle id="players" label="Players" icon={Users} count={state.players.length} />
      {expandedSection === 'players' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowPins(!showPins)}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              {showPins ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPins ? 'Hide' : 'Show'} PINs
            </button>
            <button
              onClick={handleAddPlayer}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" /> Add Player
            </button>
          </div>

          {state.players.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No players yet. Use Quick Start to bulk import!</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {state.players.map(player => {
                const isCaptain = state.captains.some(c => c.name === player.name);
                const team = state.teams.find(t => t.id === player.teamId);
                const isEditing = editingPlayer === player.id;

                if (isEditing) {
                  return (
                    <div key={player.id} className="bg-gray-800 border border-amber-500/30 rounded-xl p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-400">Name</label>
                          <input
                            value={playerForm.name || ''}
                            onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Position</label>
                          <select
                            value={playerForm.position || 'FLEX'}
                            onChange={(e) => setPlayerForm({ ...playerForm, position: e.target.value })}
                            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            {['GK', 'DEF', 'MID', 'FWD', 'FLEX'].map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Jersey #</label>
                          <input
                            type="number"
                            value={playerForm.jerseyNumber || ''}
                            onChange={(e) => setPlayerForm({ ...playerForm, jerseyNumber: e.target.value ? Number(e.target.value) : null })}
                            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Sub-positions (comma sep.)</label>
                          <input
                            value={(playerForm.rawPositions || []).join(', ')}
                            onChange={(e) => setPlayerForm({ ...playerForm, rawPositions: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) })}
                            className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Bio</label>
                        <input
                          value={playerForm.bio || ''}
                          onChange={(e) => setPlayerForm({ ...playerForm, bio: e.target.value })}
                          className="w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingPlayer(null)} className="px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-700">
                          Cancel
                        </button>
                        <button onClick={handleSavePlayer} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg">
                          <Save className="w-3.5 h-3.5" /> Save
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={player.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                    isCaptain ? 'bg-amber-500/5 border-amber-500/20' : 'bg-gray-800/50 border-gray-700/50'
                  }`}>
                    {/* Captain toggle */}
                    <button
                      onClick={() => toggleCaptain(player.id)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                        isCaptain
                          ? 'bg-amber-500 text-gray-900'
                          : 'bg-gray-700 text-gray-500 hover:text-amber-400'
                      }`}
                      title={isCaptain ? 'Demote captain' : 'Make captain'}
                    >
                      <Crown className="w-3.5 h-3.5" />
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white text-sm truncate">{player.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${POSITION_COLORS[player.position] || POSITION_COLORS.FLEX}`}>
                          {player.position}
                        </span>
                        {player.rawPositions?.filter(r => r !== 'ANY').map((rp, j) => (
                          <span key={j} className="text-xs px-1 py-0.5 rounded bg-gray-700 text-gray-400 font-mono hidden sm:inline">
                            {rp}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {showPins && (
                          <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            PIN: {player.pin}
                          </span>
                        )}
                        {team && (
                          <span className="text-xs text-gray-500">{team.logo} {team.name}</span>
                        )}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          player.status === 'DRAFTED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {player.status}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditingPlayer(player.id); setPlayerForm({ ...player }); }}
                        className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deletePlayer(player.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-700"
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

      {/* ── Captains & Teams Section ── */}
      <SectionToggle id="captains" label="Captains & Teams" icon={Crown} count={state.captains.length} />
      {expandedSection === 'captains' && (
        <div className="space-y-2">
          {state.captains.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Crown className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No captains yet. Promote players or use Quick Start!</p>
            </div>
          ) : (
            state.captains.map(cap => {
              const team = state.teams.find(t => t.id === cap.teamId);
              const rosterCount = team ? team.rosterIds.length : 0;
              return (
                <div key={cap.id} className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 border border-amber-500/20 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-xl border border-amber-500/30">
                    {team?.logo || '👤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-amber-300 text-sm">{cap.name}</span>
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{team?.name || 'No team'}</span>
                      <span className="text-xs text-gray-500">• {rosterCount} player{rosterCount !== 1 ? 's' : ''}</span>
                      {showPins && (
                        <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          PIN: {cap.pin}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteCaptain(cap.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Draft Module ── */}
      <SectionToggle id="draft" label="Draft Engine" icon={Dices} />
      {expandedSection === 'draft' && (
        <div className="bg-gradient-to-br from-amber-600/10 to-orange-600/5 border border-amber-500/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-4">
            <Dices className="w-10 h-10 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white text-base">Draft Engine</h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Configure draft mode then head to the <span className="text-amber-400 font-semibold">Draft</span> tab.
              </p>
            </div>
          </div>

          {/* Draft mode toggle */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Draft Mode</p>
            <div className="flex gap-2">
              {[
                { id: 'AUCTION', label: '🪙 Auction', desc: 'Captains bid from budget' },
                { id: 'FREE',    label: '🎰 Free Pick', desc: 'Admin assigns directly' },
              ].map(opt => (
                <button key={opt.id}
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

          {/* Default budget */}
          {state.draftMode === 'AUCTION' && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Team Budget per Captain</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={100} max={10000} step={100}
                  value={state.defaultBudget ?? 1000}
                  onChange={e => setDefaultBudget && setDefaultBudget(Number(e.target.value))}
                  className="w-28 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-400">coins</span>
                <span className="text-xs text-gray-600">(100–10000)</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-800/60 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-white">
                {state.players.filter(p => p.status === 'UNDRAFTED').length}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">Undrafted Players</p>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-white">
                {state.players.filter(p => p.status === 'DRAFTED').length}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">Drafted Players</p>
            </div>
          </div>
          {/* PIN reference sheet */}
          {state.players.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> Captain PIN Reference
              </p>
              <div className="space-y-1">
                {state.captains.map(cap => {
                  const team = state.teams.find(t => t.id === cap.teamId);
                  return (
                    <div key={cap.id} className="flex items-center justify-between bg-gray-800/60 rounded-lg px-3 py-2">
                      <span className="text-sm text-white">{team?.logo} {cap.name}</span>
                      <span className="font-mono text-amber-400 text-sm bg-amber-500/10 px-2 py-0.5 rounded">
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

      {/* ── Admin Settings Section ── */}
      <SectionToggle id="settings" label="Admin Settings" icon={Key} />
      {expandedSection === 'settings' && (
        <div className="space-y-3 bg-gray-800/50 rounded-xl p-4">
          {/* Change Admin PIN */}
          <div>
            <label className="text-sm text-gray-400 font-medium">Admin Master PIN</label>
            <div className="flex items-center gap-2 mt-1">
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
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white text-sm px-3 py-1.5 rounded-lg"
                  >
                    Save
                  </button>
                  <button onClick={() => setShowAdminPinEdit(false)} className="text-gray-400 hover:text-white text-sm px-2">
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAdminPinEdit(true)}
                  className="text-sm text-amber-400 hover:text-amber-300"
                >
                  Change PIN (current: {state.adminPin})
                </button>
              )}
            </div>
          </div>

          {/* Export / Import */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-2 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" /> Export JSON
            </button>
            <button
              onClick={handleImport}
              className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-2 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" /> Import JSON
            </button>
            <button
              onClick={() => {
                if (window.confirm('Delete all league & knockout matches?')) {
                  state.matches.forEach(m => {/* handled by dispatch below */});
                  // Reset only matches — use SET_STATE shortcut
                  dispatch({ type: 'SET_STATE', payload: { ...state, matches: [] } });
                }
              }}
              className="flex items-center gap-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 text-sm px-3 py-2 rounded-lg transition-colors"
            >
              <Calendar className="w-4 h-4" /> Reset Fixtures
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm px-3 py-2 rounded-lg transition-colors ml-auto"
            >
              <Trash2 className="w-4 h-4" /> Reset All
            </button>
          </div>

          {showResetConfirm && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3">
              <p className="text-sm text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                This will delete ALL tournament data. Are you sure?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { resetState(); setShowResetConfirm(false); }}
                  className="bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg"
                >
                  Yes, Reset Everything
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="text-gray-400 hover:text-white text-sm px-4 py-1.5 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Awards Section ── */}
      <SectionToggle id="awards" label="Dynamic Awards" icon={Trophy} count={state.awards.length} />
      {expandedSection === 'awards' && (
        <AwardsSystem />
      )}

      {/* Wizard Modal */}
      {showWizard && <BulkDumpWizard onClose={() => setShowWizard(false)} />}
    </div>
  );
}

