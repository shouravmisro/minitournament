import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OFFICIAL_POSTS, OFFICIAL_STORIES } from '../src/data/editorialContent.js';
import {
  SITE_ORIGIN,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  PLATFORM_FAQS,
} from '../src/utils/seo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PUBLIC_DIR = path.join(ROOT, 'public');

function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function relPrefix(depth) {
  return depth === 0 ? './' : '../'.repeat(depth);
}

function resolveImgForDepth(src = '', depth = 0) {
  if (!src) return '';
  if (/^https?:\/\//i.test(src) || src.startsWith('data:')) return src;
  return `${relPrefix(depth)}${src.replace(/^\.\//, '').replace(/^\//, '')}`;
}

function absUrl(pathOrRel = '') {
  if (!pathOrRel) return `${SITE_ORIGIN}/`;
  if (/^https?:\/\//i.test(pathOrRel)) return pathOrRel;
  return `${SITE_ORIGIN}/${pathOrRel.replace(/^\.\//, '').replace(/^\//, '')}`;
}

function renderNav(depth) {
  const pre = relPrefix(depth);
  return `
  <header>
    <nav aria-label="Primary Navigation">
      <a href="${pre}">ArenaPro</a>
      <a href="${pre}tournaments/">Tournaments</a>
      <a href="${pre}clubs/">Clubs</a>
      <a href="${pre}players/">Players</a>
      <a href="${pre}blog/">Stories &amp; Blog</a>
    </nav>
  </header>`;
}

function renderFooter(depth) {
  const pre = relPrefix(depth);
  return `
  <footer>
    <p>ArenaPro — Multi-Organizer Tournament, Club &amp; Matchday Platform</p>
    <nav aria-label="Footer Navigation">
      <a href="${pre}">Home</a>
      <a href="${pre}tournaments/">Tournaments</a>
      <a href="${pre}clubs/">Clubs</a>
      <a href="${pre}players/">Players</a>
      <a href="${pre}blog/">Stories &amp; Blog</a>
      <a href="${pre}sitemap.xml">Sitemap</a>
      <a href="${pre}llms.txt">llms.txt</a>
      <a href="${pre}llms-full.txt">llms-full.txt</a>
    </nav>
  </footer>`;
}

function renderFaqsHtml(faqs = []) {
  if (!faqs.length) return '';
  return `
  <section aria-label="Frequently Asked Questions">
    <h2>Frequently Asked Questions</h2>
    ${faqs
      .map(
        f => `
    <article>
      <h3>${esc(f.q)}</h3>
      <p>${esc(f.a)}</p>
    </article>`
      )
      .join('')}
  </section>`;
}

function renderHomeBody() {
  const pre = relPrefix(0);
  return `
  ${renderNav(0)}
  <main>
    <section>
      <h1>Run Pro Leagues, Drafts &amp; Clubs From Kickoff to Trophy</h1>
      <p>ArenaPro is a free all-in-one tournament, club, and matchday management OS for organizers, clubs, captains, and players. Manage self-registration with waitlists, live multi-device player auctions, smart fixtures, matchday lineups, persistent club profiles, verified player career stats, and matchday stories.</p>
    </section>
    <section>
      <h2>Complete A–Z Competition Suite</h2>
      <ul>
        <li><strong>Smart Onboarding &amp; Waitlists:</strong> 6-character Join Codes, invite links, capacity caps, automatic waitlist promotion, and duplicate profile merging via Google Sign-In.</li>
        <li><strong>Live Synced Auction &amp; Wheel Drafts:</strong> Captains bid live from phones with budget guardrails and reserve protection, or spin balanced wheels.</li>
        <li><strong>Fixtures, RSVP &amp; Lineups:</strong> Automated round-robin schedules, knockout brackets with penalty shootouts, player availability RSVP, and starter builders.</li>
        <li><strong>Persistent Club Profiles:</strong> Permanent clubs across seasons with rosters, recruitment requests, crests, and trophy cabinets.</li>
        <li><strong>Player Career Passports:</strong> Unified career stats across tournaments and 5-axis SVG tactical radar player comparisons.</li>
        <li><strong>Stories, Blog &amp; Fan Polls:</strong> Publish matchday stories, editorial guides, match reports, and live pre-match prediction polls.</li>
      </ul>
    </section>
    <section>
      <h2>Platform Feature Stories</h2>
      <ul>
        ${OFFICIAL_STORIES.map(
          s => `<li><strong>${esc(s.title)}</strong> (${esc(s.tag)}): ${esc(s.caption)}</li>`
        ).join('\n        ')}
      </ul>
    </section>
    <section>
      <h2>Latest Guides &amp; Playbooks</h2>
      <ul>
        ${OFFICIAL_POSTS.map(
          p => `
        <li>
          <a href="${pre}blog/${encodeURIComponent(p.slug)}/"><strong>${esc(p.title)}</strong></a>
          <p>${esc(p.metaDescription || p.summary)}</p>
        </li>`
        ).join('')}
      </ul>
    </section>
    ${renderFaqsHtml(PLATFORM_FAQS)}
  </main>
  ${renderFooter(0)}`;
}

function renderDirectoryBody({ depth = 1, heading, intro, itemsHtml, guideLinks = true }) {
  const pre = relPrefix(depth);
  return `
  ${renderNav(depth)}
  <main>
    <section>
      <h1>${esc(heading)}</h1>
      <p>${esc(intro)}</p>
    </section>
    ${itemsHtml}
    ${
      guideLinks
        ? `<section>
      <h2>Recommended Organizer Guides</h2>
      <ul>
        ${OFFICIAL_POSTS.map(
          p => `<li><a href="${pre}blog/${encodeURIComponent(p.slug)}/">${esc(p.title)}</a></li>`
        ).join('\n        ')}
      </ul>
    </section>`
        : ''
    }
  </main>
  ${renderFooter(depth)}`;
}

function renderArticleBody(post) {
  const depth = 2;
  const sectionsHtml = (post.sections || [])
    .map(sec => {
      const paras = (sec.paragraphs || []).map(p => `<p>${esc(p)}</p>`).join('\n');
      const table = sec.table
        ? `<table>
        <thead><tr>${sec.table.headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${sec.table.rows
          .map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`)
          .join('')}</tbody>
      </table>`
        : '';
      const fig = sec.screenshot
        ? `<figure>
        <img src="${esc(resolveImgForDepth(sec.screenshot.src, depth))}" alt="${esc(sec.screenshot.alt || sec.heading)}" />
        ${sec.screenshot.caption ? `<figcaption>${esc(sec.screenshot.caption)}</figcaption>` : ''}
      </figure>`
        : '';
      return `
      <section>
        <h2>${esc(sec.heading)}</h2>
        ${paras}
        ${table}
        ${fig}
      </section>`;
    })
    .join('\n');

  return `
  ${renderNav(depth)}
  <main>
    <article>
      <p>${esc(post.category)} • By ${esc(post.authorName)} • ${post.readMins || 5} min read</p>
      <h1>${esc(post.title)}</h1>
      ${
        post.quickAnswer
          ? `<aside aria-label="Quick Answer"><h2>Quick Answer</h2><p>${esc(post.quickAnswer)}</p></aside>`
          : ''
      }
      ${
        Array.isArray(post.keyTakeaways) && post.keyTakeaways.length > 0
          ? `<section aria-label="Key Takeaways"><h2>Key Takeaways</h2><ul>${post.keyTakeaways
              .map(k => `<li>${esc(k)}</li>`)
              .join('')}</ul></section>`
          : ''
      }
      ${sectionsHtml}
      ${renderFaqsHtml(post.faqs || [])}
    </article>
  </main>
  ${renderFooter(depth)}`;
}

function buildHtmlFromTemplate(template, {
  depth,
  title,
  description,
  keywords,
  canonicalPath,
  ogType = 'website',
  ogImage = 'screenshots/01-homepage.png',
  jsonLdGraph,
  bodyHtml,
}) {
  const canonicalUrl = `${SITE_ORIGIN}${canonicalPath}`;
  const fullTitle = title.includes('ArenaPro') ? title : `${title} | ArenaPro`;
  const absOgImage = absUrl(ogImage);
  const pre = relPrefix(depth);

  let html = template;

  // Adjust relative asset links in built Vite index.html for nested paths
  if (depth > 0) {
    html = html
      .replace(/(href|src)="\.\/assets\//g, `$1="${pre}assets/`)
      .replace(/(href|src)="\.\/llms\.txt"/g, `$1="${pre}llms.txt"`)
      .replace(/(href|src)="\.\/screenshots\//g, `$1="${pre}screenshots/`);
  }

  html = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(fullTitle)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${esc(description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${esc(canonicalUrl)}" />`)
    .replace(/<meta property="og:type" content="[^"]*"\s*\/>/, `<meta property="og:type" content="${esc(ogType)}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${esc(fullTitle)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${esc(description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${esc(canonicalUrl)}" />`)
    .replace(/<meta property="og:image" content="[^"]*"\s*\/>/, `<meta property="og:image" content="${esc(absOgImage)}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${esc(fullTitle)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${esc(description)}" />`)
    .replace(/<meta name="twitter:image" content="[^"]*"\s*\/>/, `<meta name="twitter:image" content="${esc(absOgImage)}" />`);

  if (keywords) {
    html = html.replace(/<meta name="keywords" content="[^"]*"\s*\/>/, `<meta name="keywords" content="${esc(keywords)}" />`);
  }

  if (jsonLdGraph) {
    const jsonLdBlock = `<script type="application/ld+json">\n${JSON.stringify(
      { '@context': 'https://schema.org', '@graph': jsonLdGraph },
      null,
      2
    )}\n    </script>`;
    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, jsonLdBlock);
  }

  // Inject pre-rendered crawlable HTML into #root (React createRoot replaces it smoothly on mount)
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);
  return html;
}

function writeOut(relPath, content) {
  const full = path.join(DIST, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

function generateLlmsFull() {
  const lines = [
    '# ArenaPro — Complete Platform & Editorial Knowledge Base',
    '',
    `Canonical URL: ${SITE_ORIGIN}/`,
    `Last Updated: ${new Date().toISOString().split('T')[0]}`,
    '',
    '## Platform Overview',
    DEFAULT_DESCRIPTION,
    '',
    '## Homepage FAQs',
    ...PLATFORM_FAQS.flatMap(f => [`### ${f.q}`, f.a, '']),
    '## Matchday & Feature Stories',
    ...OFFICIAL_STORIES.map(s => `- **${s.title}** [${s.tag}]: ${s.caption}`),
    '',
  ];

  for (const post of OFFICIAL_POSTS) {
    lines.push(`---`, '');
    lines.push(`## ${post.title}`);
    lines.push(`URL: ${SITE_ORIGIN}/blog/${post.slug}/`);
    lines.push(`Category: ${post.category} | Read time: ${post.readMins} min`);
    if (post.metaDescription) lines.push(`Summary: ${post.metaDescription}`);
    if (post.quickAnswer) lines.push('', `### Quick Answer`, post.quickAnswer);
    if (post.keyTakeaways?.length) {
      lines.push('', `### Key Takeaways`, ...post.keyTakeaways.map(k => `- ${k}`));
    }
    for (const sec of post.sections || []) {
      lines.push('', `### ${sec.heading}`);
      for (const p of sec.paragraphs || []) lines.push(p, '');
      if (sec.table) {
        lines.push(`| ${sec.table.headers.join(' | ')} |`);
        lines.push(`| ${sec.table.headers.map(() => '---').join(' | ')} |`);
        for (const row of sec.table.rows) lines.push(`| ${row.join(' | ')} |`);
        lines.push('');
      }
      if (sec.screenshot?.caption) lines.push(`[Screenshot: ${sec.screenshot.caption}]`, '');
    }
    if (post.faqs?.length) {
      lines.push('### Frequently Asked Questions', ...post.faqs.flatMap(f => [`**Q: ${f.q}**`, `A: ${f.a}`, '']));
    }
  }

  return lines.join('\n');
}

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  const entries = [
    { loc: `${SITE_ORIGIN}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${SITE_ORIGIN}/tournaments/`, priority: '0.9', changefreq: 'daily' },
    { loc: `${SITE_ORIGIN}/clubs/`, priority: '0.85', changefreq: 'weekly' },
    { loc: `${SITE_ORIGIN}/players/`, priority: '0.85', changefreq: 'weekly' },
    { loc: `${SITE_ORIGIN}/blog/`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${SITE_ORIGIN}/llms.txt`, priority: '0.6', changefreq: 'weekly' },
    ...OFFICIAL_POSTS.map((p, i) => ({
      loc: `${SITE_ORIGIN}/blog/${encodeURIComponent(p.slug)}/`,
      priority: i === 0 ? '0.95' : '0.85',
      changefreq: 'monthly',
    })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    e => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;
}

function main() {
  const indexHtmlPath = path.join(DIST, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    throw new Error('dist/index.html not found. Run `vite build` first.');
  }
  const template = fs.readFileSync(indexHtmlPath, 'utf8');

  // 1. Homepage (dist/index.html)
  const homeHtml = buildHtmlFromTemplate(template, {
    depth: 0,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
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
    bodyHtml: renderHomeBody(),
  });
  writeOut('index.html', homeHtml);

  // 2. Directory Pages (/tournaments/, /clubs/, /players/, /blog/)
  writeOut(
    'tournaments/index.html',
    buildHtmlFromTemplate(template, {
      depth: 1,
      title: 'Tournaments Directory — Live Leagues, Auction Drafts & Cups',
      description: 'Browse public football and turf tournaments, launch a new competition, or enter a 6-character Join Code on ArenaPro.',
      canonicalPath: '/tournaments/',
      ogImage: 'screenshots/02-tournaments-hub.png',
      jsonLdGraph: [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
            { '@type': 'ListItem', position: 2, name: 'Tournaments', item: `${SITE_ORIGIN}/tournaments/` },
          ],
        },
        {
          '@type': 'CollectionPage',
          name: 'ArenaPro Tournaments Directory',
          url: `${SITE_ORIGIN}/tournaments/`,
        },
      ],
      bodyHtml: renderDirectoryBody({
        depth: 1,
        heading: 'Tournaments Directory',
        intro: 'Browse live public tournaments, launch League, Knockout, or Hybrid competitions, and join immediately using a 6-character code.',
        itemsHtml: `<section><h2>Supported Formats &amp; Onboarding</h2><ul><li>Round-Robin League Tables with GD / H2H / GF tiebreakers</li><li>Knockout Elimination Brackets with Penalty Shootouts</li><li>Hybrid Season + Playoff Brackets</li><li>Player Self-Registration &amp; Automatic Waitlists</li></ul></section>`,
      }),
    })
  );

  writeOut(
    'clubs/index.html',
    buildHtmlFromTemplate(template, {
      depth: 1,
      title: 'Clubs & Franchises Directory — Rosters, Grounds & Recruitment',
      description: 'Create persistent clubs on ArenaPro, publish rosters and home grounds, display trophy cabinets, and approve player join requests.',
      canonicalPath: '/clubs/',
      ogImage: 'screenshots/07-teams-overview.png',
      jsonLdGraph: [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
            { '@type': 'ListItem', position: 2, name: 'Clubs', item: `${SITE_ORIGIN}/clubs/` },
          ],
        },
        {
          '@type': 'CollectionPage',
          name: 'ArenaPro Clubs & Franchises',
          url: `${SITE_ORIGIN}/clubs/`,
        },
      ],
      bodyHtml: renderDirectoryBody({
        depth: 1,
        heading: 'Clubs & Franchises',
        intro: 'Persistent community clubs that maintain rosters across seasons, recruit free agents, and preserve club honors.',
        itemsHtml: `<section><h2>Club Management Tools</h2><ul><li>Custom Club Crest, City &amp; Home Ground</li><li>Open / Closed Recruitment Status &amp; Join Approvals</li><li>Cross-Season Trophy Cabinet &amp; Roster Continuity</li></ul></section>`,
      }),
    })
  );

  writeOut(
    'players/index.html',
    buildHtmlFromTemplate(template, {
      depth: 1,
      title: 'Players & Career Passports Directory — Cross-Season Stats & Radar',
      description: 'Search verified player career passports across ArenaPro tournaments, compare 5-axis SVG tactical radars, and track goals, assists, clean sheets, and MVPs.',
      canonicalPath: '/players/',
      ogImage: 'screenshots/06-player-radar-profile.png',
      jsonLdGraph: [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
            { '@type': 'ListItem', position: 2, name: 'Players', item: `${SITE_ORIGIN}/players/` },
          ],
        },
        {
          '@type': 'CollectionPage',
          name: 'ArenaPro Players Directory',
          url: `${SITE_ORIGIN}/players/`,
        },
      ],
      bodyHtml: renderDirectoryBody({
        depth: 1,
        heading: 'Players & Career Passports',
        intro: 'Verified cross-tournament player statistics, Google-linked career migration, 5-axis tactical attribute radar, and head-to-head player comparisons.',
        itemsHtml: `<section><h2>Player Passport Features</h2><ul><li>Unified career totals: Matches, Goals, Assists, Clean Sheets, Saves, MVPs, Rating</li><li>5-Axis SVG Tactical Radar (Attacking, Playmaking, Passing, Defending, Physicality)</li><li>Legacy PIN + Google ID Linking without losing historical stats</li></ul></section>`,
      }),
    })
  );

  writeOut(
    'blog/index.html',
    buildHtmlFromTemplate(template, {
      depth: 1,
      title: 'Stories & Sports Blog — Tournament Guides, Draft Playbooks & News',
      description: 'Complete ArenaPro guide with screenshots plus in-depth playbooks for running turf tournaments, auction vs. wheel drafts, tiebreakers, waitlists, and clubs.',
      canonicalPath: '/blog/',
      ogImage: 'screenshots/01-homepage.png',
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
          name: 'ArenaPro Stories & Sports Blog',
          url: `${SITE_ORIGIN}/blog/`,
          blogPost: OFFICIAL_POSTS.map(p => ({
            '@type': 'BlogPosting',
            headline: p.title,
            url: `${SITE_ORIGIN}/blog/${encodeURIComponent(p.slug)}/`,
            datePublished: new Date(p.createdAt).toISOString(),
          })),
        },
      ],
      bodyHtml: renderDirectoryBody({
        depth: 1,
        heading: 'Stories & Sports Blog',
        intro: 'Visual product stories, step-by-step organizer guides with screenshots, draft strategy breakdowns, and tournament governance articles.',
        guideLinks: false,
        itemsHtml: `
        <section>
          <h2>Featured Articles (${OFFICIAL_POSTS.length})</h2>
          ${OFFICIAL_POSTS.map(
            p => `
          <article>
            <h3><a href="./${encodeURIComponent(p.slug)}/">${esc(p.title)}</a></h3>
            <p>${esc(p.metaDescription || p.summary)}</p>
          </article>`
          ).join('')}
        </section>`,
      }),
    })
  );

  // 3. All Editorial Blog Posts (/blog/<slug>/index.html)
  for (const post of OFFICIAL_POSTS) {
    const slug = encodeURIComponent(post.slug);
    const canonicalPath = `/blog/${slug}/`;
    const articleUrl = `${SITE_ORIGIN}${canonicalPath}`;
    const graph = [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'Stories & Blog', item: `${SITE_ORIGIN}/blog/` },
          { '@type': 'ListItem', position: 3, name: post.title, item: articleUrl },
        ],
      },
      {
        '@type': 'Article',
        mainEntityOfPage: articleUrl,
        headline: post.title,
        description: post.metaDescription || post.summary || '',
        image: absUrl(post.coverUrl || 'screenshots/01-homepage.png'),
        author: { '@type': 'Organization', name: post.authorName || 'ArenaPro Editorial' },
        publisher: {
          '@type': 'Organization',
          name: 'ArenaPro',
          logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/screenshots/01-homepage.png` },
        },
        datePublished: new Date(post.createdAt).toISOString(),
        dateModified: new Date(post.createdAt).toISOString(),
        keywords: (post.keywords || []).join(', '),
      },
    ];

    if (Array.isArray(post.faqs) && post.faqs.length > 0) {
      graph.push({
        '@type': 'FAQPage',
        mainEntity: post.faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      });
    }

    const html = buildHtmlFromTemplate(template, {
      depth: 2,
      title: post.title,
      description: post.metaDescription || post.summary || DEFAULT_DESCRIPTION,
      keywords: (post.keywords || []).join(', '),
      canonicalPath,
      ogType: 'article',
      ogImage: post.coverUrl || 'screenshots/01-homepage.png',
      jsonLdGraph: graph,
      bodyHtml: renderArticleBody(post),
    });

    writeOut(`blog/${post.slug}/index.html`, html);
  }

  // 4. Generate sitemap.xml (sync both dist/ and public/), llms-full.txt, and .nojekyll
  const sitemapXml = generateSitemap();
  writeOut('sitemap.xml', sitemapXml);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapXml, 'utf8');

  writeOut('llms-full.txt', generateLlmsFull());
  writeOut('.nojekyll', '');

  console.log(`Prerendered ${OFFICIAL_POSTS.length + 5} static HTML routes, sitemap.xml, llms-full.txt, and .nojekyll.`);
}

main();
