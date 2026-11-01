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
      <div className="sketch-border bg-[#0b132b] rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-dashed border-amber-900/40 pb-3">
          <h2 className="text-xl font-serif text-amber-200">Modify Codex Details</h2>
          <button onClick={() => setEditing(false)} className="text-amber-500/60 hover:text-amber-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid gap-3">
          {[
            { key: 'name', label: 'Tournament Name', ph: 'Local Champions League' },
            { key: 'hostName', label: 'Host / Guild Name', ph: 'City Sports Club' },
            { key: 'venue', label: 'Arena / Colosseum', ph: 'Central Turf Arena' },
            { key: 'mapLink', label: 'Location Map URL', ph: 'https://maps.google.com/...' },
            { key: 'contactWhatsApp', label: 'Envoy Contact (WhatsApp)', ph: '+1234567890' },
            { key: 'logoUrl', label: 'Emblem URL', ph: 'https://...' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/70">{f.label}</label>
              <input
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.ph}
                className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-amber-100 font-serif text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          ))}

          <div>
            <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/70">Tournament Format</label>
            <select
              value={form.format}
              onChange={(e) => setForm({ ...form, format: e.target.value })}
              className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-amber-100 font-serif text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="LEAGUE">League Only (Round Robin)</option>
              <option value="KNOCKOUT">Knockout Only (Ascent Bracket)</option>
              <option value="HYBRID">Hybrid (League Group Stage → Ascent Final)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono tracking-widest uppercase text-amber-500/70">Arena Decrees &amp; Rules (one per line)</label>
            <textarea
              value={form.rules.join('\n')}
              onChange={(e) => setForm({ ...form, rules: e.target.value.split('\n') })}
              rows={4}
              className="w-full mt-1 bg-[#050814] border border-amber-900/50 rounded-xl px-3 py-2 text-amber-100 font-serif text-sm focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-dashed border-amber-900/30">
          <button
            onClick={() => setEditing(false)}
            className="px-4 py-2 text-xs font-serif text-amber-500/70 hover:text-amber-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-amber-600/40 hover:bg-amber-600/60 border border-amber-500/50 text-amber-100 font-serif font-bold px-4 py-2 rounded-xl transition-all shadow-[0_0_12px_rgba(217,119,6,0.2)]"
          >
            <Save className="w-4 h-4" /> Seal Changes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sketch-border bg-[#0b132b]/80 rounded-2xl overflow-hidden shadow-xl" style={{ borderRadius: '1.5rem 0.5rem 1.5rem 0.5rem' }}>
      {/* Banner */}
      <div className="p-6 pb-4 border-b border-dashed border-amber-900/40 bg-gradient-to-r from-amber-950/30 via-[#0b132b]/50 to-cyan-950/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {org.logoUrl ? (
              <img src={org.logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-amber-500/40 shadow-[0_0_15px_rgba(217,119,6,0.15)] shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-[#050814] border border-amber-500/40 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(217,119,6,0.15)] shrink-0">
                🏆
              </div>
            )}
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100">{org.name || 'The Grand Tournament'}</h2>
              <p className="text-amber-400/80 font-mono tracking-widest uppercase text-xs flex items-center gap-1.5 mt-1">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                {org.hostName || 'Imperial Host'}
              </p>
            </div>
          </div>
          {editable && (
            <button
              onClick={() => { setForm({ ...org }); setEditing(true); }}
              className="text-amber-500/60 hover:text-amber-300 p-2 rounded-lg hover:bg-amber-950/30 transition-colors"
              title="Edit Tournament Details"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-6 pt-4 space-y-4">
        <div className="flex flex-wrap gap-2.5">
          {org.venue && (
            <span className="flex items-center gap-1.5 text-xs font-serif text-amber-100/90 bg-[#050814]/70 border border-amber-900/40 rounded-lg px-3 py-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              {org.venue}
            </span>
          )}
          {org.format && (
            <span className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-amber-300 bg-amber-950/30 border border-amber-500/30 rounded-lg px-3 py-1">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              {org.format}
            </span>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          {org.mapLink && (
            <a
              href={org.mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-serif text-cyan-300 hover:text-cyan-200 bg-cyan-950/30 border border-cyan-500/30 rounded-lg px-3 py-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Arena Location
            </a>
          )}
          {org.contactWhatsApp && (
            <a
              href={`https://wa.me/${org.contactWhatsApp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-serif text-emerald-300 hover:text-emerald-200 bg-emerald-950/30 border border-emerald-500/30 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" /> Envoy Dispatch
            </a>
          )}
        </div>

        {/* Rules */}
        {org.rules && org.rules.length > 0 && org.rules.some(r => r.trim()) && (
          <div className="pt-2 border-t border-dashed border-amber-900/30">
            <h4 className="text-[10px] font-mono tracking-widest uppercase text-amber-500/70 flex items-center gap-1.5 mb-2">
              <FileText className="w-3.5 h-3.5 text-amber-500" /> Decrees of the Realm
            </h4>
            <ul className="space-y-1.5">
              {org.rules.filter(r => r.trim()).map((rule, i) => (
                <li key={i} className="text-xs font-serif text-amber-100/80 flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-dashed border-amber-900/30">
          <div className="text-center bg-[#050814]/40 p-2 rounded-xl border border-amber-900/20">
            <div className="text-2xl font-mono font-bold text-amber-200">{state.teams.length}</div>
            <div className="text-[10px] font-mono tracking-widest uppercase text-amber-500/50 mt-0.5">Factions</div>
          </div>
          <div className="text-center bg-[#050814]/40 p-2 rounded-xl border border-amber-900/20">
            <div className="text-2xl font-mono font-bold text-cyan-300">{state.players.length}</div>
            <div className="text-[10px] font-mono tracking-widest uppercase text-amber-500/50 mt-0.5">Warriors</div>
          </div>
          <div className="text-center bg-[#050814]/40 p-2 rounded-xl border border-amber-900/20">
            <div className="text-2xl font-mono font-bold text-emerald-300">{state.matches.length}</div>
            <div className="text-[10px] font-mono tracking-widest uppercase text-amber-500/50 mt-0.5">Clashes</div>
          </div>
        </div>
      </div>
    </div>
  );
}
