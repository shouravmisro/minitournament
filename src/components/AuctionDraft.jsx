import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import {
  Dices, Play, RotateCcw, CheckCircle, X, Coins,
  Crown, Users, TrendingDown, AlertCircle, ChevronDown,
} from 'lucide-react';

/* ── Palette for wheel segments ── */
const SEGMENT_COLORS = [
  '#EF4444','#F97316','#EAB308','#22C55E',
  '#14B8A6','#3B82F6','#8B5CF6','#EC4899',
  '#F43F5E','#10B981','#6366F1','#FB923C',
];

/* ── Canvas wheel component ── */
function WheelCanvas({ players, spinning, onSpinEnd, targetIndex }) {
  const canvasRef   = useRef(null);
  const rafRef      = useRef(null);
  const angleRef    = useRef(0);
  const velRef      = useRef(0);
  const startAngle  = useRef(0);
  const endAngle    = useRef(0);
  const spinningRef = useRef(false);

  const N = players.length;

  const draw = useCallback((angle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    const W    = canvas.width;
    const cx   = W / 2;
    const cy   = W / 2;
    const R    = cx - 6;
    const arc  = (2 * Math.PI) / N;

    ctx.clearRect(0, 0, W, W);

    // Draw segments
    players.forEach((p, i) => {
      const start = angle + i * arc - Math.PI / 2;
      const end   = start + arc;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, start, end);
      ctx.closePath();
      ctx.fillStyle = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#111827';
      ctx.lineWidth   = 2;
      ctx.stroke();

      // Label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font      = `bold ${Math.max(10, Math.min(14, 200 / N))}px sans-serif`;
      const label   = p.name.length > 12 ? p.name.slice(0, 11) + '…' : p.name;
      ctx.fillText(label, R - 8, 5);
      ctx.restore();
    });

    // Centre circle
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
    ctx.fillStyle = '#1F2937';
    ctx.fill();
    ctx.strokeStyle = '#6B7280';
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Pointer (top)
    ctx.beginPath();
    ctx.moveTo(cx,      cy - R - 2);
    ctx.lineTo(cx - 12, cy - R + 16);
    ctx.lineTo(cx + 12, cy - R + 16);
    ctx.closePath();
    ctx.fillStyle   = '#F59E0B';
    ctx.fill();
  }, [players, N]);

  // On spin trigger
  useEffect(() => {
    if (!spinning || N === 0 || targetIndex === null) return;
    spinningRef.current = true;

    const arc         = (2 * Math.PI) / N;
    const segCenter   = targetIndex * arc + arc / 2;
    // We want segment centre to stop at the top (pointer at 0 = -PI/2)
    // angleRef holds current rotation offset; after spinning, angle + segCenter = -PI/2 mod 2PI
    const fullSpins   = 6;
    const currentAng  = angleRef.current % (2 * Math.PI);
    const desired     = -segCenter - Math.PI / 2 + 2 * Math.PI * fullSpins;
    endAngle.current  = currentAng + desired;
    startAngle.current = currentAng;

    const duration = 5000; // ms
    const t0       = performance.now();

    function animate(now) {
      const t    = Math.min((now - t0) / duration, 1);
      // Quartic ease-out
      const ease = 1 - Math.pow(1 - t, 4);
      angleRef.current = startAngle.current + (endAngle.current - startAngle.current) * ease;
      draw(angleRef.current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        spinningRef.current = false;
        angleRef.current    = endAngle.current;
        onSpinEnd();
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [spinning, targetIndex, N, draw, onSpinEnd]);

  // Initial draw
  useEffect(() => {
    if (N > 0) draw(angleRef.current);
  }, [players, draw]);

  const size = Math.min(320, window.innerWidth - 40);
  return (
    <div className="relative flex items-center justify-center">
      <canvas ref={canvasRef} width={size} height={size} className="rounded-full shadow-2xl" />
    </div>
  );
}

/* ── Main AuctionDraft component ── */
export default function AuctionDraft() {
  const { state, draftPlayer, updateTeam } = useTournament();
  const { role, entityId }                  = useAuth();

  const { players, teams, captains, draftMode, defaultBudget } = state;

  // Local auction state
  const [posFilter,     setPosFilter]     = useState('ALL');
  const [phase,         setPhase]         = useState('IDLE'); // IDLE | SPINNING | BIDDING | ASSIGNED
  const [spinning,      setSpinning]      = useState(false);
  const [targetIndex,   setTargetIndex]   = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [bids,          setBids]          = useState({});     // teamId -> amount
  const [winner,        setWinner]        = useState(null);   // { teamId, amount }
  const [celebration,   setCelebration]   = useState(false);

  const isAdmin   = role === 'ADMIN';
  const isCaptain = role === 'CAPTAIN';

  // Pool of undrafted players (non-captain-only)
  const undrafted = players.filter(p => p.status === 'UNDRAFTED');

  // Filtered pool
  const pool = posFilter === 'ALL'
    ? undrafted
    : undrafted.filter(p => p.position === posFilter || p.rawPositions?.includes(posFilter));

  const positions = ['ALL', 'GK', 'DEF', 'MID', 'FWD', 'FLEX'];

  // My team (for captain view)
  const myTeam = isCaptain
    ? teams.find(t => {
        const cap = captains.find(c => c.id === entityId);
        return cap && t.id === cap.teamId;
      })
    : null;

  function getRemainingBudget(team) {
    return (team.budget ?? defaultBudget ?? 1000) - (team.spent ?? 0);
  }

  function handleSpin() {
    if (pool.length === 0 || spinning) return;
    const idx = Math.floor(Math.random() * pool.length);
    setTargetIndex(idx);
    setSpinning(true);
    setPhase('SPINNING');
    setBids({});
    setWinner(null);
  }

  const handleSpinEnd = useCallback(() => {
    setSpinning(false);
    if (!pool[targetIndex]) return;
    setCurrentPlayer(pool[targetIndex]);
    // Pre-fill bid inputs at 0
    const initBids = {};
    teams.forEach(t => { initBids[t.id] = 0; });
    setBids(initBids);
    setPhase('BIDDING');
  }, [pool, targetIndex, teams]);

  function handleBidChange(teamId, val) {
    const n = parseInt(val, 10);
    setBids(prev => ({ ...prev, [teamId]: isNaN(n) ? 0 : n }));
  }

  function handleAssign(teamId) {
    if (!currentPlayer || !isAdmin) return;
    const team   = teams.find(t => t.id === teamId);
    const amount = bids[teamId] || 0;

    draftPlayer(currentPlayer.id, teamId);
    updateTeam({ id: teamId, spent: (team.spent ?? 0) + amount });

    setWinner({ teamId, amount, teamName: team.name, playerName: currentPlayer.name });
    setPhase('ASSIGNED');
    setCelebration(true);
    setTimeout(() => setCelebration(false), 3000);
  }

  function handleReset() {
    setPhase('IDLE');
    setCurrentPlayer(null);
    setBids({});
    setWinner(null);
    setTargetIndex(null);
    setSpinning(false);
  }

  const canSpin = isAdmin && pool.length > 0 && (phase === 'IDLE' || phase === 'ASSIGNED');

  // ── FREE DRAFT mode ──
  if (draftMode === 'FREE') {
    return (
      <div className="space-y-6">
        <div className="sketch-border bg-[#0b132b]/60 rounded-2xl p-6 shadow-xl text-center space-y-3">
          <Dices className="w-10 h-10 text-amber-400 mx-auto" />
          <h2 className="text-2xl font-serif text-amber-200">Free Draft Mode</h2>
          <p className="text-amber-500/60 text-sm">Spin the wheel and assign players directly.</p>
        </div>

        {/* Pos filter */}
        <div className="flex gap-1.5 flex-wrap">
          {positions.map(pos => (
            <button key={pos} onClick={() => setPosFilter(pos)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                posFilter === pos
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(217,119,6,0.2)]'
                  : 'bg-[#050814] text-amber-500/60 hover:bg-[#0b132b] hover:text-white'
              }`}
            >{pos}</button>
          ))}
        </div>

        <p className="text-sm text-amber-500/40">{pool.length} undrafted player{pool.length !== 1 ? 's' : ''} in pool</p>

        {pool.length > 0 ? (
          <WheelCanvas
            players={pool}
            spinning={spinning}
            targetIndex={targetIndex}
            onSpinEnd={() => {
              setSpinning(false);
              setCurrentPlayer(pool[targetIndex]);
              setPhase('BIDDING');
            }}
          />
        ) : (
          <div className="text-center py-12 text-amber-500/40">
            <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
            <p className="font-semibold text-white">All players drafted!</p>
          </div>
        )}

        {/* Free draft assign panel */}
        {phase === 'BIDDING' && currentPlayer && (
          <div className="sketch-border bg-[#0b132b]/90 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Dices className="w-4 h-4 text-amber-400" />
              Assign <span className="text-amber-400">{currentPlayer.name}</span> to:
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {teams.map(t => (
                <button key={t.id} onClick={() => { draftPlayer(currentPlayer.id, t.id); handleReset(); }}
                  className="p-3 rounded-lg bg-[#050814] hover:bg-amber-600 border border-gray-700 hover:border-amber-500 text-sm font-medium text-amber-100 hover:text-white transition-all text-left"
                >
                  {t.logo} {t.name}
                </button>
              ))}
            </div>
            <button onClick={handleReset} className="text-amber-500/40 hover:text-white text-sm flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Skip
            </button>
          </div>
        )}

        {canSpin && (
          <button onClick={handleSpin} disabled={pool.length === 0}
            className="w-full py-4 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-[#050814] disabled:text-gray-600 text-white text-lg font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" /> Spin the Wheel!
          </button>
        )}
      </div>
    );
  }

  // ── AUCTION mode (default) ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sketch-border bg-[#0b132b]/80 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-serif text-amber-200 flex items-center gap-2">
              <Dices className="w-5 h-5 text-amber-400" /> Auction Draft
            </h2>
            <p className="text-sm text-amber-500/60 mt-0.5">
              Spin → Player lands → Captains bid → Admin assigns
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-amber-500/60">Default budget:</span>
            <span className="text-amber-400 font-bold">{defaultBudget ?? 1000}</span>
          </div>
        </div>
      </div>

      {/* Team budgets strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {teams.map(t => {
          const rem     = getRemainingBudget(t);
          const total   = t.budget ?? defaultBudget ?? 1000;
          const pct     = Math.max(0, (rem / total) * 100);
          return (
            <div key={t.id} className="sketch-border bg-[#050814]/70 rounded-xl p-3 border border-amber-900/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-100 truncate">{t.logo} {t.name}</span>
                <span className={`text-xs font-bold ${rem < total * 0.2 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {rem}
                </span>
              </div>
              <div className="h-1.5 bg-[#050814] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${rem < total * 0.2 ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Position filter */}
      <div className="flex gap-1.5 flex-wrap">
        {positions.map(pos => (
          <button key={pos} onClick={() => setPosFilter(pos)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              posFilter === pos
                ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(217,119,6,0.2)]'
                : 'bg-[#050814] text-amber-500/60 hover:bg-[#0b132b] hover:text-white'
            }`}
          >{pos}</button>
        ))}
        <span className="ml-auto text-xs text-gray-600 self-center">
          {pool.length} left
        </span>
      </div>

      {/* Celebration banner */}
      {celebration && winner && (
        <div className="rounded-xl bg-emerald-900/40 border border-emerald-500/40 p-4 text-center animate-pulse">
          <p className="text-emerald-300 font-bold text-lg">
            🎉 {winner.playerName} → {winner.teamName} for {winner.amount} coins!
          </p>
        </div>
      )}

      {/* Wheel */}
      {pool.length > 0 ? (
        <div className="flex justify-center">
          <WheelCanvas
            players={pool}
            spinning={spinning}
            targetIndex={targetIndex}
            onSpinEnd={handleSpinEnd}
          />
        </div>
      ) : (
        <div className="text-center py-16 space-y-2">
          <CheckCircle className="w-12 h-12 mx-auto text-emerald-500" />
          <p className="text-2xl font-serif text-amber-200">Draft Complete!</p>
          <p className="text-amber-500/40 text-sm">All players have been assigned to teams.</p>
        </div>
      )}

      {/* Spin button (IDLE / ASSIGNED phase) */}
      {(phase === 'IDLE' || phase === 'ASSIGNED') && pool.length > 0 && isAdmin && (
        <button
          onClick={handleSpin}
          className="w-full py-4 rounded-xl bg-[#050814] border border-amber-500/50 text-amber-300 hover:bg-amber-950/40 font-serif text-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(217,119,6,0.2)]"
        >
          <Play className="w-5 h-5" />
          {phase === 'ASSIGNED' ? 'Spin Again!' : 'Spin the Wheel!'}
        </button>
      )}

      {phase === 'SPINNING' && (
        <div className="w-full py-4 rounded-xl bg-[#050814] text-amber-500/40 text-lg font-bold text-center">
          🌀 Spinning…
        </div>
      )}

      {/* Bidding Panel */}
      {phase === 'BIDDING' && currentPlayer && (
        <div className="sketch-border bg-[#0b132b]/90 rounded-2xl p-6 shadow-2xl space-y-5">
          {/* Player card */}
          <div className="flex items-center gap-4 p-4 bg-[#050814]/80 rounded-xl border border-amber-900/30">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl font-black text-white shrink-0">
              {currentPlayer.name[0].toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-serif text-amber-100">{currentPlayer.name}</h3>
              <div className="flex gap-1 mt-1 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  currentPlayer.position === 'GK'  ? 'bg-yellow-600/20 text-yellow-400' :
                  currentPlayer.position === 'DEF' ? 'bg-blue-600/20 text-blue-400'    :
                  currentPlayer.position === 'MID' ? 'bg-emerald-600/20 text-emerald-400' :
                  currentPlayer.position === 'FWD' ? 'bg-red-600/20 text-red-400'      :
                  'bg-gray-600/20 text-amber-500/60'
                }`}>{currentPlayer.position}</span>
                {currentPlayer.rawPositions?.filter(r => r !== 'ANY').map(r => (
                  <span key={r} className="text-xs px-1.5 py-0.5 rounded bg-[#0b132b] text-amber-500/60">{r}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Bid inputs per team (admin view) */}
          {isAdmin && (
            <div className="space-y-3">
              <h4 className="text-sm font-serif text-amber-200 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" /> Team Bids
              </h4>
              {teams.map(t => {
                const rem     = getRemainingBudget(t);
                const bidVal  = bids[t.id] ?? 0;
                const overBid = bidVal > rem;
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 bg-[#050814]/60 rounded-xl border border-amber-900/30">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-serif font-semibold text-amber-100">{t.logo} {t.name}</span>
                        <span className={`text-xs ${rem < 100 ? 'text-red-400' : 'text-amber-500/60'}`}>
                          Budget: {rem}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={rem}
                        value={bidVal}
                        onChange={e => handleBidChange(t.id, e.target.value)}
                        className={`w-20 bg-[#0b132b] border rounded-lg px-2 py-1.5 text-white text-sm text-center focus:outline-none focus:ring-2 ${
                          overBid ? 'border-red-500 focus:ring-red-500' : 'border-amber-900/40 focus:border-amber-400 font-mono'
                        }`}
                      />
                      <button
                        onClick={() => handleAssign(t.id)}
                        disabled={overBid || rem === 0}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:bg-[#0b132b] disabled:text-gray-600 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Captain view: show own bid input */}
          {isCaptain && myTeam && (
            <div className="space-y-3">
              <h4 className="text-sm font-serif text-amber-200">Your Bid (Budget: {getRemainingBudget(myTeam)})</h4>
              <div className="flex items-center gap-3 p-3 bg-[#050814]/60 rounded-xl border border-amber-900/30">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-sm text-white flex-1">{myTeam.logo} {myTeam.name}</span>
                <input
                  type="number"
                  min={0}
                  max={getRemainingBudget(myTeam)}
                  value={bids[myTeam.id] ?? 0}
                  onChange={e => handleBidChange(myTeam.id, e.target.value)}
                  className="w-24 bg-[#0b132b] border border-amber-900/40 rounded-lg px-2 py-2 text-white text-sm text-center focus:outline-none focus:ring-2 focus:border-amber-400 font-mono"
                />
              </div>
              <p className="text-xs text-amber-500/40 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Admin will assign the player based on bids received.
              </p>
            </div>
          )}

          {/* Skip button */}
          {isAdmin && (
            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-lg border border-gray-700 text-amber-500/60 hover:text-white hover:border-gray-500 text-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Skip this player
            </button>
          )}
        </div>
      )}

      {/* Non-admin, non-bidding view */}
      {!isAdmin && !isCaptain && (
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-4 text-center text-sm text-amber-500/40">
          <AlertCircle className="w-5 h-5 mx-auto mb-1 text-amber-500" />
          Admin controls the wheel. Captains can submit bids.
        </div>
      )}
    </div>
  );
}

