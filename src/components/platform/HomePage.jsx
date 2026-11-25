import React, { useState, useEffect } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { useAuth } from '../../context/AuthContext';
import {
  applyPageSeo,
  buildRoutePath,
  resolvePublicAssetUrl,
  PLATFORM_FAQS,
  SITE_ORIGIN,
} from '../../utils/seo';
import {
  Trophy, Users, Shield, ArrowRight, Sparkles, Dices, Calendar,
  Newspaper, Search, Play, CheckCircle2, Globe, Award, Flame, ChevronRight, HelpCircle
} from 'lucide-react';

export default function HomePage({
  onNavigate,
  clubs = [],
  posts = [],
  stories = [],
  playersCount = 0,
  onOpenStory,
  onOpenPost,
}) {
  const { global, discoverTournaments, myTournaments, joinedTournaments, selectTournament, openTournamentByIdOrUrl } = useGlobal();
  const { user, signInGoogle } = useAuth();
  const [quickJoin, setQuickJoin] = useState('');
  const [joinErr, setJoinErr] = useState('');
  const [openFaq, setOpenFaq] = useState(0);

  const featuredTournaments = [...myTournaments, ...joinedTournaments, ...discoverTournaments].slice(0, 6);
  const latestPosts = posts.slice(0, 3);
  const featuredClubs = clubs.slice(0, 4);

  useEffect(() => {
    applyPageSeo({
      title: 'ArenaPro — Free Tournament, Club, Draft & Standings Platform',
      description:
        'ArenaPro is a free all-in-one sports tournament and club management platform. Run player registration, waitlists, live auction drafts, round-robin fixtures, knockout brackets, tiebreakers, club rosters, and player career stats.',
      canonicalPath: '/',
      jsonLdGraph: [
        {
          '@type': 'Organization',
          '@id': `${SITE_ORIGIN}/#organization`,
          name: 'ArenaPro',
          url: `${SITE_ORIGIN}/`,
          logo: `${SITE_ORIGIN}/screenshots/01-homepage.png`,
        },
        {
          '@type': 'WebSite',
          '@id': `${SITE_ORIGIN}/#website`,
          name: 'ArenaPro Tournament & Club OS',
          url: `${SITE_ORIGIN}/`,
          publisher: { '@id': `${SITE_ORIGIN}/#organization` },
          potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE_ORIGIN}/?page=blog&q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
        {
          '@type': 'SoftwareApplication',
          '@id': `${SITE_ORIGIN}/#app`,
          name: 'ArenaPro',
          applicationCategory: 'SportsApplication',
          operatingSystem: 'Web',
          url: `${SITE_ORIGIN}/`,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        },
        {
          '@type': 'FAQPage',
          mainEntity: PLATFORM_FAQS.map(f => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
      ],
    });
  }, []);

  async function handleQuickOpen(e) {
    e.preventDefault();
    setJoinErr('');
    const res = await openTournamentByIdOrUrl(quickJoin);
    if (!res.ok) setJoinErr(res.error || 'Could not find tournament.');
    else setQuickJoin('');
  }

  return (
    <div className="space-y-12 pb-8">
      {/* ── Hero Section ── */}
      <section className="pro-card rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/15 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              All-in-One Tournament, Club &amp; Matchday OS
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-[1.12]">
              Run Pro Leagues, Drafts &amp; Clubs{' '}
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-400 bg-clip-text text-transparent">
                From Kickoff to Trophy
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              ArenaPro gives organizers, clubs, captains, and players everything needed to run real competitions: self-registration with waitlists, live multi-device player auctions, smart fixture schedules, matchday lineups, persistent club profiles, career stats, and matchday stories.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('tournaments')}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-950/50 transition-all"
              >
                <Trophy className="w-4 h-4" />
                Host or Browse Tournaments
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('clubs')}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#050814]/80 hover:bg-[#0b132b] border border-amber-500/35 text-amber-200 font-semibold text-sm transition-colors"
              >
                <Shield className="w-4 h-4 text-cyan-400" />
                Explore Clubs
              </button>

              {!user && (
                <button
                  type="button"
                  onClick={() => signInGoogle().catch(() => {})}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-200 font-semibold text-sm transition-colors"
                >
                  Sign in with Google
                </button>
              )}
            </div>

            {/* Quick Join Bar */}
            <form onSubmit={handleQuickOpen} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-lg">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={quickJoin}
                  onChange={e => { setQuickJoin(e.target.value); setJoinErr(''); }}
                  placeholder="Enter 6-char Join Code (e.g. ABC123) or paste link..."
                  className="w-full bg-[#050814]/90 border border-amber-900/50 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <button
                type="submit"
                disabled={!quickJoin.trim()}
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-mono uppercase tracking-wider font-bold shrink-0"
              >
                Join Arena
              </button>
            </form>
            {joinErr && <p className="text-xs text-red-400">{joinErr}</p>}
          </div>

          {/* Right: Live Platform Pulse */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            {[
              { label: 'Active Tournaments', value: global.tournaments.length, icon: Trophy, color: 'text-amber-300', bg: 'from-amber-500/15 to-transparent', tab: 'tournaments' },
              { label: 'Registered Clubs',   value: clubs.length,              icon: Shield, color: 'text-cyan-300',  bg: 'from-cyan-500/15 to-transparent',  tab: 'clubs' },
              { label: 'Player Passports',   value: playersCount,              icon: Users,  color: 'text-emerald-300', bg: 'from-emerald-500/15 to-transparent', tab: 'players' },
              { label: 'Stories & Reports',  value: posts.length + stories.length, icon: Newspaper, color: 'text-purple-300', bg: 'from-purple-500/15 to-transparent', tab: 'blog' },
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <button
                  key={stat.label}
                  type="button"
                  onClick={() => onNavigate(stat.tab)}
                  className={`pro-glass rounded-2xl p-4 text-left bg-gradient-to-br ${stat.bg} hover:border-amber-400/40 transition-all group`}
                >
                  <Icon className={`w-5 h-5 ${stat.color} mb-2 group-hover:scale-110 transition-transform`} />
                  <div className={`text-2xl sm:text-3xl font-mono font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-slate-300 mt-0.5 flex items-center justify-between">
                    <span>{stat.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Matchday Stories Strip ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" /> Matchday Stories
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('blog')}
            className="text-xs font-mono uppercase tracking-wider text-amber-300 hover:text-amber-200 flex items-center gap-1"
          >
            View All &amp; Post <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stories.length === 0 ? (
          <div className="pro-glass rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs sm:text-sm text-slate-300">
              No matchday stories posted yet. Share draft steals, winning goals, and trophy moments!
            </p>
            <button
              type="button"
              onClick={() => onNavigate('blog')}
              className="px-3.5 py-2 rounded-xl bg-amber-600/25 hover:bg-amber-600/40 border border-amber-500/40 text-amber-200 text-xs font-semibold"
            >
              Post First Story
            </button>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {stories.slice(0, 12).map(story => (
              <button
                key={story.id}
                type="button"
                onClick={() => onOpenStory && onOpenStory(story)}
                className="w-32 shrink-0 group text-left"
              >
                <div className="w-32 h-44 rounded-2xl p-0.5 bg-gradient-to-tr from-amber-500 via-pink-500 to-cyan-400 shadow-lg group-hover:scale-[1.03] transition-transform">
                  <div className="w-full h-full rounded-[14px] overflow-hidden bg-[#050814] relative flex flex-col justify-end p-2.5">
                    {story.imageUrl ? (
                      <img src={resolvePublicAssetUrl(story.imageUrl)} alt={story.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-[#0b132b] to-emerald-950" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    <span className="relative z-10 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/30 w-fit mb-1">
                      {story.tag || 'Highlight'}
                    </span>
                    <p className="relative z-10 text-xs font-bold text-white line-clamp-2 leading-tight">{story.title}</p>
                    <p className="relative z-10 text-[10px] text-slate-300 truncate mt-0.5">{story.authorName}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Featured Tournaments ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" /> Live &amp; Open Tournaments
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Follow live standings, register as a player, or enter your team</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('tournaments')}
            className="text-xs font-mono uppercase tracking-wider text-amber-300 hover:text-amber-200 flex items-center gap-1"
          >
            All Tournaments <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredTournaments.map(t => (
            <div key={t.id} className="pro-card rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-amber-400/45 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {t.format || 'HYBRID'}
                  </span>
                  {t.ownerName && (
                    <span className="text-[11px] text-slate-400 truncate">Host: {t.ownerName}</span>
                  )}
                </div>
                <h3 className="font-bold text-lg text-white line-clamp-1">{t.name}</h3>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-cyan-400" /> {t.playerCount ?? 0} players</span>
                  <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-amber-400" /> {t.teamCount ?? 0} teams</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => selectTournament(t.id)}
                className="w-full py-2.5 rounded-xl bg-[#050814] hover:bg-amber-500 text-amber-200 hover:text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 border border-amber-500/30 transition-colors"
              >
                <Play className="w-3.5 h-3.5" /> Open Tournament Center
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── A-to-Z Platform Capabilities (Promotable Showcase) ── */}
      <section className="space-y-4">
        <div className="text-center max-w-2xl mx-auto space-y-1.5">
          <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400">Complete A–Z Competition Suite</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Built for Organizers, Clubs &amp; Serious Players</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Everything required to launch, promote, and run local leagues, turf cups, or campus championships.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: CheckCircle2, title: 'Smart Onboarding & Waitlists', desc: 'Join codes, invite links, capacity caps, automatic waitlist promotion, and duplicate profile merging.' },
            { icon: Dices,        title: 'Live Synced Auction & Wheel',  desc: 'Captains bid live from their phones with budget guardrails and automatic reserve protection.' },
            { icon: Calendar,     title: 'Fixtures, RSVP & Lineups',     desc: 'Auto round-robin & knockout brackets with penalty shootouts, player RSVP, and starter builders.' },
            { icon: Shield,       title: 'Persistent Club Profiles',     desc: 'Create permanent clubs with rosters, recruitment requests, crests, and cross-season honors.' },
            { icon: Award,        title: 'Player Career Passports',      desc: 'Unified career stats across tournaments plus 5-axis SVG tactical radar player comparisons.' },
            { icon: Newspaper,    title: 'Stories, News & Fan Polls',    desc: 'Publish matchday stories, editorial match reports, and live pre-match fan prediction votes.' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="pro-glass rounded-2xl p-5 space-y-2 hover:border-emerald-500/35 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-sm">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Featured Clubs & Latest Blog Reports ── */}
      <section className="grid lg:grid-cols-2 gap-6">
        {/* Clubs Preview */}
        <div className="pro-glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" /> Active Clubs
            </h3>
            <button type="button" onClick={() => onNavigate('clubs')} className="text-xs text-cyan-300 hover:underline">
              Browse Clubs →
            </button>
          </div>
          {featuredClubs.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No clubs created yet. Register your turf or community club to recruit players!
            </p>
          ) : (
            <div className="space-y-2.5">
              {featuredClubs.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onNavigate('clubs')}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-[#050814]/70 border border-slate-800 hover:border-cyan-500/40 text-left transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {c.logoUrl ? (
                      <img src={c.logoUrl} alt={c.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-[#0b132b] border border-amber-500/30 flex items-center justify-center font-bold text-amber-300 shrink-0">
                        {c.shortTag || c.name?.[0] || 'C'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-white truncate">{c.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{c.city || 'Community Club'} • {(c.members || []).length} members</p>
                    </div>
                  </div>
                  {c.isRecruiting && (
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                      Recruiting
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Latest Blog Preview */}
        <div className="pro-glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-amber-400" /> Latest News &amp; Match Reports
            </h3>
            <a
              href={buildRoutePath('blog')}
              onClick={e => { e.preventDefault(); onNavigate('blog'); }}
              className="text-xs text-amber-300 hover:underline"
            >
              Read Blog →
            </a>
          </div>
          {latestPosts.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No articles published yet. Share tournament previews, draft recaps, and match reports!
            </p>
          ) : (
            <div className="space-y-2.5">
              {latestPosts.map(p => (
                <a
                  key={p.id}
                  href={buildRoutePath('blog', p.slug || p.id)}
                  onClick={e => { e.preventDefault(); onOpenPost && onOpenPost(p); }}
                  className="block w-full p-3 rounded-xl bg-[#050814]/70 border border-slate-800 hover:border-amber-500/40 text-left transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-amber-300 uppercase">
                    <span>{p.category || 'Match Report'}</span>
                    <span className="text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="font-semibold text-sm text-white line-clamp-1">{p.title}</p>
                  <p className="text-xs text-slate-400 line-clamp-1">{p.summary || p.body}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── AEO Platform FAQs (Paired with Homepage FAQPage JSON-LD) ── */}
      <section className="pro-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-cyan-400" /> Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct answers on ArenaPro registration, auction drafts, tiebreakers, and pricing.
            </p>
          </div>
          <a
            href={buildRoutePath('blog', 'how-to-use-arenapro-complete-guide-with-screenshots')}
            onClick={e => {
              e.preventDefault();
              const guide = posts.find(p => p.slug === 'how-to-use-arenapro-complete-guide-with-screenshots');
              if (guide && onOpenPost) onOpenPost(guide);
              else onNavigate('blog');
            }}
            className="text-xs font-mono uppercase tracking-wider text-emerald-300 hover:underline"
          >
            Read Full A–Z Guide →
          </a>
        </div>

        <div className="space-y-2">
          {PLATFORM_FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="rounded-xl bg-[#050814]/80 border border-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                  aria-expanded={isOpen}
                  className="w-full text-left px-4 py-3 text-xs sm:text-sm font-semibold text-amber-100 flex items-center justify-between gap-3"
                >
                  <span>{faq.q}</span>
                  <span className="text-amber-400 font-mono shrink-0">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <p className="px-4 pb-3.5 pt-2 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/70">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
