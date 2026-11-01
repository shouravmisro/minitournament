import React, { useState } from 'react';
import {
  parseBulkPlayerText, buildFromParsed,
  parseTeamRosterText,  buildFromTeamRoster,
  useTournament,
} from '../context/TournamentContext';
import {
  Crown, User, X, AlertCircle, ClipboardPaste,
  ChevronRight, ChevronLeft, Sparkles, UserX, Users, CheckCircle,
} from 'lucide-react';

const POSITION_COLORS = {
  GK:   'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  DEF:  'bg-blue-500/20   text-blue-300   border-blue-500/40',
  MID:  'bg-green-500/20  text-green-300  border-green-500/40',
  FWD:  'bg-red-500/20    text-red-300    border-red-500/40',
  FLEX: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
};

const SAMPLE_PLAYER_TEXT = `shourav (captain) (ATM)
shadman(CM,ATM)
tanvir
rahim (GK)
kamal (captain only)
nayeem(CB,LB)
farhan(ST)
jubayer
ripon(CAM)
sakib(RW,LW)
masud(CDM)
arif(GK)`;

const SAMPLE_ROSTER_TEXT = `team GK Warriors
Aryan (captain)
Shourav (ATM)
Nayeem (GK)
Farhan (ST)

team Abrar FC
abrar (captain)(ST)
azmain (GK)
tanvir (CM)
sakib (LW)`;

