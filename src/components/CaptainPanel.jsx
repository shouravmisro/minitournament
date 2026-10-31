import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import {
  Crown, Users, Edit3, Save, X, Palette, Shield, User,
  Type, Smile, ChevronDown, ChevronUp, Dices, Key, Eye, EyeOff, Check
} from 'lucide-react';

export default function CaptainPanel() {
  const { state, updateTeam, updateCaptain } = useTournament();
  const { authenticatedId } = useAuth();

  const captain = state.captains.find(c => c.id === authenticatedId);
  const team = captain ? state.teams.find(t => t.id === captain.teamId) : null;
  const roster = team
    ? state.players.filter(p => team.rosterIds.includes(p.id) || p.teamId === team.id)
    : [];

  const [editingTeam, setEditingTeam] = useState(false);
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

  const POSITION_COLORS = {
    GK: 'bg-yellow-500/20 text-yellow-300',
    DEF: 'bg-blue-500/20 text-blue-300',
    MID: 'bg-green-500/20 text-green-300',
    FWD: 'bg-red-500/20 text-red-300',
    FLEX: 'bg-purple-500/20 text-purple-300',
  };

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

  return (
    <div className="space-y-4">
      {/* Captain Header */}
      <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/10 border border-amber-500/20 rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl border-2 border-amber-500/40"
            style={{ backgroundColor: (team?.primaryColor || '#F59E0B') + '20' }}
          >
            {team?.logo || '👑'}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              {captain.name}
            </h1>
            <p className="text-amber-300/80 text-sm">{team?.name || 'No team assigned'}</p>
            {team?.motto && (
              <p className="text-gray-400 text-xs italic mt-1">"{team.motto}"</p>
            )}
          </div>
        </div>

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
              <span className="text-xs font-semibold text-amber-400">Set New 4-Digit PIN</span>
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
                placeholder="e.g. 5432"
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

      {/* Draft CTA */}
      <div className="bg-gradient-to-r from-amber-600/15 to-orange-600/10 border border-amber-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
        <Dices className="w-8 h-8 text-amber-400 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Ready to pick players?</p>
          <p className="text-xs text-gray-400">Switch to the <span className="text-amber-400 font-medium">Draft</span> tab to spin the wheel.</p>
        </div>
      </div>

      {/* Edit Team Details */}
      {editingTeam ? (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Edit Team Details</h3>
            <button onClick={() => setEditingTeam(false)} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid gap-3">
            <div>
              <label className="text-xs text-gray-400 flex items-center gap-1"><Type className="w-3 h-3" /> Team Name</label>
              <input
                value={teamForm.name || ''}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 flex items-center gap-1"><Smile className="w-3 h-3" /> Badge/Emoji</label>
                <input
                  value={teamForm.logo || ''}
                  onChange={(e) => setTeamForm({ ...teamForm, logo: e.target.value })}
                  className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 flex items-center gap-1"><Palette className="w-3 h-3" /> Jersey Color</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={teamForm.primaryColor || '#10B981'}
                    onChange={(e) => setTeamForm({ ...teamForm, primaryColor: e.target.value })}
                    className="w-10 h-9 rounded-lg border border-gray-600 cursor-pointer bg-transparent"
                  />
                  <span className="text-xs text-gray-400 font-mono">{teamForm.primaryColor}</span>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400">Motto</label>
              <input
                value={teamForm.motto || ''}
                onChange={(e) => setTeamForm({ ...teamForm, motto: e.target.value })}
                placeholder="Strike Fast, Win First"
                className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
          <button
            onClick={() => { updateTeam({ ...teamForm }); setEditingTeam(false); }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </div>
      ) : (
        team && (
          <button
            onClick={() => { setTeamForm({ ...team }); setEditingTeam(true); }}
            className="w-full flex items-center justify-center gap-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white text-sm py-2.5 rounded-xl transition-colors"
          >
            <Edit3 className="w-4 h-4" /> Edit Team Details
          </button>
        )
      )}

      {/* Roster */}
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
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">No players drafted yet.</p>
                <p className="text-xs mt-1">Wait for the draft or ask your Admin.</p>
              </div>
            ) : (
              roster.map(player => (
                <div key={player.id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300">
                    {player.jerseyNumber || '#'}
                  </div>
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
    </div>
  );
}
