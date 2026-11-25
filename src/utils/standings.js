export const TIEBREAKER_OPTIONS = [
  { id: 'GD_GF_H2H', label: 'Pts → GD → GF → H2H', desc: 'Standard league tiebreakers' },
  { id: 'H2H_GD_GF', label: 'Pts → H2H → GD → GF', desc: 'Head-to-Head priority (UEFA/FIFA)' },
  { id: 'GF_GD_H2H', label: 'Pts → GF → GD → H2H', desc: 'Attacking Goals For priority' },
];

/**
 * Computes head-to-head comparison between teamA and teamB across completed league matches.
 * Returns negative if A ranks ahead of B, positive if B ranks ahead of A, 0 if tied.
 */
function compareHeadToHead(teamAId, teamBId, leagueCompleted) {
  let ptsA = 0;
  let ptsB = 0;
  let gdA = 0;
  let gdB = 0;
  let gfA = 0;
  let gfB = 0;

  leagueCompleted.forEach(m => {
    const isAvsB = m.teamAId === teamAId && m.teamBId === teamBId;
    const isBvsA = m.teamAId === teamBId && m.teamBId === teamAId;
    if (!isAvsB && !isBvsA) return;

    const sA = isAvsB ? (m.scoreA ?? 0) : (m.scoreB ?? 0);
    const sB = isAvsB ? (m.scoreB ?? 0) : (m.scoreA ?? 0);

    gfA += sA;
    gfB += sB;
    gdA += sA - sB;
    gdB += sB - sA;

    if (sA > sB) ptsA += 3;
    else if (sB > sA) ptsB += 3;
    else {
      ptsA += 1;
      ptsB += 1;
    }
  });

  if (ptsB !== ptsA) return ptsB - ptsA;
  if (gdB !== gdA) return gdB - gdA;
  if (gfB !== gfA) return gfB - gfA;
  return 0;
}

/**
 * Computes sorted league standings table with configurable tiebreaker rules and recent 5-match form.
 */
export function computeLeagueTable(teams = [], matches = [], tiebreakerMode = 'GD_GF_H2H') {
  const rows = teams.map(t => ({
    id: t.id,
    name: t.name,
    logo: t.logo,
    primaryColor: t.primaryColor,
    P: 0,
    W: 0,
    D: 0,
    L: 0,
    GF: 0,
    GA: 0,
    GD: 0,
    Pts: 0,
    form: [],
  }));

  const rowMap = new Map(rows.map(r => [r.id, r]));
  const leagueCompleted = matches.filter(m => m.stage === 'LEAGUE' && m.status === 'COMPLETED');

  leagueCompleted.forEach(m => {
    const a = rowMap.get(m.teamAId);
    const b = rowMap.get(m.teamBId);
    if (!a || !b) return;

    const sA = m.scoreA ?? 0;
    const sB = m.scoreB ?? 0;

    a.P++; a.GF += sA; a.GA += sB;
    b.P++; b.GF += sB; b.GA += sA;

    if (sA > sB) {
      a.W++; a.Pts += 3; a.form.push('W');
      b.L++; b.form.push('L');
    } else if (sB > sA) {
      b.W++; b.Pts += 3; b.form.push('W');
      a.L++; a.form.push('L');
    } else {
      a.D++; a.Pts += 1; a.form.push('D');
      b.D++; b.Pts += 1; b.form.push('D');
    }
  });

  rows.forEach(r => {
    r.GD = r.GF - r.GA;
    r.form = r.form.slice(-5);
  });

  rows.sort((a, b) => {
    if (b.Pts !== a.Pts) return b.Pts - a.Pts;

    if (tiebreakerMode === 'H2H_GD_GF') {
      const h2h = compareHeadToHead(a.id, b.id, leagueCompleted);
      if (h2h !== 0) return h2h;
      if (b.GD !== a.GD) return b.GD - a.GD;
      if (b.GF !== a.GF) return b.GF - a.GF;
    } else if (tiebreakerMode === 'GF_GD_H2H') {
      if (b.GF !== a.GF) return b.GF - a.GF;
      if (b.GD !== a.GD) return b.GD - a.GD;
      const h2h = compareHeadToHead(a.id, b.id, leagueCompleted);
      if (h2h !== 0) return h2h;
    } else {
      // Default: GD_GF_H2H
      if (b.GD !== a.GD) return b.GD - a.GD;
      if (b.GF !== a.GF) return b.GF - a.GF;
      const h2h = compareHeadToHead(a.id, b.id, leagueCompleted);
      if (h2h !== 0) return h2h;
    }

    return a.name.localeCompare(b.name);
  });

  return rows;
}

/**
 * Returns seeded teams using the unified league standings table.
 */
export function seedKnockoutTeams(teams = [], matches = [], tiebreakerMode = 'GD_GF_H2H') {
  const table = computeLeagueTable(teams, matches, tiebreakerMode);
  const teamMap = new Map(teams.map(t => [t.id, t]));
  return table.map(row => teamMap.get(row.id)).filter(Boolean);
}

/**
 * Determines knockout match winner accounting for regulation score and penalty shootouts.
 */
export function getMatchWinnerId(match) {
  if (!match || match.status !== 'COMPLETED') return null;
  const sA = Number(match.scoreA ?? 0);
  const sB = Number(match.scoreB ?? 0);
  if (sA > sB) return match.teamAId;
  if (sB > sA) return match.teamBId;

  const pA = match.penaltiesA !== undefined && match.penaltiesA !== null ? Number(match.penaltiesA) : null;
  const pB = match.penaltiesB !== undefined && match.penaltiesB !== null ? Number(match.penaltiesB) : null;
  if (pA !== null && pB !== null && pA !== pB) {
    return pA > pB ? match.teamAId : match.teamBId;
  }
  return null;
}