/* ─── Mode A: Player List ─────────────────────────────────── */
function PlayerListMode({ bulkImport, onClose }) {
  const [step,       setStep]       = useState(1);
  const [rawText,    setRawText]    = useState('');
  const [parsedList, setParsedList] = useState([]);
  const [error,      setError]      = useState('');

  function handleParse() {
    setError('');
    const result = parseBulkPlayerText(rawText);
    if (result.length < 2) { setError('Please enter at least 2 entries. One per line.'); return; }
    if (result.length > 50) { setError('Maximum 50 entries at once.'); return; }
    setParsedList(result);
    setStep(2);
  }

  function toggleCaptain(index) {
    setParsedList(prev => prev.map((p, i) => {
      if (i !== index) return p;
      // Cycle: player → captain (plays) → captain only → player
      if (!p.isCaptain && !p.isCaptainOnly) {
        return { ...p, isCaptain: true, isCaptainOnly: false };
      } else if (p.isCaptain && !p.isCaptainOnly) {
        return { ...p, isCaptain: true, isCaptainOnly: true };
      } else {
        return { ...p, isCaptain: false, isCaptainOnly: false };
      }
    }));
  }

  function handleImport() {
    const data = buildFromParsed(parsedList);
    bulkImport(data);
    setStep(3);
  }

  if (step === 3) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle className="w-14 h-14 text-emerald-500" />
        <h3 className="text-2xl font-serif text-amber-200">Import Successful!</h3>
        <p className="text-amber-500/60 text-sm">
          {parsedList.filter(p => !p.isCaptainOnly).length} players and{' '}
          {parsedList.filter(p => p.isCaptain).length} teams created.
        </p>
        <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors">
          Done
        </button>
      </div>
    );
  }

  if (step === 2) {
    const captains = parsedList.filter(p => p.isCaptain);
    const capOnly  = parsedList.filter(p => p.isCaptainOnly);
    const regular  = parsedList.filter(p => !p.isCaptain && !p.isCaptainOnly);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white">Preview ({parsedList.length} entries)</h3>
          <div className="flex gap-2 text-xs text-amber-500/40">
            <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-amber-400" />{captains.length} caps</span>
            <span className="flex items-center gap-1"><User  className="w-3 h-3 text-blue-400"  />{regular.length} players</span>
            <span className="flex items-center gap-1"><UserX className="w-3 h-3 text-orange-400"/>{capOnly.length} mgr</span>
          </div>
        </div>

        <p className="text-xs text-amber-500/40">Click a row to cycle role: Player → Captain (plays) → Manager only → Player</p>

        <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
          {parsedList.map((p, i) => (
            <button
              key={i}
              onClick={() => toggleCaptain(i)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left ${
                p.isCaptainOnly
                  ? 'bg-orange-900/20 border-orange-700/40 hover:border-orange-500/60'
                  : p.isCaptain
                  ? 'bg-amber-900/20 border-amber-700/40 hover:border-amber-500/60'
                  : 'bg-[#050814]/50 border-amber-900/40/40 hover:border-gray-500/60'
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                p.isCaptainOnly ? 'bg-orange-600' : p.isCaptain ? 'bg-amber-600' : 'bg-gray-600'
              } text-white`}>
                {p.isCaptainOnly ? 'M' : p.isCaptain ? 'C' : 'P'}
              </div>
              <span className={`font-semibold text-sm flex-1 ${
                p.isCaptainOnly ? 'text-orange-300' : p.isCaptain ? 'text-amber-300' : 'text-white'
              }`}>
                {p.name}
              </span>
              <div className="flex gap-1 flex-wrap justify-end">
                {!p.isCaptainOnly && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${POSITION_COLORS[p.position] || POSITION_COLORS.FLEX}`}>
                    {p.position}
                  </span>
                )}
                {p.rawPositions?.filter(r => r !== 'ANY').map(r => (
                  <span key={r} className="text-xs px-1.5 py-0.5 rounded bg-[#0b132b] text-amber-500/60">{r}</span>
                ))}
                {p.isCaptainOnly && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-900/40 text-orange-400 border border-orange-700/40">manager only</span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={() => setStep(1)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-amber-900/50 text-amber-100 hover:bg-[#050814] text-sm transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={handleImport} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-colors">
            <Sparkles className="w-4 h-4" /> Import {parsedList.filter(p => !p.isCaptainOnly).length} Players & {parsedList.filter(p => p.isCaptain).length} Teams
          </button>
        </div>
      </div>
    );
  }

  // Step 1
  return (
    <div className="space-y-4">
      <p className="text-sm text-amber-500/60">
        Paste one player per line. Use <code className="bg-[#050814] px-1 rounded text-amber-400">(captain)</code> or <code className="bg-[#050814] px-1 rounded text-orange-400">(captain only)</code> tags.
      </p>
      <textarea
        value={rawText}
        onChange={e => setRawText(e.target.value)}
        rows={10}
        className="w-full bg-[#050814] border border-amber-900/40 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        placeholder={SAMPLE_PLAYER_TEXT}
        spellCheck={false}
      />
      {error && (
        <p className="text-red-400 text-sm flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </p>
      )}
      <div className="flex gap-3">
        <button
          onClick={() => setRawText(SAMPLE_PLAYER_TEXT)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-900/50 text-amber-500/60 hover:text-white hover:bg-[#050814] text-sm transition-colors"
        >
          <ClipboardPaste className="w-4 h-4" /> Load Sample
        </button>
        <button
          onClick={handleParse}
          disabled={rawText.trim().length < 3}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-[#0b132b] disabled:text-amber-500/40 text-white font-semibold text-sm transition-colors"
        >
          Parse & Preview <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Mode B: Team Roster ─────────────────────────────────── */
function TeamRosterMode({ bulkImport, onClose }) {
  const [rawText,    setRawText]    = useState('');
  const [parsedTeams, setParsedTeams] = useState(null);
  const [error,      setError]      = useState('');
  const [done,       setDone]       = useState(false);

  function handleParse() {
    setError('');
    const result = parseTeamRosterText(rawText);
    if (result.length === 0) {
      setError('No teams found. Start each team block with "team <name>".');
      return;
    }
    const hasPlayers = result.some(t => t.members.length > 0);
    if (!hasPlayers) {
      setError('No players found. Add player names below each team header.');
      return;
    }
    setParsedTeams(result);
  }

  function handleImport() {
    const data = buildFromTeamRoster(parsedTeams);
    bulkImport(data);
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle className="w-14 h-14 text-emerald-500" />
        <h3 className="text-2xl font-serif text-amber-200">Roster Imported!</h3>
        <p className="text-amber-500/60 text-sm">
          {parsedTeams.length} teams with all players are ready.
        </p>
        <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors">
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!parsedTeams ? (
        <>
          <p className="text-sm text-amber-500/60">
            Start each team with <code className="bg-[#050814] px-1 rounded text-amber-400">team &lt;name&gt;</code>, then list players below. Use <code className="bg-[#050814] px-1 rounded text-amber-300">(captain)</code> for team captain.
          </p>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            rows={12}
            className="w-full bg-[#050814] border border-amber-900/40 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            placeholder={SAMPLE_ROSTER_TEXT}
            spellCheck={false}
          />
          {error && (
            <p className="text-red-400 text-sm flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setRawText(SAMPLE_ROSTER_TEXT)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-900/50 text-amber-500/60 hover:text-white hover:bg-[#050814] text-sm transition-colors"
            >
              <ClipboardPaste className="w-4 h-4" /> Load Sample
            </button>
            <button
              onClick={handleParse}
              disabled={rawText.trim().length < 5}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-[#0b132b] disabled:text-amber-500/40 text-white font-semibold text-sm transition-colors"
            >
              Parse Rosters <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <h3 className="font-bold text-white">{parsedTeams.length} Teams Parsed</h3>
          <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
            {parsedTeams.map((team, ti) => (
              <div key={ti} className="bg-[#050814]/60 border border-amber-900/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-bold text-amber-400">{team.name}</span>
                  <span className="text-xs text-amber-500/40">({team.members.length} members)</span>
                </div>
                <div className="space-y-1.5">
                  {team.members.map((m, mi) => (
                    <div key={mi} className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        m.isCaptainOnly ? 'bg-orange-600' : m.isCaptain ? 'bg-amber-600' : 'bg-gray-600'
                      } text-white`}>
                        {m.isCaptainOnly ? 'M' : m.isCaptain ? 'C' : 'P'}
                      </div>
                      <span className={`text-sm font-medium ${
                        m.isCaptainOnly ? 'text-orange-300' : m.isCaptain ? 'text-amber-300' : 'text-white'
                      }`}>{m.name}</span>
                      {!m.isCaptainOnly && (
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${POSITION_COLORS[m.position] || POSITION_COLORS.FLEX}`}>
                          {m.position}
                        </span>
                      )}
                      {m.rawPositions?.filter(r => r !== 'ANY').map(r => (
                        <span key={r} className="text-xs px-1.5 py-0.5 rounded bg-[#0b132b] text-amber-500/60">{r}</span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setParsedTeams(null)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-amber-900/50 text-amber-100 hover:bg-[#050814] text-sm transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleImport}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors"
            >
              <Sparkles className="w-4 h-4" /> Import {parsedTeams.length} Teams
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Wizard Shell ───────────────────────────────────── */
export default function BulkDumpWizard({ onClose }) {
  const { bulkImport } = useTournament();
  const [mode, setMode] = useState('PLAYERS'); // 'PLAYERS' | 'ROSTER'

  return (
    <div className="fixed inset-0 bg-[#050814]/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="sketch-border bg-[#0b132b] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl text-amber-50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-900/30 border-dashed shrink-0">
          <h2 className="text-2xl font-serif text-amber-200 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" /> Quick-Start Wizard
          </h2>
          <button onClick={onClose} className="text-amber-500/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode selector */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex gap-1 p-1 bg-[#050814] rounded-xl border border-amber-900/40">
            <button
              onClick={() => setMode('PLAYERS')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === 'PLAYERS'
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(217,119,6,0.2)] shadow'
                  : 'text-amber-500/60 hover:text-amber-50'
              }`}
            >
              <User className="w-4 h-4" /> Player List
            </button>
            <button
              onClick={() => setMode('ROSTER')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === 'ROSTER'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)] shadow'
                  : 'text-amber-500/60 hover:text-amber-50'
              }`}
            >
              <Users className="w-4 h-4" /> Team Roster
            </button>
          </div>
          <p className="text-xs text-amber-500/30 mt-2 mb-1">
            {mode === 'PLAYERS'
              ? 'Paste a raw player list — captains & teams are auto-created.'
              : 'Auction already done? Import fully-formed team rosters directly.'}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {mode === 'PLAYERS'
            ? <PlayerListMode bulkImport={bulkImport} onClose={onClose} />
            : <TeamRosterMode bulkImport={bulkImport} onClose={onClose} />
          }
        </div>
      </div>
    </div>
  );
}
