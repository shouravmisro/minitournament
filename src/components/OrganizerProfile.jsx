import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useGlobal } from '../context/GlobalContext';
import {
  MapPin, Phone, FileText, Globe, Building2, Edit3, Save, X, ExternalLink
} from 'lucide-react';

export default function OrganizerProfile({ editable = false }) {
  const { state, updateOrganizer } = useTournament();
  const { global, updateTournamentMeta } = useGlobal();
  const org = state.organizer;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...org });

  function handleSave() {
    updateOrganizer(form);
    if (global?.activeTournamentId && updateTournamentMeta) {
      updateTournamentMeta({
        id: global.activeTournamentId,
        name: form.name || 'Tournament',
        format: form.format || 'HYBRID',
      });
    }
    setEditing(false);
  }

  if (editing && editable) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Edit Tournament Info</h2>
          <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid gap-3">
          {[
            { key: 'name', label: 'Tournament Name', ph: 'Local Champions League' },
            { key: 'hostName', label: 'Host / Club Name', ph: 'City Sports Club' },
            { key: 'venue', label: 'Venue', ph: 'Central Turf Arena' },
            { key: 'mapLink', label: 'Map Link', ph: 'https://maps.google.com/...' },
            { key: 'contactWhatsApp', label: 'WhatsApp Contact', ph: '+1234567890' },
            { key: 'logoUrl', label: 'Logo URL', ph: 'https://...' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-sm text-gray-400 font-medium">{f.label}</label>
              <input
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.ph}
                className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          ))}

          <div>
            <label className="text-sm text-gray-400 font-medium">Format</label>
            <select
              value={form.format}
              onChange={(e) => setForm({ ...form, format: e.target.value })}
              className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="LEAGUE">League Only</option>
              <option value="KNOCKOUT">Knockout Only</option>
              <option value="HYBRID">Hybrid (League → Knockout)</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 font-medium">Rules (one per line)</label>
            <textarea
              value={form.rules.join('\n')}
              onChange={(e) => setForm({ ...form, rules: e.target.value.split('\n') })}
              rows={4}
              className="w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-600/30 to-emerald-600/30 p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {org.logoUrl ? (
              <img src={org.logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover border-2 border-amber-500/50" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-500 flex items-center justify-center text-3xl">
                🏆
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">{org.name || 'Tournament'}</h2>
              <p className="text-amber-300 text-sm font-medium flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5" />
                {org.hostName || 'Host Club'}
              </p>
            </div>
          </div>
          {editable && (
            <button
              onClick={() => { setForm({ ...org }); setEditing(true); }}
              className="text-gray-400 hover:text-amber-400 p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-6 pt-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {org.venue && (
            <span className="flex items-center gap-1.5 text-sm text-gray-300 bg-gray-800 rounded-full px-3 py-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              {org.venue}
            </span>
          )}
          {org.format && (
            <span className="flex items-center gap-1.5 text-sm text-gray-300 bg-gray-800 rounded-full px-3 py-1">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              {org.format}
            </span>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          {org.mapLink && (
            <a
              href={org.mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 rounded-lg px-3 py-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View Map
            </a>
          )}
          {org.contactWhatsApp && (
            <a
              href={`https://wa.me/${org.contactWhatsApp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-green-400 hover:text-green-300 bg-green-500/10 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" /> WhatsApp
            </a>
          )}
        </div>

        {/* Rules */}
        {org.rules && org.rules.length > 0 && org.rules.some(r => r.trim()) && (
          <div className="pt-2">
            <h4 className="text-sm font-semibold text-gray-400 flex items-center gap-1.5 mb-2">
              <FileText className="w-3.5 h-3.5" /> Tournament Rules
            </h4>
            <ul className="space-y-1">
              {org.rules.filter(r => r.trim()).map((rule, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{state.teams.length}</div>
            <div className="text-xs text-gray-500 font-medium">Teams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{state.players.length}</div>
            <div className="text-xs text-gray-500 font-medium">Players</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{state.matches.length}</div>
            <div className="text-xs text-gray-500 font-medium">Matches</div>
          </div>
        </div>
      </div>
    </div>
  );
}

