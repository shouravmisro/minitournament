// Official SEO / GEO / AEO Editorial Stories & Blog Articles for ArenaPro

const NOW = Date.UTC(2026, 10, 26, 2, 0, 0);

export const OFFICIAL_STORIES = [
  {
    id: 'story_arenapro_tour',
    isOfficial: true,
    title: 'ArenaPro: From Join Code to Trophy',
    tag: 'Platform Tour',
    caption: 'A complete A–Z tournament & club platform built for organizers, captains, and players — zero spreadsheet chaos.',
    imageUrl: './screenshots/01-homepage.png',
    authorName: 'ArenaPro Editorial',
    authorAvatar: '',
    createdAt: NOW - 1000 * 60 * 15,
  },
  {
    id: 'story_live_hub',
    isOfficial: true,
    title: 'Join Code & Fan Prediction Polls',
    tag: 'Features',
    caption: 'Share a 6-character Join Code so players register themselves, link Google accounts, and vote on matchday winners.',
    imageUrl: './screenshots/03-tournament-center.png',
    authorName: 'ArenaPro Editorial',
    authorAvatar: '',
    createdAt: NOW - 1000 * 60 * 30,
  },
  {
    id: 'story_standings_form',
    isOfficial: true,
    title: 'Live Standings, Form & Tiebreakers',
    tag: 'Standings',
    caption: 'Configurable tiebreakers (GD, Head-to-Head, Goals For) and automatic 5-match form badges updated on every whistle.',
    imageUrl: './screenshots/04-standings-table.png',
    authorName: 'ArenaPro Editorial',
    authorAvatar: '',
    createdAt: NOW - 1000 * 60 * 45,
  },
  {
    id: 'story_h2h_matrix',
    isOfficial: true,
    title: 'Head-to-Head Results Matrix',
    tag: 'Analytics',
    caption: 'See every team vs. every rival in one instant visual score grid — no digging through weeks of match logs.',
    imageUrl: './screenshots/05-h2h-matrix.png',
    authorName: 'ArenaPro Editorial',
    authorAvatar: '',
    createdAt: NOW - 1000 * 60 * 60,
  },
  {
    id: 'story_radar_passport',
    isOfficial: true,
    title: '5-Axis Player Radar & Career Passport',
    tag: 'Player Stats',
    caption: 'Compare any two players side-by-side across Goals, Assists, Matches, Defense, and Ratings across all seasons.',
    imageUrl: './screenshots/06-player-radar-profile.png',
    authorName: 'ArenaPro Editorial',
    authorAvatar: '',
    createdAt: NOW - 1000 * 60 * 90,
  },
  {
    id: 'story_teams_rosters',
    isOfficial: true,
    title: 'Team Squads, Captains & Budgets',
    tag: 'Squads',
    caption: 'Track drafted squads, captains, matchday attendance RSVPs, and starting lineups in real time.',
    imageUrl: './screenshots/07-teams-overview.png',
    authorName: 'ArenaPro Editorial',
    authorAvatar: '',
    createdAt: NOW - 1000 * 60 * 120,
  },
];

