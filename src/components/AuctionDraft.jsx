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

/* ── Main AuctionDraft component (Live Cloud-Synced + Bid Guardrails) ── */
export default function AuctionDraft() {
  const {
    state,
    draftPlayer,
    updateTeam,
    setActiveDraft,
    placeDraftBid,
    autoFillUndrafted,
  } = useTournament();
  const { role, authenticatedId, user } = useAuth();

  const { players, teams, captains, draftMode, defaultBudget } = state;
  const activeDraft = state.activeDraft || {};
  const phase = activeDraft.phase || 'IDLE';
  const currentPlayer = activeDraft.playerId
    ? players.find(p => p.id === activeDraft.playerId) || null
    : null;
  const syncedBids = activeDraft.bids || {};

  // Local wheel animation & bid draft inputs
  const [posFilter,     setPosFilter]     = useState('ALL');
  const [spinning,      setSpinning]      = useState(false);
  const [targetIndex,   setTargetIndex]   = useState(null);
  const [localBids,     setLocalBids]     = useState({});     // teamId -> amount
  const [celebration,   setCelebration]   = useState(false);

  const isAdmin   = role === 'ADMIN';
  const isCaptain = role === 'CAPTAIN';

  const minSquadSize = Number(activeDraft.minSquadSize) || 5;
  const minBasePrice = Number(activeDraft.minBasePrice) || 50;

  // Pool of undrafted players
  const undrafted = players.filter(p => p.status === 'UNDRAFTED');

  const pool = posFilter === 'ALL'
    ? undrafted
    : undrafted.filter(p => p.position === posFilter || p.rawPositions?.includes(posFilter));

  const positions = ['ALL', 'GK', 'DEF', 'MID', 'FWD', 'FLEX'];

  const myTeam = isCaptain
    ? teams.find(t => {
        const cap = captains.find(c => c.id === authenticatedId);
        return cap && t.id === cap.teamId;
      })
    : null;

  function getRemainingBudget(team) {
    return (team.budget ?? defaultBudget ?? 1000) - (team.spent ?? 0);
  }

  function getTeamRosterCount(team) {
    return players.filter(p => p.teamId === team.id || team.rosterIds?.includes(p.id)).length;
  }

  // Max safe bid ensures team always keeps enough budget for remaining required squad slots
  function getMaxSafeBid(team) {
    const rem = getRemainingBudget(team);
    const currentSize = getTeamRosterCount(team);
    const slotsLeftAfterThis = Math.max(0, minSquadSize - currentSize - 1);
    const reserved = slotsLeftAfterThis * minBasePrice;
    return Math.max(0, rem - reserved);
  }

  function getEffectiveBid(teamId) {
    const syncedEntry = syncedBids[teamId];
    const syncedVal = typeof syncedEntry === 'number' ? syncedEntry : (syncedEntry?.amount ?? 0);
    return localBids[teamId] !== undefined ? localBids[teamId] : syncedVal;
  }

  function handleSpin() {
    if (pool.length === 0 || spinning || !isAdmin) return;
    const idx = Math.floor(Math.random() * pool.length);
    setTargetIndex(idx);
    setSpinning(true);
    setLocalBids({});
    setActiveDraft({
      phase: 'SPINNING',
      playerId: null,
      bids: {},
      highestTeamId: null,
      highestBid: 0,
    });
  }

  const handleSpinEnd = useCallback(() => {
    setSpinning(false);
    const landed = pool[targetIndex];
    if (!landed) return;
    setLocalBids({});
    setActiveDraft({
      phase: 'BIDDING',
      playerId: landed.id,
      bids: {},
      highestTeamId: null,
      highestBid: 0,
    });
  }, [pool, targetIndex, setActiveDraft]);

  function handleBidChange(teamId, val) {
    const n = parseInt(val, 10);
    setLocalBids(prev => ({ ...prev, [teamId]: isNaN(n) ? 0 : Math.max(0, n) }));
  }

  function handleCaptainSubmitBid(team) {
    if (!team || phase !== 'BIDDING') return;
    const amount = getEffectiveBid(team.id);
    const maxSafe = getMaxSafeBid(team);
    if (amount > maxSafe) return;
    placeDraftBid({ teamId: team.id, amount, byUid: user?.uid || authenticatedId || null });
  }

  function handleAssign(teamId) {
    if (!currentPlayer || !isAdmin) return;
    const team    = teams.find(t => t.id === teamId);
    const amount  = getEffectiveBid(teamId);
    const maxSafe = getMaxSafeBid(team);
    if (amount > maxSafe) return;

    draftPlayer(currentPlayer.id, teamId);
    updateTeam({ id: teamId, spent: (team.spent ?? 0) + amount });

    setActiveDraft({
      phase: 'ASSIGNED',
      playerId: null,
      bids: {},
      highestTeamId: null,
      highestBid: 0,
      lastWinner: {
        teamId,
        amount,
        teamName: team.name,
        playerName: currentPlayer.name,
      },
    });
    setLocalBids({});
    setCelebration(true);
    setTimeout(() => setCelebration(false), 3000);
  }

  function handleReset() {
    setLocalBids({});
    setTargetIndex(null);
    setSpinning(false);
    setActiveDraft({
      phase: 'IDLE',
      playerId: null,
      bids: {},
      highestTeamId: null,
      highestBid: 0,
    });
  }

  const canSpin = isAdmin && pool.length > 0 && (phase === 'IDLE' || phase === 'ASSIGNED');
  const winner = activeDraft.lastWinner;
  const highestTeam = activeDraft.highestTeamId
    ? teams.find(t => t.id === activeDraft.highestTeamId)
    : null;

  // ── FREE DRAFT mode ──
  if (draftMode === 'FREE') {
    return (
      <div className="space-y-6">
        <div className="sketch-border bg-[#0b132b]/60 rounded-2xl p-6 shadow-xl text-center space-y-3">
          <Dices className="w-10 h-10 text-amber-400 mx-auto" />
          <h2 className="text-2xl font-serif text-amber-200">Free Draft Mode</h2>
          <p className="text-amber-500/60 text-sm">Spin the wheel and assign players directly.</p>
        </div>

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
            onSpinEnd={handleSpinEnd}
          />
        ) : (
          <div className="text-center py-12 text-amber-500/40">
            <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
            <p className="font-semibold text-white">All players drafted!</p>
          </div>
        )}

        {phase === 'BIDDING' && currentPlayer && isAdmin && (
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

  // ── AUCTION mode (Synced Real-Time Room) ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sketch-border bg-[#0b132b]/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-serif text-amber-200 flex items-center gap-2">
              <Dices className="w-5 h-5 text-amber-400" /> Live Auction Room
            </h2>
            <p className="text-sm text-amber-500/60 mt-0.5">
              Synced across devices • Spin → Captains bid live → Admin assigns
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap text-xs font-mono">
            <span className="flex items-center gap-1.5 text-amber-300 bg-[#050814] border border-amber-900/40 px-3 py-1.5 rounded-lg">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              Default: {defaultBudget ?? 1000}
            </span>
            {isAdmin && undrafted.length > 0 && teams.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Auto-assign all ${undrafted.length} remaining undrafted players evenly across ${teams.length} teams?`)) {
                    autoFillUndrafted();
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/35 border border-cyan-500/40 text-cyan-200 font-semibold transition-colors"
              >
                Auto-Fill Remaining ({undrafted.length})
              </button>
            )}
          </div>
        </div>

        {/* Squad Guardrails Controls (Admin) */}
        {isAdmin && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-dashed border-amber-900/30">
            <div>
              <label className="text-[10px] font-mono uppercase text-amber-500/60">Min Squad Size (Guardrail)</label>
              <input
                type="number"
                min="1"
                max="25"
                value={minSquadSize}
                onChange={e => setActiveDraft({ minSquadSize: Math.max(1, Number(e.target.value) || 1) })}
                className="w-full mt-1 bg-[#050814] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-100"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-amber-500/60">Min Reserve / Slot</label>
              <input
                type="number"
                min="0"
                step="10"
                value={minBasePrice}
                onChange={e => setActiveDraft({ minBasePrice: Math.max(0, Number(e.target.value) || 0) })}
                className="w-full mt-1 bg-[#050814] border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Team budgets strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {teams.map(t => {
          const rem     = getRemainingBudget(t);
          const total   = t.budget ?? defaultBudget ?? 1000;
          const pct     = Math.max(0, (rem / total) * 100);
          const maxSafe = getMaxSafeBid(t);
          const rosterCount = getTeamRosterCount(t);
          return (
            <div key={t.id} className="sketch-border bg-[#050814]/70 rounded-xl p-3 border border-amber-900/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-100 truncate">{t.logo} {t.name}</span>
                <span className={`text-xs font-bold font-mono ${rem < total * 0.2 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {rem}
                </span>
              </div>
              <div className="h-1.5 bg-[#050814] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${rem < total * 0.2 ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-amber-500/60">
                <span>Squad: {rosterCount}/{minSquadSize}</span>
                <span className="text-cyan-300/80">Max bid: {maxSafe}</span>
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
        <span className="ml-auto text-xs text-gray-500 self-center font-mono">
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

      {/* Spin button */}
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
        <div className="w-full py-4 rounded-xl bg-[#050814] text-amber-400 text-lg font-bold text-center border border-amber-500/30">
          🌀 Spinning live on the Auction Floor…
        </div>
      )}

      {/* Synced Live Bidding Panel */}
      {phase === 'BIDDING' && currentPlayer && (
        <div className="sketch-border bg-[#0b132b]/90 rounded-2xl p-6 shadow-2xl space-y-5">
          {/* Player card + Highest Bid */}
          <div className="flex items-center justify-between gap-4 flex-wrap p-4 bg-[#050814]/80 rounded-xl border border-amber-900/30">
            <div className="flex items-center gap-4">
              {currentPlayer.avatar && (currentPlayer.avatar.startsWith('http') || currentPlayer.avatar.startsWith('data:image')) ? (
                <img src={currentPlayer.avatar} alt={currentPlayer.name} className="w-14 h-14 rounded-full object-cover border border-amber-500/40 shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl font-black text-white shrink-0">
                  {currentPlayer.name[0].toUpperCase()}
                </div>
              )}
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

            {highestTeam && (
              <div className="px-3.5 py-2 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-right">
                <p className="text-[10px] font-mono uppercase text-emerald-400">Highest Live Bid</p>
                <p className="text-sm font-serif font-bold text-emerald-200">
                  {highestTeam.logo} {highestTeam.name} • <span className="font-mono">{activeDraft.highestBid}</span>
                </p>
              </div>
            )}
          </div>

          {/* Bid inputs per team (admin view) */}
          {isAdmin && (
            <div className="space-y-3">
              <h4 className="text-sm font-serif text-amber-200 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" /> Live Team Bids
              </h4>
              {teams.map(t => {
                const rem     = getRemainingBudget(t);
                const maxSafe = getMaxSafeBid(t);
                const bidVal  = getEffectiveBid(t.id);
                const overBid = bidVal > maxSafe;
                const syncedEntry = syncedBids[t.id];
                const liveSyncedVal = typeof syncedEntry === 'number' ? syncedEntry : (syncedEntry?.amount || 0);

                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 bg-[#050814]/60 rounded-xl border border-amber-900/30 flex-wrap sm:flex-nowrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-serif font-semibold text-amber-100 truncate">{t.logo} {t.name}</span>
                        <span className="text-xs font-mono text-amber-500/70">
                          Rem: {rem} • Max safe: <strong className="text-cyan-300">{maxSafe}</strong>
                        </span>
                      </div>
                      {liveSyncedVal > 0 && (
                        <p className="text-[10px] font-mono text-emerald-400 mt-0.5">
                          Captain live bid: {liveSyncedVal}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={maxSafe}
                        value={bidVal}
                        onChange={e => handleBidChange(t.id, e.target.value)}
                        className={`w-20 bg-[#0b132b] border rounded-lg px-2 py-1.5 text-white text-sm text-center focus:outline-none focus:ring-2 ${
                          overBid ? 'border-red-500 focus:ring-red-500' : 'border-amber-900/40 focus:border-amber-400 font-mono'
                        }`}
                      />
                      <button
                        onClick={() => handleAssign(t.id)}
                        disabled={overBid}
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

          {/* Captain live remote bidding view */}
          {isCaptain && myTeam && (
            <div className="space-y-3 bg-[#050814]/70 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-sm font-serif text-amber-200 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400" />
                  Your Live Bid ({myTeam.logo} {myTeam.name})
                </h4>
                <span className="text-xs font-mono text-cyan-300">
                  Budget: {getRemainingBudget(myTeam)} • Max Safe Bid: {getMaxSafeBid(myTeam)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={getMaxSafeBid(myTeam)}
                  value={getEffectiveBid(myTeam.id)}
                  onChange={e => handleBidChange(myTeam.id, e.target.value)}
                  className="w-28 bg-[#0b132b] border border-amber-900/50 rounded-lg px-3 py-2 text-white text-sm text-center font-mono focus:outline-none focus:border-amber-400"
                />
                {[50, 100].map(inc => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => {
                      const base = Math.max(activeDraft.highestBid || 0, getEffectiveBid(myTeam.id));
                      const next = Math.min(getMaxSafeBid(myTeam), base + inc);
                      handleBidChange(myTeam.id, next);
                    }}
                    className="px-2.5 py-2 rounded-lg bg-[#0b132b] border border-amber-900/40 text-amber-300 text-xs font-mono hover:border-amber-500"
                  >
                    +{inc}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={getEffectiveBid(myTeam.id) > getMaxSafeBid(myTeam)}
                  onClick={() => handleCaptainSubmitBid(myTeam)}
                  className="ml-auto px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors"
                >
                  Submit Live Bid
                </button>
              </div>

              {getEffectiveBid(myTeam.id) > getMaxSafeBid(myTeam) && (
                <p className="text-xs text-red-400 font-mono">
                  Exceeds max safe bid ({getMaxSafeBid(myTeam)}) — reserve kept for remaining squad slots.
                </p>
              )}
              <p className="text-xs text-amber-500/60 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Live bids sync to the Admin&apos;s screen immediately.
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
        <div className="rounded-xl bg-[#0b132b]/60 border border-amber-900/40 p-4 text-center text-sm text-amber-500/60">
          <AlertCircle className="w-5 h-5 mx-auto mb-1 text-amber-500" />
          Admin controls the wheel. Captains can submit live bids from their panel.
        </div>
      )}
    </div>
  );
}

