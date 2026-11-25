export const SITE_ORIGIN = 'https://mini-tournament-45ac1.web.app';
export const SITE_NAME = 'ArenaPro';
export const DEFAULT_TITLE = 'ArenaPro — Free Tournament, Club, Draft & Standings Platform';
export const DEFAULT_DESCRIPTION =
  'ArenaPro is a free all-in-one sports tournament and club management platform. Run player registration, waitlists, live auction drafts, round-robin fixtures, knockout brackets, tiebreakers, club rosters, and player career stats.';
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/screenshots/01-homepage.png`;

export const KNOWN_PLATFORM_TABS = ['home', 'tournaments', 'clubs', 'players', 'blog'];

export const PLATFORM_FAQS = [
  {
    q: 'What is ArenaPro and what sports does it support?',
    a: 'ArenaPro is a free web-based tournament, club, and matchday management platform built for football, 5-a-side/7-a-side turf leagues, cricket, esports, and local campus cups. It combines registration, live auction or wheel drafts, automated fixtures, standings with tiebreakers, knockout brackets, persistent clubs, and player career passports.',
  },
  {
    q: 'Is ArenaPro free for organizers, captains, and players?',
    a: 'Yes. Organizers can create unlimited tournaments, share 6-character join codes, run multi-device live player auctions, publish schedules, and track career stats for free without downloading an app.',
  },
  {
    q: 'How do live synced auction drafts and spin-the-wheel drafts work?',
    a: 'Captains sign in on their own devices using Google or a Captain PIN and bid live while the organizer controls nominations. ArenaPro automatically enforces squad budget guardrails and minimum reserve protection, or organizers can run an animated Spin-the-Wheel draft for balanced social leagues.',
  },
  {
    q: 'How do players join a tournament and claim existing stats?',
    a: 'Players enter a 6-character Join Code or click a direct invite URL to self-register into an available slot or automatic waitlist. Returning players who already appear in a legacy tournament can sign in with Google and link their existing profile so past goals, assists, and ratings merge into one verified career passport.',
  },
  {
    q: 'How are league tiebreakers and head-to-head results calculated?',
    a: 'Organizers choose custom tiebreaker priority rules—such as Goal Difference, Head-to-Head record, Goals Scored, or Wins—and ArenaPro updates the league table and Head-to-Head matrix instantly as final scores and shootout results are logged.',
  },
];

/**
 * Returns the mount base pathname ending in '/' (e.g. '/' on Firebase Hosting,
 * '/minitournament/' on GitHub Pages subpaths).
 */
export function getAppBasePath() {
  if (typeof window === 'undefined') return '/';
  const path = window.location.pathname || '/';
  const ghMatch = path.match(/^(\/minitournament)(?:\/|$)/i);
  if (ghMatch) return `${ghMatch[1]}/`;
  return '/';
}

/**
 * Resolves a public relative asset like './screenshots/01-homepage.png' safely
 * regardless of whether the user is currently viewing '/', '/blog/<slug>/', or
 * GitHub Pages '/minitournament/blog/<slug>/'.
 */
export function resolvePublicAssetUrl(assetPath) {
  if (!assetPath) return '';
  if (/^https?:\/\//i.test(assetPath) || assetPath.startsWith('data:')) {
    return assetPath;
  }
  const clean = assetPath.replace(/^\.\//, '').replace(/^\//, '');
  return `${getAppBasePath()}${clean}`;
}

/**
 * Parses either clean path routes (/tournaments/, /clubs/, /players/, /blog/, /blog/<slug>/)
 * OR query routes (?page=blog&post=<slug>) into { tab, postSlug }.
 */
export function parsePlatformRoute(pathname = '', search = '') {
  try {
    const params = new URLSearchParams(search);
    const qPage = params.get('page');
    const qPost = params.get('post');
    if (qPage && KNOWN_PLATFORM_TABS.includes(qPage)) {
      return { tab: qPage, postSlug: qPost || null };
    }

    const base = pathname.replace(/^\/minitournament(?=\/|$)/i, '') || '/';
    const segs = base.split('/').filter(Boolean);
    if (segs.length > 0 && KNOWN_PLATFORM_TABS.includes(segs[0])) {
      return {
        tab: segs[0],
        postSlug: segs[0] === 'blog' && segs[1] ? decodeURIComponent(segs[1]) : qPost || null,
      };
    }
    if (qPost) {
      return { tab: 'blog', postSlug: qPost };
    }
  } catch {}
  return { tab: 'home', postSlug: null };
}

/**
 * Builds an internal SPA route href relative to the active mount base path.
 */
export function buildRoutePath(tab = 'home', postSlug = null) {
  const base = getAppBasePath();
  if (!tab || tab === 'home') return base;
  if (tab === 'blog' && postSlug) {
    return `${base}blog/${encodeURIComponent(postSlug)}/`;
  }
  return `${base}${tab}/`;
}

/**
 * Builds the canonical URL on the primary production domain for SEO/GEO metadata.
 */
export function buildCanonicalUrl(routePath = '/') {
  if (/^https?:\/\//i.test(routePath)) return routePath;
  const clean = routePath.startsWith('/') ? routePath : `/${routePath}`;
  return `${SITE_ORIGIN}${clean}`;
}

function upsertMetaTag(attrName, attrValue, content) {
  if (typeof document === 'undefined' || !content) return;
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonicalLink(href) {
  if (typeof document === 'undefined' || !href) return;
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

/**
 * Applies full SEO / GEO / AEO head tags + Schema.org @graph JSON-LD for the active route.
 */
export function applyPageSeo({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  canonicalPath = '/',
  keywords = '',
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  jsonLdGraph = null,
} = {}) {
  if (typeof document === 'undefined') return;

  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = buildCanonicalUrl(canonicalPath);
  const absImage = ogImage && /^https?:\/\//i.test(ogImage)
    ? ogImage
    : `${SITE_ORIGIN}/${(ogImage || 'screenshots/01-homepage.png').replace(/^\.\//, '').replace(/^\//, '')}`;

  document.title = fullTitle;
  upsertCanonicalLink(canonicalUrl);
  upsertMetaTag('name', 'description', description);
  if (keywords) upsertMetaTag('name', 'keywords', keywords);

  upsertMetaTag('property', 'og:type', ogType);
  upsertMetaTag('property', 'og:title', fullTitle);
  upsertMetaTag('property', 'og:description', description);
  upsertMetaTag('property', 'og:url', canonicalUrl);
  upsertMetaTag('property', 'og:image', absImage);

  upsertMetaTag('name', 'twitter:title', fullTitle);
  upsertMetaTag('name', 'twitter:description', description);
  upsertMetaTag('name', 'twitter:image', absImage);

  document.head.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove());

  if (Array.isArray(jsonLdGraph) && jsonLdGraph.length > 0) {
    const script = document.createElement('script');
    script.id = 'dynamic-jsonld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': jsonLdGraph,
    });
    document.head.appendChild(script);
  }
}
