import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGlobal } from '../../context/GlobalContext';
import {
  isFirebaseConfigured,
  subscribeClubs,
  subscribePosts,
  subscribeStories,
  fetchAllUsersPublic,
  fetchPublicTournamentsFull,
} from '../../services/firebase';
import HomePage from './HomePage';
import ClubsPage from './ClubsPage';
import PlayersDirectoryPage from './PlayersDirectoryPage';
import StoriesAndBlogPage from './StoriesAndBlogPage';
import TournamentManager from '../TournamentManager';
import { OFFICIAL_POSTS, OFFICIAL_STORIES } from '../../data/editorialContent';
import {
  parsePlatformRoute,
  buildRoutePath,
  resolvePublicAssetUrl,
} from '../../utils/seo';
import {
  Trophy, Home, Shield, Users, Newspaper, LogIn, LogOut,
  Bell, X, Menu
} from 'lucide-react';

const PLATFORM_TABS = [
  { id: 'home',        label: 'Home',           icon: Home },
  { id: 'tournaments', label: 'Tournaments',    icon: Trophy },
  { id: 'clubs',       label: 'Clubs',          icon: Shield },
  { id: 'players',     label: 'Players',        icon: Users },
  { id: 'blog',        label: 'Stories & Blog', icon: Newspaper },
];

