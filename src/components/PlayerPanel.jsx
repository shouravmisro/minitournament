import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import {
  User, Edit3, Save, X, Shield, Calendar, MapPin, Phone,
  Heart, AlertTriangle, CircleDot, Trophy, Target, Zap, Award
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

export default function PlayerPanel() {
  const { state, updatePlayer } = useTournament();
  const { authenticatedId } = useAuth();

  const player = state.players.find(p => p.id === authenticatedId);
  const team = player?.teamId ? state.teams.find(t => t.id === player.teamId) : null;
  const captain = team ? state.captains.find(c => c.id === team.captainId) : null;
  const awards = state.awards.filter(a => a.winnerPlayerId === player?.id);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  if (!player) {
    return (
      <div className="text-center py-12 text-gray-500">
        <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-lg font-medium">Player not found</p>
        <p className="text-sm">Please login again from the navigation menu.</p>
      </div>
    );
  }

  const upcomingMatches = state.matches.filter(m =>
    (m.teamAId === player.teamId || m.teamBId === player.teamId) &&
    m.status !== 'COMPLETED'
  );

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
              <img src={player.avatar} alt={player.name} className="w-16 h-16 rounded-xl object-cover border-2 border-gray-600" />
            ) : (
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white border-2 border-gray-600"
                style={{ backgroundColor: (team?.primaryColor || '#3B82F6') + '30' }}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{player.name}</h1>
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
                  <span className="text-xs text-gray-400 font-mono">#{player.jerseyNumber}</span>
                )}
              </div>
              {player.bio && (
                <p className="text-sm text-gray-400 mt-1 italic">"{player.bio}"</p>
              )}
            </div>

            <button
              onClick={() => { setForm({ ...player }); setEditing(true); }}
              className="text-gray-400 hover:text-amber-400 p-2 rounded-lg hover:bg-gray-800/50"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-2 mt-4">
            {[
              { label: 'Matches', value: player.stats.matches, icon: Calendar },
              { label: 'Goals', value: player.stats.goals, icon: Target },
              { label: 'Assists', value: player.stats.assists, icon: Zap },
              { label: 'Clean S.', value: player.stats.cleanSheets, icon: Shield },
              { label: 'MVP', value: player.stats.mvpCount, icon: Trophy },
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Edit Profile</h3>
              <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid gap-3">
              <div>
                <label className="text-xs text-gray-400">Display Name</label>
                <input
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Avatar URL</label>
                <input
                  value={form.avatar || ''}
                  onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                  placeholder="https://..."
                  className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Preferred Position</label>
                  <select
                    value={form.position || 'FLEX'}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {['GK', 'DEF', 'MID', 'FWD', 'FLEX'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Jersey Number</label>
                  <input
                    type="number"
                    value={form.jerseyNumber || ''}
                    onChange={(e) => setForm({ ...form, jerseyNumber: e.target.value ? Number(e.target.value) : null })}
                    className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400">Sub-positions (comma separated)</label>
                <input
                  value={(form.rawPositions || []).join(', ')}
                  onChange={(e) => setForm({ ...form, rawPositions: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) })}
                  placeholder="CM, ATM"
                  className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Short Bio</label>
                <input
                  value={form.bio || ''}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Playmaker extraordinaire"
                  className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800">
                Cancel
              </button>
              <button
                onClick={() => { updatePlayer(form); setEditing(false); }}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                <Save className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

