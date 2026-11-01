import React, {
  useRef, useEffect, useState, useCallback, useMemo
} from 'react';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import PlayerProfileModal from './PlayerProfileModal';
import {
  RefreshCw, ChevronDown, Crown, Users, Zap, CheckCircle, X, Dices
} from 'lucide-react';

/* ─────────────────────────────────────────
   Visual palette for wheel segments
───────────────────────────────────────── */
const WHEEL_PALETTE = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
  '#10B981', '#F59E0B', '#6366F1', '#14B8A6',
];

/* ─────────────────────────────────────────
   Easing: deceleration curve
───────────────────────────────────────── */
function easeOut(t) {
  return 1 - Math.pow(1 - t, 4);
}

/* ─────────────────────────────────────────
   Draw the wheel on canvas
───────────────────────────────────────── */
function drawWheel(canvas, players, rotation, highlightIdx) {
  if (!canvas || players.length === 0) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(cx, cy) - 6;
  const n = players.length;
  const arc = (2 * Math.PI) / n;

  ctx.clearRect(0, 0, W, H);

  // Outer glow ring
  const grd = ctx.createRadialGradient(cx, cy, R - 10, cx, cy, R + 6);
  grd.addColorStop(0, 'rgba(255,255,255,0)');
  grd.addColorStop(1, 'rgba(255,255,255,0.08)');
  ctx.beginPath();
  ctx.arc(cx, cy, R + 4, 0, Math.PI * 2);
  ctx.fillStyle = grd;
  ctx.fill();

  players.forEach((player, i) => {
    const startAngle = rotation + i * arc;
    const endAngle = startAngle + arc;
    const isHL = i === highlightIdx;

    // Segment fill
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, isHL ? R + 6 : R, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = WHEEL_PALETTE[i % WHEEL_PALETTE.length];
    ctx.fill();

    // Segment border
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + arc / 2);

    const fontSize = Math.min(14, Math.max(8, Math.floor(180 / n)));
    const textR = R * 0.68;

    // Truncate long names
    const maxChars = Math.max(4, Math.floor(35 / n) + 4);
    const label = player.name.length > maxChars
      ? player.name.slice(0, maxChars - 1) + '…'
      : player.name;

    // Text shadow / pill
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, textR, 0);
    ctx.restore();
  });

  // Centre hub
  const hubGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28);
  hubGrd.addColorStop(0, '#1F2937');
  hubGrd.addColorStop(1, '#111827');
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.fillStyle = hubGrd;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 🏆 centre icon text
  ctx.font = '18px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏆', cx, cy);

  // Pointer (triangle at right = 3 o'clock)
  const pX = cx + R + 18;
  const pY = cy;
  ctx.beginPath();
  ctx.moveTo(pX + 12, pY);
  ctx.lineTo(pX - 2, pY - 10);
  ctx.lineTo(pX - 2, pY + 10);
  ctx.closePath();
  ctx.fillStyle = '#FBBF24';
  ctx.shadowColor = '#F59E0B';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
}

