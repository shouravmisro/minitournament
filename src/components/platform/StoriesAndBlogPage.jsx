import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGlobal } from '../../context/GlobalContext';
import ImageUploadButton from '../ImageUploadButton';
import {
  applyPageSeo,
  buildRoutePath,
  resolvePublicAssetUrl,
  SITE_ORIGIN,
} from '../../utils/seo';
import {
  createPostCloud,
  togglePostLikeCloud,
  deletePostCloud,
  createStoryCloud,
  deleteStoryCloud,
  isFirebaseConfigured,
} from '../../services/firebase';
import {
  Newspaper, Flame, Plus, Heart, Trash2, X, Search,
  Clock, BookOpen, LogIn, ExternalLink, ChevronLeft, ChevronRight,
  CheckCircle2, HelpCircle, Share2, Check, Sparkles
} from 'lucide-react';

const CATEGORIES = ['ALL', 'Guide', 'Match Report', 'Draft Recap', 'Club News', 'Announcement'];
const STORY_TAGS = ['Platform Tour', 'Features', 'Standings', 'Analytics', 'Player Stats', 'Squads', 'Goal Alert', 'Matchday'];

function StructuredArticleContent({ post }) {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="space-y-6">
      {/* AEO Quick Answer Box */}
      {post.quickAnswer && (
        <div className="rounded-2xl bg-emerald-950/35 border border-emerald-500/40 p-4 space-y-1.5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Quick Answer
          </p>
          <p className="text-sm text-emerald-50 leading-relaxed font-medium">
            {post.quickAnswer}
          </p>
        </div>
      )}

      {/* GEO Key Takeaways */}
      {Array.isArray(post.keyTakeaways) && post.keyTakeaways.length > 0 && (
        <div className="rounded-2xl bg-[#050814]/80 border border-amber-500/30 p-4 space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-300">
            Key Takeaways
          </p>
          <ul className="space-y-1.5">
            {post.keyTakeaways.map((item, idx) => (
              <li key={idx} className="text-xs sm:text-sm text-slate-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Structured Sections (Headings, Paragraphs, Tables, Screenshots) */}
      {Array.isArray(post.sections) && post.sections.length > 0 ? (
        <div className="space-y-6">
          {post.sections.map((sec, idx) => (
            <section key={idx} className="space-y-3">
              {sec.heading && (
                <h2 className="text-lg sm:text-xl font-bold text-amber-200 border-b border-slate-800 pb-1.5">
                  {sec.heading}
                </h2>
              )}
              {Array.isArray(sec.paragraphs) && sec.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-sm text-slate-200 leading-relaxed">
                  {p}
                </p>
              ))}
              {sec.table && (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#050814]/70">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-amber-300 font-mono uppercase text-[10px]">
                        {sec.table.headers.map((h, hi) => (
                          <th key={hi} className="p-2.5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {sec.table.rows.map((row, ri) => (
                        <tr key={ri}>
                          {row.map((cell, ci) => (
                            <td key={ci} className={`p-2.5 ${ci === 0 ? 'font-semibold text-white' : 'text-slate-300'}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {sec.screenshot && (
                <figure className="rounded-2xl overflow-hidden border border-amber-500/30 bg-[#050814] shadow-lg">
                  <img
                    src={resolvePublicAssetUrl(sec.screenshot.src)}
                    alt={sec.screenshot.alt || sec.heading}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                  {sec.screenshot.caption && (
                    <figcaption className="px-3.5 py-2 text-[11px] text-slate-400 border-t border-slate-800">
                      {sec.screenshot.caption}
                    </figcaption>
                  )}
                </figure>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
          {post.body}
        </div>
      )}

      {/* AEO FAQ Accordion (paired with Schema.org FAQPage JSON-LD) */}
      {Array.isArray(post.faqs) && post.faqs.length > 0 && (
        <div className="space-y-2.5 pt-4 border-t border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400" /> Frequently Asked Questions
          </h3>
          <div className="space-y-2">
            {post.faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="rounded-xl bg-[#050814]/80 border border-slate-800 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : i)}
                    className="w-full text-left px-4 py-3 text-xs sm:text-sm font-semibold text-amber-100 flex items-center justify-between gap-2"
                  >
                    <span>{faq.q}</span>
                    <span className="text-amber-400 font-mono">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <p className="px-4 pb-3 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/70 pt-2">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StoriesAndBlogPage({
  posts = [],
  stories = [],
  initialStory = null,
  initialPost = null,
  onPostRouteChange,
  onClearInitial,
}) {
  const { user, signInGoogle } = useAuth();
  const { global, selectTournament } = useGlobal();

  const [category, setCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [activePost, setActivePost] = useState(initialPost);
  const [activeStory, setActiveStory] = useState(initialStory);
  const [copiedLink, setCopiedLink] = useState(false);

  const [showWritePost, setShowWritePost] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);

  const [postForm, setPostForm] = useState({
    title: '',
    category: 'Match Report',
    coverUrl: '',
    summary: '',
    body: '',
    tournamentId: '',
  });
  const [storyForm, setStoryForm] = useState({
    title: '',
    caption: '',
    tag: 'Matchday',
    imageUrl: '',
    tournamentId: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    setActivePost(initialPost || null);
  }, [initialPost]);

  useEffect(() => {
    if (initialStory) setActiveStory(initialStory);
  }, [initialStory]);

  function openPost(post) {
    setActivePost(post);
    onPostRouteChange?.(post?.slug || post?.id || null);
  }

  function closePost() {
    setActivePost(null);
    onClearInitial?.();
  }

  // Dynamic SEO / GEO / AEO meta + Schema.org @graph (Blog / Article + BreadcrumbList + FAQPage)
  useEffect(() => {
    if (!activePost) {
      applyPageSeo({
        title: 'Stories & Sports Blog — Tournament Guides, Draft Playbooks & News',
        description:
          'Step-by-step ArenaPro platform guide with screenshots, auction vs. wheel draft strategy, tiebreaker rules, club management, and tournament checklists.',
        canonicalPath: '/blog/',
        jsonLdGraph: [
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
              { '@type': 'ListItem', position: 2, name: 'Stories & Blog', item: `${SITE_ORIGIN}/blog/` },
            ],
          },
          {
            '@type': 'Blog',
            name: 'ArenaPro Sports & Tournament Blog',
            url: `${SITE_ORIGIN}/blog/`,
            blogPost: posts.slice(0, 12).map(p => ({
              '@type': 'BlogPosting',
              headline: p.title,
              url: `${SITE_ORIGIN}/blog/${encodeURIComponent(p.slug || p.id)}/`,
              datePublished: new Date(p.createdAt || Date.now()).toISOString(),
            })),
          },
        ],
      });
      return;
    }

    const slug = activePost.slug || activePost.id;
    const articlePath = `/blog/${encodeURIComponent(slug)}/`;
    const articleUrl = `${SITE_ORIGIN}${articlePath}`;
    const graph = [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'Stories & Blog', item: `${SITE_ORIGIN}/blog/` },
          { '@type': 'ListItem', position: 3, name: activePost.title, item: articleUrl },
        ],
      },
      {
        '@type': 'Article',
        mainEntityOfPage: articleUrl,
        headline: activePost.title,
        description: activePost.metaDescription || activePost.summary || '',
        image: activePost.coverUrl
          ? `${SITE_ORIGIN}/${activePost.coverUrl.replace(/^\.\//, '').replace(/^\//, '')}`
          : `${SITE_ORIGIN}/screenshots/01-homepage.png`,
        author: { '@type': 'Organization', name: activePost.authorName || 'ArenaPro' },
        publisher: {
          '@type': 'Organization',
          name: 'ArenaPro',
          logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/screenshots/01-homepage.png` },
        },
        datePublished: new Date(activePost.createdAt || Date.now()).toISOString(),
        dateModified: new Date(activePost.updatedAt || activePost.createdAt || Date.now()).toISOString(),
        keywords: Array.isArray(activePost.keywords) ? activePost.keywords.join(', ') : '',
      },
    ];

    if (Array.isArray(activePost.faqs) && activePost.faqs.length > 0) {
      graph.push({
        '@type': 'FAQPage',
        mainEntity: activePost.faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      });
    }

    applyPageSeo({
      title: activePost.title,
      description: activePost.metaDescription || activePost.summary || '',
      canonicalPath: articlePath,
      keywords: Array.isArray(activePost.keywords) ? activePost.keywords.join(', ') : '',
      ogType: 'article',
      ogImage: activePost.coverUrl || './screenshots/01-homepage.png',
      jsonLdGraph: graph,
    });
  }, [activePost, posts]);

  const filteredPosts = posts.filter(p => {
    if (category !== 'ALL' && p.category !== category) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.title?.toLowerCase().includes(q) ||
        p.summary?.toLowerCase().includes(q) ||
        p.body?.toLowerCase().includes(q) ||
        p.authorName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  function copyPostUrl(post) {
    const slug = post.slug || post.id;
    const url = `${SITE_ORIGIN}/blog/${encodeURIComponent(slug)}/`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  async function handlePublishPost(e) {
    e.preventDefault();
    if (!user?.uid || !postForm.title.trim() || !postForm.body.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const words = postForm.body.trim().split(/\s+/).length;
      const readMins = Math.max(1, Math.ceil(words / 180));
      await createPostCloud({
        ...postForm,
        title: postForm.title.trim(),
        summary: postForm.summary.trim() || postForm.body.trim().slice(0, 140),
        body: postForm.body.trim(),
        readMins,
        authorUid: user.uid,
        authorName: user.displayName || 'Contributor',
        authorAvatar: user.photoURL || '',
      });
      setPostForm({ title: '', category: 'Match Report', coverUrl: '', summary: '', body: '', tournamentId: '' });
      setShowWritePost(false);
    } catch (error) {
      setErr(error?.message || 'Failed to publish article.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateStory(e) {
    e.preventDefault();
    if (!user?.uid || !storyForm.title.trim()) return;
    setBusy(true);
    setErr('');
    try {
      await createStoryCloud({
        ...storyForm,
        title: storyForm.title.trim(),
        caption: storyForm.caption.trim(),
        authorUid: user.uid,
        authorName: user.displayName || 'Player',
        authorAvatar: user.photoURL || '',
      });
      setStoryForm({ title: '', caption: '', tag: 'Matchday', imageUrl: '', tournamentId: '' });
      setShowCreateStory(false);
    } catch (error) {
      setErr(error?.message || 'Failed to post story.');
    } finally {
      setBusy(false);
    }
  }

  function stepStory(dir) {
    if (!activeStory || stories.length === 0) return;
    const idx = stories.findIndex(s => s.id === activeStory.id);
    if (idx === -1) return;
    const nextIdx = (idx + dir + stories.length) % stories.length;
    setActiveStory(stories[nextIdx]);
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="pro-card rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <Newspaper className="w-6 h-6 text-amber-400" /> Stories &amp; Sports Blog
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Platform guides, matchday highlights, draft strategies, and organizer playbooks.
          </p>
        </div>

        {isFirebaseConfigured() && (
          user ? (
            <div className="flex gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => { setErr(''); setShowCreateStory(true); }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-amber-500 hover:opacity-90 text-white text-xs font-bold shadow"
              >
                <Flame className="w-3.5 h-3.5" /> Post Story
              </button>
              <button
                type="button"
                onClick={() => { setErr(''); setShowWritePost(true); }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow"
              >
                <Plus className="w-3.5 h-3.5" /> Write Article
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => signInGoogle().catch(() => {})}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" /> Sign in to Publish
            </button>
          )
        )}
      </div>

      {/* ── Stories Strip ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-mono uppercase tracking-widest text-amber-300 flex items-center gap-2">
          <Flame className="w-4 h-4" /> Matchday &amp; Feature Stories ({stories.length})
        </h2>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {stories.map(story => (
            <button
              key={story.id}
              type="button"
              onClick={() => setActiveStory(story)}
              className="w-36 shrink-0 group text-left"
            >
              <div className="w-36 h-48 rounded-2xl p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-cyan-400 group-hover:scale-[1.02] transition-transform">
                <div className="w-full h-full rounded-[14px] overflow-hidden bg-[#050814] relative flex flex-col justify-end p-2.5">
                  {story.imageUrl ? (
                    <img src={resolvePublicAssetUrl(story.imageUrl)} alt={story.title} className="absolute inset-0 w-full h-full object-cover opacity-85" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0b132b] to-emerald-950" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent" />
                  <span className="relative z-10 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/30 w-fit mb-1">
                    {story.tag || 'Highlight'}
                  </span>
                  <p className="relative z-10 text-xs font-bold text-white line-clamp-2">{story.title}</p>
                  <p className="relative z-10 text-[10px] text-slate-300 truncate">{story.authorName}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Editorial Blog Feed ── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  category === cat
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-[#0b132b] text-slate-300 border border-slate-800 hover:border-amber-500/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full bg-[#050814] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="pro-glass rounded-2xl p-12 text-center space-y-2">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No articles found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPosts.map(post => {
              const isLiked = Boolean(user?.uid && post.likedByUids?.includes(user.uid));
              const postHref = buildRoutePath('blog', post.slug || post.id);
              return (
                <article key={post.id} className="pro-card rounded-2xl overflow-hidden flex flex-col justify-between hover:border-amber-400/45 transition-all">
                  <div>
                    {post.coverUrl && (
                      <a
                        href={postHref}
                        onClick={e => { e.preventDefault(); openPost(post); }}
                        className="block h-44 w-full bg-[#050814] overflow-hidden cursor-pointer"
                      >
                        <img src={resolvePublicAssetUrl(post.coverUrl)} alt={post.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      </a>
                    )}
                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase">
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {post.category || 'Match Report'}
                        </span>
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {post.readMins || 3} min read
                        </span>
                      </div>

                      <h3 className="font-bold text-lg text-white leading-snug">
                        <a
                          href={postHref}
                          onClick={e => { e.preventDefault(); openPost(post); }}
                          className="hover:text-amber-300 transition-colors"
                        >
                          {post.title}
                        </a>
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {post.summary || post.body}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {post.authorAvatar ? (
                        <img src={post.authorAvatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-amber-600/30 text-amber-200 text-[10px] font-bold flex items-center justify-center">
                          {(post.authorName || 'A')[0]}
                        </div>
                      )}
                      <span className="text-xs text-slate-300 truncate">{post.authorName}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!post.isOfficial && (
                        <button
                          type="button"
                          onClick={() => user?.uid && togglePostLikeCloud(post.id, user.uid, post.likedByUids)}
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors ${
                            isLiked
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-[#050814] text-slate-400 border-slate-800 hover:text-rose-300'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                          <span>{post.likesCount || 0}</span>
                        </button>
                      )}
                      <a
                        href={postHref}
                        onClick={e => { e.preventDefault(); openPost(post); }}
                        className="text-xs font-semibold text-amber-300 hover:text-amber-200 px-2 py-1"
                      >
                        Read →
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Article Reader Modal ── */}
      {activePost && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-3 sm:p-5"
          onClick={e => { if (e.target === e.currentTarget) closePost(); }}
        >
          <article className="pro-card bg-[#0b132b] rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {activePost.coverUrl && (
              <div className="h-52 sm:h-64 w-full bg-[#050814] shrink-0 relative">
                <img src={resolvePublicAssetUrl(activePost.coverUrl)} alt={activePost.title} className="w-full h-full object-cover" />
                <button
                  onClick={closePost}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {activePost.category}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyPostUrl(activePost)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg bg-[#050814] border border-slate-800 text-slate-200 hover:text-white"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{copiedLink ? 'Copied URL' : 'Share'}</span>
                  </button>
                  {!activePost.coverUrl && (
                    <button
                      onClick={closePost}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{activePost.title}</h1>

              <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400 border-b border-slate-800 pb-3">
                <span>By <strong className="text-slate-200">{activePost.authorName}</strong> • {new Date(activePost.createdAt).toLocaleDateString()} • {activePost.readMins || 3} min read</span>
                {activePost.tournamentId && (
                  <button
                    type="button"
                    onClick={() => { closePost(); selectTournament(activePost.tournamentId); }}
                    className="flex items-center gap-1 text-cyan-300 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open Linked Tournament
                  </button>
                )}
              </div>

              <StructuredArticleContent post={activePost} />

              {!activePost.isOfficial && user?.uid === activePost.authorUid && (
                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      await deletePostCloud(activePost.id);
                      closePost();
                    }}
                    className="flex items-center gap-1.5 text-xs text-red-300 hover:text-red-200 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Article
                  </button>
                </div>
              )}
            </div>
          </article>
        </div>
      )}

      {/* ── Story Lightbox Viewer ── */}
      {activeStory && (
        <div
          className="fixed inset-0 bg-black/92 backdrop-blur-md z-[210] flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) { setActiveStory(null); onClearInitial?.(); } }}
        >
          <div className="w-full max-w-md h-[80vh] max-h-[680px] rounded-3xl overflow-hidden bg-[#050814] border border-amber-500/40 relative flex flex-col justify-between shadow-2xl">
            {activeStory.imageUrl ? (
              <img src={resolvePublicAssetUrl(activeStory.imageUrl)} alt={activeStory.title} className="absolute inset-0 w-full h-full object-contain bg-[#050814]" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-[#0b132b] to-emerald-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/70" />

            <div className="relative z-10 p-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {activeStory.authorAvatar ? (
                  <img src={activeStory.authorAvatar} alt="" className="w-8 h-8 rounded-full object-cover border border-white/30" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                    {(activeStory.authorName || 'S')[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{activeStory.authorName}</p>
                  <p className="text-[10px] text-amber-300">{activeStory.tag}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {!activeStory.isOfficial && user?.uid === activeStory.authorUid && (
                  <button
                    type="button"
                    onClick={async () => { await deleteStoryCloud(activeStory.id); setActiveStory(null); }}
                    className="p-1.5 rounded-full bg-red-950/70 text-red-300 hover:text-white"
                    title="Delete Story"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setActiveStory(null); onClearInitial?.(); }}
                  className="p-1.5 rounded-full bg-black/60 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {stories.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => stepStory(-1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/80"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => stepStory(1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/80"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <div className="relative z-10 p-5 space-y-2">
              <h3 className="text-xl font-bold text-white">{activeStory.title}</h3>
              {activeStory.caption && (
                <p className="text-sm text-slate-200 leading-relaxed">{activeStory.caption}</p>
              )}
              {activeStory.tournamentId && (
                <button
                  type="button"
                  onClick={() => { setActiveStory(null); selectTournament(activeStory.tournamentId); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold mt-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Tournament
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Write Article Modal ── */}
      {showWritePost && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="pro-card bg-[#0b132b] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">Write Article / Match Report</h3>
              <button onClick={() => setShowWritePost(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handlePublishPost} className="p-5 overflow-y-auto space-y-3.5">
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400">Headline *</label>
                <input
                  value={postForm.title}
                  onChange={e => setPostForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Matchday 4 Thriller: Comeback Win in Penalty Shootout"
                  required
                  className="w-full mt-1 bg-[#050814] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono uppercase text-slate-400">Category</label>
                  <select
                    value={postForm.category}
                    onChange={e => setPostForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full mt-1 bg-[#050814] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    {CATEGORIES.filter(c => c !== 'ALL').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase text-slate-400">Linked Tournament</label>
                  <select
                    value={postForm.tournamentId}
                    onChange={e => setPostForm(f => ({ ...f, tournamentId: e.target.value }))}
                    className="w-full mt-1 bg-[#050814] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="">None (General)</option>
                    {global.tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ImageUploadButton
                  storagePath="blog/covers"
                  label="Upload Cover Image"
                  maxWidth={960}
                  maxHeight={540}
                  onUploaded={url => setPostForm(f => ({ ...f, coverUrl: url }))}
                />
                {postForm.coverUrl && <span className="text-xs text-emerald-400">Cover ready ✓</span>}
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400">Short Summary</label>
                <input
                  value={postForm.summary}
                  onChange={e => setPostForm(f => ({ ...f, summary: e.target.value }))}
                  placeholder="1-line teaser for the feed..."
                  className="w-full mt-1 bg-[#050814] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400">Full Story / Report *</label>
                <textarea
                  rows={6}
                  required
                  value={postForm.body}
                  onChange={e => setPostForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Write the match report, tactical breakdown, or announcement..."
                  className="w-full mt-1 bg-[#050814] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
              {err && <p className="text-xs text-red-400">{err}</p>}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowWritePost(false)} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs">Cancel</button>
                <button type="submit" disabled={busy} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs">
                  {busy ? 'Publishing…' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Post Story Modal ── */}
      {showCreateStory && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="pro-card bg-[#0b132b] rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white">Post Matchday Story</h3>
              <button onClick={() => setShowCreateStory(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateStory} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400">Story Title *</label>
                <input
                  value={storyForm.title}
                  onChange={e => setStoryForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Screamer from 30 yards!"
                  required
                  className="w-full mt-1 bg-[#050814] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono uppercase text-slate-400">Tag</label>
                  <select
                    value={storyForm.tag}
                    onChange={e => setStoryForm(f => ({ ...f, tag: e.target.value }))}
                    className="w-full mt-1 bg-[#050814] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    {STORY_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase text-slate-400">Tournament</label>
                  <select
                    value={storyForm.tournamentId}
                    onChange={e => setStoryForm(f => ({ ...f, tournamentId: e.target.value }))}
                    className="w-full mt-1 bg-[#050814] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="">General</option>
                    {global.tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ImageUploadButton
                  storagePath="stories"
                  label="Upload Highlight Photo"
                  maxWidth={720}
                  maxHeight={960}
                  onUploaded={url => setStoryForm(f => ({ ...f, imageUrl: url }))}
                />
                {storyForm.imageUrl && <span className="text-xs text-emerald-400">Photo ready ✓</span>}
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400">Caption</label>
                <textarea
                  rows={3}
                  value={storyForm.caption}
                  onChange={e => setStoryForm(f => ({ ...f, caption: e.target.value }))}
                  placeholder="Describe the moment..."
                  className="w-full mt-1 bg-[#050814] border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
              {err && <p className="text-xs text-red-400">{err}</p>}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateStory(false)} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs">Cancel</button>
                <button type="submit" disabled={busy} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs">
                  {busy ? 'Posting…' : 'Post Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