export default function PlatformShell() {
  const { user, signInGoogle, signOutUser, authLoading } = useAuth();
  const { global, myTournaments, joinedTournaments, selectTournament } = useGlobal();

  const [tab, setTab] = useState(() => {
    if (typeof window === 'undefined') return 'home';
    return parsePlatformRoute(window.location.pathname, window.location.search).tab;
  });

  const [mobileMenu, setMobileMenu] = useState(false);
  const [showBell, setShowBell] = useState(false);

  const [clubs, setClubs] = useState([]);
  const [cloudPosts, setCloudPosts] = useState([]);
  const [cloudStories, setCloudStories] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [fullTournaments, setFullTournaments] = useState([]);

  const posts = useMemo(() => {
    const map = new Map();
    OFFICIAL_POSTS.forEach(p => map.set(p.id, p));
    cloudPosts.forEach(p => map.set(p.id, p));
    return Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [cloudPosts]);

  const stories = useMemo(() => {
    const map = new Map();
    OFFICIAL_STORIES.forEach(s => map.set(s.id, s));
    cloudStories.forEach(s => map.set(s.id, s));
    return Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [cloudStories]);

  const [initialStory, setInitialStory] = useState(null);
  const [initialPost, setInitialPost] = useState(() => {
    if (typeof window === 'undefined') return null;
    const { postSlug } = parsePlatformRoute(window.location.pathname, window.location.search);
    if (postSlug) return OFFICIAL_POSTS.find(p => p.slug === postSlug || p.id === postSlug) || null;
    return null;
  });

  const navigateTab = React.useCallback((nextTab, postSlug = null) => {
    const validTab = PLATFORM_TABS.some(t => t.id === nextTab) ? nextTab : 'home';
    setTab(validTab);
    if (validTab !== 'blog' || !postSlug) {
      if (validTab !== 'blog') {
        setInitialPost(null);
        setInitialStory(null);
      }
    }
    if (typeof window !== 'undefined') {
      const nextUrl = buildRoutePath(validTab, postSlug);
      if (window.location.pathname + window.location.search !== nextUrl) {
        window.history.pushState({ tab: validTab, postSlug }, '', nextUrl);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPopState = () => {
      const parsed = parsePlatformRoute(window.location.pathname, window.location.search);
      setTab(parsed.tab);
      if (parsed.postSlug) {
        const found = posts.find(p => p.slug === parsed.postSlug || p.id === parsed.postSlug) || null;
        setInitialPost(found);
      } else {
        setInitialPost(null);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [posts]);

  const hasCloud = isFirebaseConfigured();

  useEffect(() => {
    if (!hasCloud) return;
    const u1 = subscribeClubs(setClubs);
    const u2 = subscribePosts(setCloudPosts);
    const u3 = subscribeStories(setCloudStories);
    return () => {
      u1(); u2(); u3();
    };
  }, [hasCloud]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { postSlug } = parsePlatformRoute(window.location.pathname, window.location.search);
    if (postSlug && !initialPost) {
      const found = posts.find(p => p.slug === postSlug || p.id === postSlug);
      if (found) setInitialPost(found);
    }
  }, [posts, initialPost]);

  const loadDirectoryData = React.useCallback(async () => {
    if (!hasCloud) return;
    const extraIds = global.tournaments.map(t => t.id);
    const [uList, tList] = await Promise.all([
      fetchAllUsersPublic(),
      fetchPublicTournamentsFull(extraIds),
    ]);
    setUsersList(uList);
    setFullTournaments(tList);
  }, [hasCloud, global.tournaments]);

  useEffect(() => {
    loadDirectoryData();
  }, [loadDirectoryData]);

  // Aggregate cross-tournament career stats per player (keyed by uid if linked, else name)
  const careerPlayers = useMemo(() => {
    const map = new Map();

    // Seed from users collection (verified Passports)
    usersList.forEach(u => {
      if (!u?.uid) return;
      map.set(`uid:${u.uid}`, {
        key: `uid:${u.uid}`,
        uid: u.uid,
        name: u.name || u.displayName || 'Player',
        avatar: u.avatar || u.photoURL || '',
        position: u.position || 'FLEX',
        preferredFoot: u.preferredFoot || '',
        city: u.city || '',
        bio: u.bio || '',
        tournaments: [],
        tournamentsCount: 0,
        stats: { matches: 0, goals: 0, assists: 0, cleanSheets: 0, saves: 0, mvpCount: 0, avgRating: 0 },
        _ratings: [],
      });
    });

    // Merge stats across all tournaments
    fullTournaments.forEach(t => {
      const tName = t.organizer?.name || t.name || t.id;
      (t.players || []).forEach(p => {
        const key = p.uid ? `uid:${p.uid}` : `name:${(p.name || '').trim().toLowerCase()}`;
        if (!key || key === 'name:') return;

        const cur = map.get(key) || {
          key,
          uid: p.uid || null,
          name: p.name || 'Player',
          avatar: p.avatar || '',
          position: p.position || 'FLEX',
          preferredFoot: '',
          city: '',
          bio: p.bio || '',
          tournaments: [],
          tournamentsCount: 0,
          stats: { matches: 0, goals: 0, assists: 0, cleanSheets: 0, saves: 0, mvpCount: 0, avgRating: 0 },
          _ratings: [],
        };

        if (!cur.avatar && p.avatar) cur.avatar = p.avatar;
        if (cur.position === 'FLEX' && p.position && p.position !== 'FLEX') cur.position = p.position;
        if (!cur.tournaments.includes(tName)) {
          cur.tournaments.push(tName);
          cur.tournamentsCount = cur.tournaments.length;
        }

        const ps = p.stats || {};
        cur.stats.matches += Number(ps.matches) || 0;
        cur.stats.goals += Number(ps.goals) || 0;
        cur.stats.assists += Number(ps.assists) || 0;
        cur.stats.cleanSheets += Number(ps.cleanSheets) || 0;
        cur.stats.saves += Number(ps.saves) || 0;
        cur.stats.mvpCount += Number(ps.mvpCount) || 0;
        if (Number(ps.avgRating) > 0) cur._ratings.push(Number(ps.avgRating));

        cur.stats.avgRating = cur._ratings.length > 0
          ? cur._ratings.reduce((a, b) => a + b, 0) / cur._ratings.length
          : 0;

        map.set(key, cur);
      });
    });

    return Array.from(map.values());
  }, [usersList, fullTournaments]);

  // Actionable in-app notifications
  const notifications = useMemo(() => {
    const items = [];
    if (user && myTournaments.length > 0) {
      items.push({
        id: 'hosting',
        title: `You are managing ${myTournaments.length} tournament${myTournaments.length !== 1 ? 's' : ''}`,
        action: () => { setShowBell(false); setTab('tournaments'); },
      });
    }
    if (user && joinedTournaments.length > 0) {
      items.push({
        id: 'joined',
        title: `You are linked as a player/captain in ${joinedTournaments.length} tournament${joinedTournaments.length !== 1 ? 's' : ''}`,
        action: () => { setShowBell(false); selectTournament(joinedTournaments[0].id); },
      });
    }
    if (stories.length > 0) {
      items.push({
        id: 'story_latest',
        title: `New story: "${stories[0].title}" by ${stories[0].authorName}`,
        action: () => { setShowBell(false); setInitialStory(stories[0]); setTab('blog'); },
      });
    }
    return items;
  }, [user, myTournaments, joinedTournaments, stories, selectTournament]);

  function openStoryFromHome(story) {
    setInitialStory(story);
    navigateTab('blog');
  }

  function openPostFromHome(post) {
    setInitialPost(post);
    navigateTab('blog', post?.slug || post?.id || null);
  }

  return (
    <div className="min-h-screen bg-[#050814] text-amber-50 flex flex-col relative overflow-x-hidden">
      <div className="canvas-noise" />
      <div className="fixed inset-0 bg-gradient-to-br from-[#050814] via-[#0b132b] to-[#111936] z-0 pointer-events-none" />

      {/* Top Platform Header */}
      <header className="sticky top-0 z-50 bg-[#050814]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <a
            href={buildRoutePath('home')}
            onClick={e => { e.preventDefault(); navigateTab('home'); }}
            className="flex items-center gap-2.5 shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="font-bold text-white text-lg tracking-tight block leading-none">ArenaPro</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">Tournament OS</span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-1">
            {PLATFORM_TABS.map(t => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              return (
                <a
                  key={t.id}
                  href={buildRoutePath(t.id)}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={e => { e.preventDefault(); navigateTab(t.id); }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-[#0b132b]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBell(v => !v)}
                className="p-2 rounded-xl bg-[#0b132b] border border-slate-800 text-slate-300 hover:text-white relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1.5 right-1.5" />
                )}
              </button>
              {showBell && (
                <div className="absolute right-0 mt-2 w-72 pro-card bg-[#0b132b] rounded-2xl p-3 shadow-2xl z-50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono uppercase text-amber-300 pb-1 border-b border-slate-800">
                    <span>Updates</span>
                    <button onClick={() => setShowBell(false)}><X className="w-3.5 h-3.5" /></button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">You&apos;re all caught up.</p>
                  ) : (
                    notifications.map(n => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={n.action}
                        className="w-full text-left p-2.5 rounded-xl bg-[#050814]/80 hover:bg-[#050814] border border-slate-800 text-xs text-slate-200 transition-colors"
                      >
                        {n.title}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {hasCloud && (
              user ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTab('players')}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#0b132b] border border-slate-800 hover:border-amber-500/40 text-xs text-white"
                  >
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                        {(user.displayName || 'U')[0]}
                      </div>
                    )}
                    <span className="hidden sm:inline max-w-[110px] truncate">{user.displayName}</span>
                  </button>
                  <button
                    type="button"
                    onClick={signOutUser}
                    className="p-2 rounded-xl bg-[#0b132b] border border-slate-800 text-slate-400 hover:text-red-300"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={authLoading}
                  onClick={() => signInGoogle().catch(() => {})}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign in with Google</span>
                  <span className="sm:hidden">Sign In</span>
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => setMobileMenu(v => !v)}
              className="md:hidden p-2 rounded-xl bg-[#0b132b] border border-slate-800 text-slate-300"
            >
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenu && (
          <nav aria-label="Mobile Navigation" className="md:hidden border-t border-slate-800 bg-[#050814]/95 px-4 py-3 space-y-1">
            {PLATFORM_TABS.map(t => {
              const Icon = t.icon;
              return (
                <a
                  key={t.id}
                  href={buildRoutePath(t.id)}
                  aria-current={tab === t.id ? 'page' : undefined}
                  onClick={e => { e.preventDefault(); navigateTab(t.id); setMobileMenu(false); }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                    tab === t.id ? 'bg-amber-500/15 text-amber-300' : 'text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                </a>
              );
            })}
          </nav>
        )}
      </header>

      {/* Page Body */}
      <main className="relative z-20 flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pt-6 pb-16">
        {tab === 'home' && (
          <HomePage
            onNavigate={navigateTab}
            clubs={clubs}
            posts={posts}
            stories={stories}
            playersCount={careerPlayers.length}
            onOpenStory={openStoryFromHome}
            onOpenPost={openPostFromHome}
          />
        )}
        {tab === 'tournaments' && <TournamentManager embedded />}
        {tab === 'clubs' && <ClubsPage clubs={clubs} />}
        {tab === 'players' && (
          <PlayersDirectoryPage
            careerPlayers={careerPlayers}
            onRefresh={loadDirectoryData}
          />
        )}
        {tab === 'blog' && (
          <StoriesAndBlogPage
            posts={posts}
            stories={stories}
            initialStory={initialStory}
            initialPost={initialPost}
            onPostRouteChange={slug => navigateTab('blog', slug)}
            onClearInitial={() => {
              setInitialStory(null);
              setInitialPost(null);
              navigateTab('blog', null);
            }}
          />
        )}
      </main>

      {/* Semantic SEO/GEO Footer */}
      <footer className="relative z-20 border-t border-slate-800/80 bg-[#050814]/90 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p className="font-mono uppercase tracking-widest text-[10px] text-slate-400">
            ArenaPro • Multi-Organizer Tournament, Club &amp; Matchday Platform
          </p>
          <nav aria-label="Footer Navigation" className="flex flex-wrap items-center justify-center gap-4">
            {PLATFORM_TABS.map(t => (
              <a
                key={t.id}
                href={buildRoutePath(t.id)}
                onClick={e => { e.preventDefault(); navigateTab(t.id); }}
                className="hover:text-amber-300 transition-colors"
              >
                {t.label}
              </a>
            ))}
            <a
              href={buildRoutePath('blog', 'how-to-use-arenapro-complete-guide-with-screenshots')}
              onClick={e => {
                e.preventDefault();
                const guide = posts.find(p => p.slug === 'how-to-use-arenapro-complete-guide-with-screenshots');
                if (guide) openPostFromHome(guide);
                else navigateTab('blog');
              }}
              className="hover:text-amber-300 transition-colors"
            >
              A–Z Guide
            </a>
            <a href={resolvePublicAssetUrl('sitemap.xml')} className="hover:text-emerald-300 transition-colors">Sitemap</a>
            <a href={resolvePublicAssetUrl('llms.txt')} className="hover:text-emerald-300 transition-colors">llms.txt</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