/* ─────────────────────────────────────────
   Spin‑the‑Wheel component
───────────────────────────────────────── */
export default function SpinWheel() {
  const { state, draftPlayer } = useTournament();
  const { role, authenticatedId } = useAuth();

  // ── Filters ──
  const [posFilter, setPosFilter] = useState('ALL');
  const [captainSel, setCaptainSel] = useState('');

  // ── Spin state ──
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const rotRef = useRef(0);

  // ── Result state ──
  const [winner, setWinner] = useState(null);   // player object
  const [showModal, setShowModal] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [viewProfile, setViewProfile] = useState(null);

  /* Undrafted players filtered by position */
  const pool = useMemo(() => {
    return state.players.filter(p => {
      if (p.status === 'DRAFTED') return false;
      if (posFilter === 'ALL') return true;
      if (posFilter === 'FLEX') return p.position === 'FLEX' || p.position === 'ANY';
      return p.position === posFilter;
    });
  }, [state.players, posFilter]);

  /* Active captain (from selector or auto from role) */
  const activeCaptain = useMemo(() => {
    if (role === 'CAPTAIN') return state.captains.find(c => c.id === authenticatedId) ?? null;
    if (captainSel) return state.captains.find(c => c.id === captainSel) ?? null;
    return null;
  }, [role, authenticatedId, captainSel, state.captains]);

  const activeTeam = useMemo(() =>
    activeCaptain ? state.teams.find(t => t.id === activeCaptain.teamId) ?? null : null
    , [activeCaptain, state.teams]);

  /* Current segment index given a rotation angle */
  const getWinnerIdx = useCallback((rot) => {
    if (pool.length === 0) return -1;
    const arc = (2 * Math.PI) / pool.length;
    // Pointer is at angle 0 (3 o'clock = right of centre)
    // normalise rotation to [0, 2π)
    const norm = ((rot % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    // The segment under the pointer is where 0 lands in the rotated frame
    const idx = Math.floor(((2 * Math.PI) - norm) / arc) % pool.length;
    return idx;
  }, [pool]);

  /* Draw on every rotation change */
  useEffect(() => {
    if (canvasRef.current) {
      const hi = spinning ? -1 : getWinnerIdx(rotation);
      drawWheel(canvasRef.current, pool, rotation, hi);
    }
  }, [rotation, pool, spinning, getWinnerIdx]);

  /* Resize canvas */
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const size = Math.min(canvas.parentElement?.clientWidth ?? 320, 420);
      canvas.width = size;
      canvas.height = size;
      drawWheel(canvas, pool, rotRef.current, -1);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [pool]);

  /* ── SPIN ── */
  function spin() {
    if (spinning || pool.length === 0 || !activeCaptain) return;

    setWinner(null);
    setShowModal(false);
    setConfirmed(false);

    // Random full rotations (5–12) + a random extra angle
    const extraSpins = 5 + Math.floor(Math.random() * 7);
    const extraAngle = Math.random() * 2 * Math.PI;
    const totalAngle = extraSpins * 2 * Math.PI + extraAngle;
    const duration = 4000 + Math.random() * 2000; // 4‑6 s
    const startRot = rotRef.current;
    const targetRot = startRot + totalAngle;
    const startTime = performance.now();

    setSpinning(true);

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);
      const currentR = startRot + eased * totalAngle;

      rotRef.current = currentR;
      setRotation(currentR);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rotRef.current = targetRot;
        setRotation(targetRot);
        setSpinning(false);

        const idx = getWinnerIdx(targetRot);
        const picked = pool[idx] ?? null;
        setWinner(picked);
        setShowModal(true);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
  }

  /* Cleanup RAF on unmount */
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  /* ── Confirm draft pick ── */
  function confirmDraft() {
    if (!winner || !activeTeam) return;
    draftPlayer(winner.id, activeTeam.id);
    setConfirmed(true);
  }

  const canSpin = (role === 'ADMIN' || role === 'CAPTAIN') && activeCaptain && pool.length > 0 && !spinning;

  const POS_PILLS = ['ALL', 'GK', 'DEF', 'MID', 'FWD', 'FLEX'];
  const POS_COLORS = {
    ALL: { active: 'bg-white text-gray-900', inactive: 'bg-[#0b132b] text-amber-100 hover:bg-gray-600' },
    GK: { active: 'bg-yellow-400 text-gray-900', inactive: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30' },
    DEF: { active: 'bg-blue-500 text-white', inactive: 'bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30' },
    MID: { active: 'bg-green-500 text-white', inactive: 'bg-green-500/15 text-green-300 border border-green-500/30 hover:bg-green-500/30' },
    FWD: { active: 'bg-red-500 text-white', inactive: 'bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/30' },
    FLEX: { active: 'bg-purple-500 text-white', inactive: 'bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30' },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif text-amber-200 flex items-center gap-2">
          <Dices className="w-5 h-5 text-amber-400" />
          Spin the Wheel
        </h2>
        <span className="text-xs text-amber-500/40 bg-[#050814] px-2 py-1 rounded-lg">
          {pool.length} player{pool.length !== 1 ? 's' : ''} in pool
        </span>
      </div>

      {/* Captain selector (admin-only) */}
      {role === 'ADMIN' && (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-amber-500/60 uppercase tracking-wider">Active Captain (Picking Team)</label>
          <div className="relative">
            <Crown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
            <select
              value={captainSel}
              onChange={e => setCaptainSel(e.target.value)}
              className="w-full bg-[#050814] border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer"
            >
              <option value="">— Select a captain —</option>
              {state.captains.map(c => {
                const t = state.teams.find(t2 => t2.id === c.teamId);
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} ({t?.name ?? 'No team'})
                  </option>
                );
              })}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/40 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Captain Panel info */}
      {role === 'CAPTAIN' && activeCaptain && activeTeam && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border"
          style={{ background: activeTeam.primaryColor + '18', borderColor: activeTeam.primaryColor + '40' }}
        >
          <span className="text-2xl">{activeTeam.logo}</span>
          <div>
            <p className="text-sm font-serif font-semibold text-amber-100">{activeTeam.name}</p>
            <p className="text-xs text-amber-400 flex items-center gap-1">
              <Crown className="w-3 h-3" /> {activeCaptain.name} — your spin
            </p>
          </div>
        </div>
      )}

      {/* Position pot filter */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-amber-500/60 uppercase tracking-wider">Position Pot Filter</label>
        <div className="flex flex-wrap gap-2">
          {POS_PILLS.map(p => (
            <button
              key={p}
              onClick={() => setPosFilter(p)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${posFilter === p
                  ? POS_COLORS[p].active
                  : POS_COLORS[p].inactive
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Canvas area ── */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full max-w-[420px] mx-auto">
          {pool.length === 0 ? (
            <div className="w-full aspect-square max-w-[420px] rounded-full border-2 border-dashed border-gray-700 flex flex-col items-center justify-center text-amber-500/30 gap-3">
              <Users className="w-12 h-12 opacity-40" />
              <p className="text-sm text-center px-8">
                No undrafted players match this filter.<br />
                Change the position pot or check the player list.
              </p>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="w-full rounded-full"
              style={{ imageRendering: 'pixelated' }}
            />
          )}
        </div>

        {/* Spin button */}
        <button
          onClick={spin}
          disabled={!canSpin}
          className={`relative flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl ${canSpin
              ? 'bg-[#050814] border border-amber-500/50 text-amber-300 hover:bg-amber-950/40 font-serif shadow-[0_0_15px_rgba(217,119,6,0.2)] hover:scale-105 active:scale-95'
              : 'bg-[#050814] text-amber-500/30 cursor-not-allowed'
            }`}
        >
          <RefreshCw className={`w-5 h-5 ${spinning ? 'animate-spin' : ''}`} />
          {spinning ? 'Spinning…' : 'SPIN!'}
        </button>

        {!activeCaptain && (
          <p className="text-sm text-amber-500/80 text-center">
            {role === 'ADMIN'
              ? '⬆ Select a captain above to enable spinning'
              : 'Login as a Captain or Admin to spin'}
          </p>
        )}
      </div>

      {/* Pool list (scrollable) */}
      {pool.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-amber-500/40 uppercase tracking-wider">Current Pool ({pool.length})</p>
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {pool.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                style={{ background: WHEEL_PALETTE[i % WHEEL_PALETTE.length] + '15' }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: WHEEL_PALETTE[i % WHEEL_PALETTE.length] }}
                />
                <span className="text-sm text-white font-medium flex-1 truncate">{p.name}</span>
                <span className="text-xs text-amber-500/60 font-mono">{p.position}</span>
                {p.rawPositions?.filter(r => r !== 'ANY').map((rp, j) => (
                  <span key={j} className="text-[10px] px-1 py-0.5 rounded bg-[#0b132b] text-amber-500/60 font-mono">{rp}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Winner Modal ── */}
      {showModal && winner && (
        <div className="fixed inset-0 bg-[#050814]/85 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="sketch-border bg-[#0b132b] rounded-3xl w-full max-w-sm p-6 text-amber-50 shadow-2xl shadow-2xl shadow-amber-500/10 text-center space-y-4">

            {/* Confetti emoji animation */}
            <div className="text-5xl animate-bounce">🎉</div>

            <div>
              <p className="text-amber-500/60 text-sm font-medium uppercase tracking-widest mb-1">Draft Pick</p>
              <h2 className="text-3xl font-serif font-bold text-amber-200">{winner.name}</h2>

              {/* Position badges */}
              <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${winner.position === 'GK' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' :
                    winner.position === 'DEF' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                      winner.position === 'MID' ? 'bg-green-500/20 text-green-300 border-green-500/40' :
                        winner.position === 'FWD' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
                          'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  }`}>
                  {winner.position}
                </span>
                {winner.rawPositions?.filter(r => r !== 'ANY').map((rp, i) => (
                  <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-[#0b132b] text-amber-500/60 font-mono">{rp}</span>
                ))}
              </div>
            </div>

            {activeTeam && !confirmed && (
              <div
                className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl border"
                style={{ background: activeTeam.primaryColor + '18', borderColor: activeTeam.primaryColor + '40' }}
              >
                <span className="text-2xl">{activeTeam.logo}</span>
                <div className="text-left">
                  <p className="text-xs text-amber-500/60">Drafted to</p>
                  <p className="text-sm font-serif font-semibold text-amber-100">{activeTeam.name}</p>
                </div>
              </div>
            )}

            {confirmed ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
                <p className="text-emerald-400 font-semibold">
                  {winner.name} joined {activeTeam?.name}!
                </p>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => setViewProfile(winner)}
                    className="text-sm text-blue-400 hover:text-blue-300 underline"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => { setShowModal(false); setWinner(null); setConfirmed(false); }}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                  >
                    Spin Again
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowModal(false); }}
                  className="flex-1 py-2.5 rounded-xl bg-[#050814] hover:bg-[#0b132b] text-amber-100 font-medium text-sm transition-colors"
                >
                  Re-spin
                </button>
                <button
                  onClick={confirmDraft}
                  disabled={!activeTeam}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:bg-[#0b132b] disabled:text-amber-500/40 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/25"
                >
                  ✓ Confirm Draft
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile viewer from winner modal */}
      {viewProfile && (
        <PlayerProfileModal player={viewProfile} onClose={() => setViewProfile(null)} />
      )}
    </div>
  );
}