export const OFFICIAL_POSTS = [
  {
    id: 'how-to-use-arenapro-complete-guide-with-screenshots',
    slug: 'how-to-use-arenapro-complete-guide-with-screenshots',
    isOfficial: true,
    category: 'Guide',
    title: 'How to Use ArenaPro: Complete A–Z Guide, Why Organizers Switch & Full Feature Tour (With Screenshots)',
    metaDescription: 'Learn how to run a sports tournament from A to Z with ArenaPro. Includes real screenshots, step-by-step setup for organizers, captains, and players, and why it replaces WhatsApp & Excel.',
    keywords: [
      'how to use ArenaPro',
      'free tournament management software',
      'football tournament organizer app',
      'live player auction app',
      'sports club and standings platform',
    ],
    coverUrl: './screenshots/01-homepage.png',
    summary: 'Everything you need to launch a tournament, onboard players via Join Codes, run a live synced auction draft, track H2H standings, and manage clubs — with real screenshots.',
    quickAnswer: 'ArenaPro is a free, real-time web platform for running sports tournaments and clubs from registration to trophy. Organizers sign in with Google, create a league/knockout/hybrid tournament in 30 seconds, share a 6-character Join Code for player signups, run a live multi-device auction or spin-wheel draft, and publish automatic standings, Head-to-Head matrices, knockout penalties, and verified player career stats.',
    keyTakeaways: [
      'Zero spreadsheets or messy WhatsApp lists: bulk-import rosters or open self-registration with automatic waitlists and fee verification.',
      'Multi-organizer isolation & Co-Admins: every organizer owns their tournaments securely via Google Sign-In, while existing PIN players can link their Google accounts with zero data loss.',
      'Live multi-device Auction Room with Max-Safe-Bid guardrails prevents captains from overspending before completing their squads.',
      'Complete matchday workflow: player RSVP (Going/Late/Out), captain Starting Lineup builder, live standings, Head-to-Head matrix, and penalty shootouts.',
      'Persistent Clubs and cross-tournament Player Career Passports with 5-axis SVG Radar comparison charts.',
    ],
    readMins: 7,
    authorName: 'ArenaPro Team',
    authorAvatar: '',
    createdAt: NOW - 1000 * 60 * 10,
    likesCount: 24,
    likedByUids: [],
    sections: [
      {
        heading: 'Why Use ArenaPro Instead of WhatsApp Groups & Spreadsheets?',
        paragraphs: [
          'Most local leagues, campus cups, and turf tournaments start in a WhatsApp group and a fragile Excel sheet. Within two matchdays, organizers face duplicate player entries, arguments over goal difference vs. head-to-head tiebreakers, outdated screenshots of standings, and captains who do not know which players are actually showing up.',
          'ArenaPro replaces every scattered tool with one live, mobile-first competition operating system. When a score is saved, league tables, Head-to-Head matrices, Golden Boot leaderboards, and player career passports update instantly across every device.',
        ],
        table: {
          headers: ['Workflow Step', 'WhatsApp + Excel Setup', 'ArenaPro Platform'],
          rows: [
            ['Player Onboarding', 'Manual copy-paste from chat messages', '6-char Join Code, Waitlist & Duplicate Merge'],
            ['Draft / Team Selection', 'In-person only or chaotic voice calls', 'Live Multi-Device Auction & Spin Wheel + Bid Guardrails'],
            ['Standings & Tiebreakers', 'Manual formulas prone to errors', 'Real-time Pts, GD, GF, H2H & 5-Match Form'],
            ['Matchday Lineups', 'Last-minute texts before kickoff', 'Per-Match Player RSVP + Captain Lineup Builder'],
            ['Player & Club History', 'Deleted after the tournament ends', 'Permanent Clubs & Verified Career Passports'],
          ],
        },
        screenshot: {
          src: './screenshots/01-homepage.png',
          alt: 'ArenaPro platform homepage showing live tournaments, clubs, player passports, and quick Join Code bar',
          caption: 'The ArenaPro Homepage: jump straight into live tournaments, clubs, player career passports, or enter a 6-character Join Code.',
        },
      },
      {
        heading: 'Step 1: Sign In with Google & Create or Open a Tournament',
        paragraphs: [
          'Visit ArenaPro and click Sign in with Google in the top navigation bar. Your organizer profile, hosted tournaments, and player history stay tied to your account—isolated from other organizers using the platform.',
          'Click Tournaments → New Tournament to choose League (round-robin), Knockout (elimination), or Hybrid (group league followed by playoffs), and set visibility to Public or Link-Only Private. You can also invite Co-Admins by their Google email so co-organizers can share scoring and management duties.',
        ],
        screenshot: {
          src: './screenshots/02-tournaments-hub.png',
          alt: 'ArenaPro Tournaments Hub with search, format filters, Join Code bar, and public tournaments',
          caption: 'Filter tournaments by format (League, Knockout, Hybrid), clone previous seasons in one click, or open any tournament by ID or Join Code.',
        },
      },
      {
        heading: 'Step 2: Onboard Players Without Friction (Join Codes, Waitlists & Google Linking)',
        paragraphs: [
          'Every tournament automatically receives a 6-character Join Code (for example, ZRGSZM) and a direct registration link (?t=<id>&join=1). Organizers can configure a player capacity limit, registration deadline, entry fee, and payment instructions inside Admin → Registrations, Google Links & Waitlist.',
          'Already imported players from a WhatsApp list? Existing players do not need to register twice. They simply click Connect Google on the Tournament Hub, select their existing roster name, and verify their 4-digit PIN (or request organizer approval) to keep 100% of their stats, team, and history.',
        ],
        screenshot: {
          src: './screenshots/03-tournament-center.png',
          alt: 'Tournament Center showing tournament banner, Join Code, Connect Google, Register as Player, and Shareable Digest',
          caption: 'The Tournament Center Hub: players can register, link their existing profile to Google, or copy a WhatsApp-ready Matchday Digest.',
        },
      },
      {
        heading: 'Step 3: Run a Fair Live Draft (Multi-Device Auction or Spin Wheel)',
        paragraphs: [
          'Open the Draft tab as Admin. When you spin the animated wheel, the nominated player syncs live to every Captain’s phone. Captains place live bids directly from their own devices using quick-bid buttons.',
          'ArenaPro includes automatic Max-Safe-Bid guardrails: based on minimum squad size and reserve price per remaining slot, the system calculates each team’s maximum safe bid so a captain can never burn their entire budget early and fail to field a full squad.',
        ],
        screenshot: {
          src: './screenshots/07-teams-overview.png',
          alt: 'Participating teams overview showing team badges, captains, and drafted squad counts',
          caption: 'Teams Overview: inspect every squad, captain assignment, team colors, and match record.',
        },
      },
      {
        heading: 'Step 4: Automated Standings, H2H Matrix & Knockout Penalties',
        paragraphs: [
          'Generate round-robin schedules in seconds and log match scores, goals, assists, saves, clean sheets, and MVPs. Standings calculate Points, Goal Difference, Goals For, and 5-match Form automatically.',
          'Organizers can choose their preferred tiebreaker order (Points → GD → GF → H2H, or UEFA-style Head-to-Head priority), inspect the interactive H2H Matrix grid, and settle drawn knockout ties with full Penalty Shootout score tracking.',
        ],
        screenshot: {
          src: './screenshots/04-standings-table.png',
          alt: 'League Standings table showing Rank, Team, Played, Won, Drawn, Lost, GF, GA, GD, Form badges, and Points',
          caption: 'Live Standings with configurable tiebreakers and recent 5-match Form badges.',
        },
      },
      {
        heading: 'Step 5: Head-to-Head Matrix, Matchday Lineups & Player Radar Passports',
        paragraphs: [
          'Before kickoff, players mark per-match RSVP (Going, Late, or Out) in their Player Panel, and Captains build their Starting XI and Substitutes in the Matchday Lineup Builder (with automatic Goalkeeper coverage checks).',
          'After the whistle, every verified player builds a permanent Career Passport across all tournaments they play, complete with a 5-axis SVG Performance Radar for side-by-side player comparisons.',
        ],
        screenshot: {
          src: './screenshots/06-player-radar-profile.png',
          alt: 'Player Career Passport modal showing matches, assists, competitions played, and 5-axis SVG Performance Radar chart',
          caption: 'Cross-Tournament Player Career Passport with the 5-Axis SVG Performance Radar and side-by-side comparison selector.',
        },
      },
    ],
    faqs: [
      {
        q: 'Is ArenaPro free to use for local tournaments and clubs?',
        a: 'Yes. Hosting tournaments, player registration, live synced drafts, standings, knockout brackets, clubs, and player career passports are 100% free.',
      },
      {
        q: 'Do players who were already added by an organizer need to register again?',
        a: 'No. Existing players can click "Connect Google" on the tournament Hub, pick their existing roster name, and verify with their 4-digit PIN (or ask the organizer to approve) so all their existing stats and team data stay intact.',
      },
      {
        q: 'Can captains bid from separate phones during a player auction?',
        a: 'Yes. ArenaPro syncs the active player on the auction block and live bids in real time via Firestore so captains can bid remotely from their own devices.',
      },
      {
        q: 'What happens if a knockout match ends in a draw?',
        a: 'The Knockout Bracket supports regulation draw scores paired with Penalty Shootout inputs (for example, 1–1 and 4–2 on penalties), advancing the shootout winner without distorting league goal totals.',
      },
      {
        q: 'Can multiple organizers manage the same tournament?',
        a: 'Yes. The tournament owner can add Co-Admins by Google email inside Admin → Access Control, PINs & Data Management.',
      },
    ],
    body: 'Complete A-to-Z guide covering why organizers use ArenaPro, how to set up tournaments, player onboarding, live auction drafts, standings, clubs, and player career passports.',
  },
  {
    id: 'how-to-organize-local-football-turf-tournament-2026',
    slug: 'how-to-organize-local-football-turf-tournament-2026',
    isOfficial: true,
    category: 'Guide',
    title: 'How to Organize a Local Football or Turf Tournament from Scratch (2026 Step-by-Step Checklist)',
    metaDescription: 'A complete 2026 blueprint for organizing a 5-a-side, 7-a-side, or 11-a-side local football tournament: formats, registration caps, budgeting, fixtures, and tiebreakers.',
    keywords: [
      'how to organize a football tournament',
      'turf tournament checklist',
      '7-a-side tournament format',
      'local league planning guide',
    ],
    coverUrl: './screenshots/03-tournament-center.png',
    summary: 'From choosing between League and Hybrid formats to handling waitlists, turf slots, and fair tiebreakers — a practical organizer checklist.',
    quickAnswer: 'To organize a smooth local football or turf tournament: (1) lock venue hours and choose a format (League for 4–6 teams, Hybrid for 6–12 teams), (2) open online registration with a strict player cap and waitlist, (3) collect entry fees before the draft, (4) publish round-robin fixtures with clear tiebreaker rules upfront, and (5) track live scores, cards, and awards in one shared link.',
    keyTakeaways: [
      'Hybrid format (short round-robin + Semi-Finals & Final) delivers the highest engagement for 6 to 8 teams in a single weekend or multi-week turf league.',
      'Always set a Max Players cap with an automatic Waitlist—dropouts happen in nearly 15% of amateur signups.',
      'Publish tiebreaker rules (Goal Difference vs. Head-to-Head) and knockout penalty rules before Matchday 1 to avoid disputes.',
    ],
    readMins: 5,
    authorName: 'ArenaPro Editorial',
    authorAvatar: '',
    createdAt: NOW - 1000 * 60 * 60 * 3,
    likesCount: 18,
    likedByUids: [],
    sections: [
      {
        heading: '1. Pick the Right Format for Your Team Count & Turf Hours',
        paragraphs: [
          'The biggest mistake new organizers make is booking turf hours before calculating total matches. A 4-team single round-robin takes 6 matches; a 6-team round-robin takes 15 matches; an 8-team round-robin takes 28 matches.',
          'For 4–5 teams, a double round-robin League plus a Grand Final guarantees every squad plays plenty of minutes. For 6–12 teams, a Hybrid format (group stage followed by Quarter-Finals or Semi-Finals) keeps lower-ranked teams alive late into the event.',
        ],
      },
      {
        heading: '2. Replace Chat Signups with Structured Registration & Waitlists',
        paragraphs: [
          'Collecting names in a messaging thread leads to missing positions, duplicate entries, and unpaid spots. Instead, share a single Join Code link where players submit their preferred position, jersey number, and payment reference.',
          'Setting a hard capacity cap (for example, 28 players for four 7-a-side squads) with an automatic waitlist ensures late applicants can fill last-minute injuries without scrambling.',
        ],
        screenshot: {
          src: './screenshots/03-tournament-center.png',
          alt: 'ArenaPro Tournament Center registration banner with Join Code and capacity indicator',
          caption: 'Using a single Join Code link centralizes capacity limits, payment instructions, and player profiles.',
        },
      },
      {
        heading: '3. Lock Matchday Attendance & Share Live Standings',
        paragraphs: [
          'Two hours before kickoff, use per-match RSVP check-ins so captains know who is Going, Late, or Out. After each game, enter goals, assists, and clean sheets right away so players see live Golden Boot and standings movement on their phones.',
        ],
      },
    ],
    faqs: [
      {
        q: 'How many players should each squad have for a 7-a-side turf tournament?',
        a: 'Aim for 9 to 10 players per squad (7 starters plus 2–3 rolling substitutes) to cover fatigue and minor knocks across multiple matches.',
      },
      {
        q: 'What is the best format for a one-day 6-team tournament?',
        a: 'Two groups of 3 teams playing 2 group matches each (6 matches total), followed by Semi-Finals and a Final (3 knockout matches), fits comfortably into a 4–5 hour turf booking.',
      },
    ],
    body: 'Practical 2026 checklist for organizing local football and turf tournaments from format selection to matchday execution.',
  },
  {
    id: 'auction-draft-vs-spin-wheel-vs-snake-draft-leagues',
    slug: 'auction-draft-vs-spin-wheel-vs-snake-draft-leagues',
    isOfficial: true,
    category: 'Draft Recap',
    title: 'Auction Draft vs. Spin-the-Wheel vs. Snake Draft: Which Team Selection Format Fits Your League?',
    metaDescription: 'Compare Auction Drafts, Spin-the-Wheel drafts, and Snake Drafts for amateur sports leagues. Learn how budget guardrails prevent lopsided squads.',
    keywords: [
      'auction draft vs snake draft',
      'spin the wheel player draft',
      'amateur football auction software',
      'balanced team draft rules',
    ],
    coverUrl: './screenshots/07-teams-overview.png',
    summary: 'Choosing the right draft format determines how balanced—and how fun—your entire season will be. Here is how the three formats compare.',
    quickAnswer: 'Auction Drafts create the most competitive balance and excitement when player skill levels vary widely, because every captain can bid on any star using a shared coin budget. Spin-the-Wheel drafts are ideal for casual, social tournaments where surprise matters most, while Snake Drafts work best when speed and predictable turn order are top priorities.',
    keyTakeaways: [
      'Auction Drafts prevent one lucky first pick from dominating an entire tournament when skill gaps exist.',
      'Always enforce a Max-Safe-Bid reserve rule so captains cannot spend 95% of their budget on two players and leave slots empty.',
      'Combining a Spin Wheel nomination with live Auction bidding gives you both suspense and fair pricing.',
    ],
    readMins: 5,
    authorName: 'ArenaPro Editorial',
    authorAvatar: '',
    createdAt: NOW - 1000 * 60 * 60 * 6,
    likesCount: 14,
    likedByUids: [],
    sections: [
      {
        heading: 'Comparing the Three Most Popular Draft Formats',
        paragraphs: [
          'In community leagues where players range from former academy standouts to weekend regulars, unbalanced teams ruin the season by Week 2. Selecting the right draft mechanic solves parity before a single ball is kicked.',
        ],
        table: {
          headers: ['Criteria', 'Auction Draft', 'Spin-the-Wheel', 'Snake Draft'],
          rows: [
            ['Competitive Parity', 'Very High (market pricing)', 'Medium (random)', 'High (if pool is even)'],
            ['Event Excitement', 'High (live bidding wars)', 'High (roulette suspense)', 'Medium'],
            ['Average Duration', '35–60 mins', '15–25 mins', '20–30 mins'],
            ['Best For', 'Competitive leagues & big gaps', 'Friendly / mixed-skill cups', 'Fast, structured drafts'],
          ],
        },
      },
      {
        heading: 'Why Budget Guardrails Are Essential in Amateur Auctions',
        paragraphs: [
          'A classic amateur auction mistake happens when an inexperienced captain spends 900 out of 1,000 coins on two forwards and has only 100 coins left to sign six defenders and a goalkeeper.',
          'ArenaPro solves this automatically in its Live Auction Room by computing Max Safe Bid = Remaining Budget − (Remaining Required Slots × Minimum Reserve Price). Captains can bid aggressively from their phones without ever breaking squad math.',
        ],
        screenshot: {
          src: './screenshots/07-teams-overview.png',
          alt: 'Balanced teams formed via ArenaPro draft showing 4 captains and squad rosters',
          caption: 'Balanced squads after a guarded draft in FC CHOMPA PREMIER LEAGUE.',
        },
      },
    ],
    faqs: [
      {
        q: 'How does the Spin Wheel + Auction hybrid work?',
        a: 'The organizer filters undrafted players (for example, Goalkeepers only), spins the wheel to randomly nominate the next player on the block, and captains then bid live for that player.',
      },
      {
        q: 'What happens to leftover undrafted players at the end of a draft?',
        a: 'ArenaPro includes an Auto-Fill Remaining button that distributes undrafted players evenly across teams by position.',
      },
    ],
    body: 'Detailed comparison of Auction Drafts, Spin-the-Wheel Drafts, and Snake Drafts for amateur sports leagues.',
  },
  {
    id: 'league-tiebreakers-goal-difference-vs-head-to-head',
    slug: 'league-tiebreakers-goal-difference-vs-head-to-head',
    isOfficial: true,
    category: 'Guide',
    title: 'League Tiebreakers Explained: Goal Difference vs. Head-to-Head vs. Goals Scored',
    metaDescription: 'Understand the difference between Goal Difference and Head-to-Head tiebreakers in football leagues, how H2H matrices resolve ties, and which rule prevents stat-padding.',
    keywords: [
      'league tiebreaker rules',
      'goal difference vs head to head',
      'football standings tiebreaker',
      'head to head matrix tournament',
    ],
    coverUrl: './screenshots/04-standings-table.png',
    summary: 'When two teams finish level on points, the tiebreaker rule you choose can decide the trophy. Here is how GD and H2H work in practice.',
    quickAnswer: 'Under Goal Difference (GD) priority (used in the Premier League), overall Goals For minus Goals Against across all matches breaks ties first. Under Head-to-Head (H2H) priority (used in UEFA and La Liga), the direct results between the tied teams come first—which discourages teams from running up 10–0 scores against bottom-table opponents.',
    keyTakeaways: [
      'Goal Difference rewards consistency across the full season and keeps every goal meaningful.',
      'Head-to-Head priority rewards beating your direct title rivals and reduces blowouts against weaker sides.',
      'Displaying a Head-to-Head Results Matrix alongside the standings table makes tiebreakers transparent to every fan and captain.',
    ],
    readMins: 4,
    authorName: 'ArenaPro Analytics',
    authorAvatar: '',
    createdAt: NOW - 1000 * 60 * 60 * 10,
    likesCount: 16,
    likedByUids: [],
    sections: [
      {
        heading: 'Seeing Both Tiebreakers in Action',
        paragraphs: [
          'In short amateur leagues (4 to 8 teams), tied point totals happen constantly. Look at the live standings snapshot below: two teams sit level on 13 points after 9 matches, separated cleanly by Goal Difference (+6 vs 0).',
        ],
        screenshot: {
          src: './screenshots/04-standings-table.png',
          alt: 'ArenaPro standings table showing two teams tied on 13 points separated by Goal Difference and Form',
          caption: 'Real tournament standings where two teams tied on 13 points are separated by +6 vs 0 Goal Difference.',
        },
      },
      {
        heading: 'Why a Head-to-Head Matrix Eliminates Confusion',
        paragraphs: [
          'When organizers switch to Head-to-Head priority (Pts → H2H → GD → GF), captains always ask: "Wait, who won our direct games?" An interactive Head-to-Head Matrix puts every matchup between any two teams in a single grid cell so everyone can verify the tiebreaker at a glance.',
        ],
        screenshot: {
          src: './screenshots/05-h2h-matrix.png',
          alt: 'ArenaPro Head-to-Head results grid showing every match score between four teams',
          caption: 'ArenaPro H2H Matrix: inspect every head-to-head scoreline across the league in one grid.',
        },
      },
    ],
    faqs: [
      {
        q: 'Which tiebreaker is fairer for 7-a-side local leagues?',
        a: 'If team skill levels vary widely, Head-to-Head (Pts → H2H → GD → GF) prevents one team from winning the title solely by scoring 12 goals against an undermanned opponent. If teams are evenly matched, Goal Difference (Pts → GD → GF → H2H) encourages attacking play.',
      },
      {
        q: 'Can I change the tiebreaker order in ArenaPro?',
        a: 'Yes. Admins can switch between Pts → GD → GF → H2H, Pts → H2H → GD → GF, and Pts → GF → GD → H2H directly from the Standings view, and Knockout seeding automatically follows the same order.',
      },
    ],
    body: 'Explaining Goal Difference vs. Head-to-Head tiebreakers in local football leagues with real standings and H2H matrix examples.',
  },
  {
    id: 'stop-whatsapp-registration-chaos-join-codes-waitlists',
    slug: 'stop-whatsapp-registration-chaos-join-codes-waitlists',
    isOfficial: true,
    category: 'Announcement',
    title: 'How to Manage Player Registrations, Waitlists & Entry Fees Without WhatsApp Chaos',
    metaDescription: 'Learn how self-service Join Codes, capacity caps, automatic waitlists, duplicate merging, and payment verification simplify tournament onboarding.',
    keywords: [
      'tournament player registration app',
      'sports waitlist management',
      'join code tournament registration',
      'entry fee tracking for leagues',
    ],
    coverUrl: './screenshots/03-tournament-center.png',
    summary: 'Stop chasing screenshots, jersey numbers, and phone numbers in group chats. Automate player intake with Join Codes, waitlists, and Google linking.',
    quickAnswer: 'To eliminate WhatsApp registration chaos, publish a single tournament Join Code and invite link backed by Google Sign-In. Set a maximum player cap so extra signups flow into an ordered waitlist automatically, verify entry fee transaction IDs in one dashboard, and merge incoming signups with any pre-imported player names to prevent duplicates.',
    keyTakeaways: [
      'Google-authenticated registration prevents fake signups and ties players directly to their verified accounts.',
      'Private contact fields (such as WhatsApp numbers) remain visible only to organizers, never exposed on public pages.',
      'Duplicate Merge lets organizers combine a self-registered player with an already-imported WhatsApp list entry in one click.',
    ],
    readMins: 4,
    authorName: 'ArenaPro Team',
    authorAvatar: '',
    createdAt: NOW - 1000 * 60 * 60 * 16,
    likesCount: 11,
    likedByUids: [],
    sections: [
      {
        heading: 'One Link for New Signups and Existing Players',
        paragraphs: [
          'Every tournament runs into two kinds of players: newcomers applying for a spot, and returning regulars who were already added by the organizer. With ArenaPro, both groups use the exact same Tournament Center link.',
          'New players fill out their preferred positions, jersey number, photo, and optional payment reference. Returning players simply switch to "Already on Roster", pick their name, and link their Google account with their 4-digit PIN.',
        ],
        screenshot: {
          src: './screenshots/03-tournament-center.png',
          alt: 'Tournament Hub displaying Join Code, Connect Google, and Register as Player buttons',
          caption: 'Both new applicants and returning players onboard cleanly from the same Tournament Hub banner.',
        },
      },
      {
        heading: 'Waitlists & Entry Fee Tracking Without Spreadsheets',
        paragraphs: [
          'Once approved players hit your configured cap, new applicants automatically enter the Waitlist in timestamp order. If someone drops out, the Admin Console surfaces a 1-click "Promote Next from Waitlist" button while tracking fee statuses (Unpaid → Submitted → Verified).',
        ],
      },
    ],
    faqs: [
      {
        q: 'Are player phone numbers visible to everyone on the public page?',
        a: 'No. Registration phone/WhatsApp fields are stored in a protected subcollection readable only by the applicant and the tournament’s Owner/Co-Admins.',
      },
      {
        q: 'Can a player withdraw their application if they cannot make it?',
        a: 'Yes. While an application is Pending or Waitlisted, the player can edit their details or withdraw directly from the registration modal.',
      },
    ],
    body: 'How to streamline tournament registration, waitlists, duplicate merges, and entry fee tracking using Join Codes.',
  },
  {
    id: 'why-amateur-clubs-need-persistent-rosters-and-player-passports',
    slug: 'why-amateur-clubs-need-persistent-rosters-and-player-passports',
    isOfficial: true,
    category: 'Club News',
    title: 'Why Local Clubs Need Persistent Rosters & Verified Player Career Passports Across Seasons',
    metaDescription: 'Why amateur football clubs and community players benefit from permanent club pages, recruitment requests, and cross-tournament career stats with radar charts.',
    keywords: [
      'amateur football club profile',
      'player career stats tracker',
      'cross tournament player passport',
      'player performance radar chart',
    ],
    coverUrl: './screenshots/06-player-radar-profile.png',
    summary: 'Single-weekend tournaments forget great performances the moment the trophy is lifted. Persistent Clubs and Career Passports turn every match into lasting history.',
    quickAnswer: 'Persistent club profiles and verified player career passports solve the biggest gap in grassroots sports: lost history. When players link a Google account across tournaments, every match played, goal, assist, clean sheet, and rating compounds into a permanent career record—while clubs keep their roster, recruitment pipeline, and trophy cabinet between seasons.',
    keyTakeaways: [
      'Players build a multi-season track record instead of resetting to zero every tournament.',
      'Clubs can stay open for recruitment year-round with structured join applications and manager approvals.',
      '5-Axis SVG Performance Radars let captains scout and compare players visually across Attack, Playmaking, Appearances, Defense, and Rating.',
    ],
    readMins: 5,
    authorName: 'ArenaPro Editorial',
    authorAvatar: '',
    createdAt: NOW - 1000 * 60 * 60 * 24,
    likesCount: 19,
    likedByUids: [],
    sections: [
      {
        heading: 'From One-Off Weekend Cups to Real Club Identity',
        paragraphs: [
          'In most local sports scenes, teams form for three weeks, play a cup, and vanish from memory. Creating a permanent Club gives captains a home ground, crest, motto, trophy cabinet, and year-round squad roster.',
          'Players looking for a weekend game can browse recruiting clubs by city and apply directly—no more asking friends of friends for an open spot.',
        ],
      },
      {
        heading: 'Visual Scouting with Career Passports & Radar Comparisons',
        paragraphs: [
          'Every time a verified player competes in a public ArenaPro tournament, their Career Passport aggregates their total appearances, goals, assists, clean sheets, MVPs, and ratings automatically.',
          'Captains preparing for an upcoming auction can open any player’s Career Passport and overlay a second player on the 5-Axis Performance Radar to spot undervalued midfielders or clinical finishers.',
        ],
        screenshot: {
          src: './screenshots/06-player-radar-profile.png',
          alt: 'Verified player career passport with 5-axis SVG Performance Radar and tournament history badge',
          caption: 'A live Player Career Passport displaying verified matches, assists, competition history, and the 5-Axis Radar.',
        },
      },
    ],
    faqs: [
      {
        q: 'How are career stats calculated across multiple tournaments?',
        a: 'ArenaPro aggregates player stats across tournaments by matching their verified Google UID (or player name for legacy rosters) and computing totals and average match ratings.',
      },
      {
        q: 'Can any player edit their global Career Passport bio and portrait?',
        a: 'Yes. Signed-in users can update their display name, preferred position, preferred foot, city, bio, and compressed portrait from the Players directory.',
      },
    ],
    body: 'Why persistent amateur club pages and cross-tournament player career passports transform local sports communities.',
  },
];
