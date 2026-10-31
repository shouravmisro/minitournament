# 🏆 Mini Tournament App

A mobile-first tournament management SPA built with **React + Vite + Tailwind CSS + Lucide Icons**.

## Features

- **Multi-Tournament Support** — manage multiple simultaneous tournaments with completely isolated state in localStorage
- **Global Organizer Profile** — persistent organizer identity across all tournaments
- **Smart Bulk Player Dump & Roster Import** — paste WhatsApp player lists or pre-decided team rosters with automatic position & captain detection
- **Role-based PIN Auth** — Admin, Captain, Player, and Public Hub views
- **Spin the Wheel & Auction Draft** — animated Canvas wheel with live budget bidding & admin assignment
- **Championship Engine** — round-robin league fixture generator, live score entry, auto-calculated standings, and knockout playoff bracket
- **Dynamic Awards & Trophy Room** — custom award creation, player linking, and public showcase
- **Offline First** — 100% client-side with full JSON state export & import


## Quick Start (Development)

```bash
cd mini-tournament
npm install
npm run dev
# → http://localhost:5173/mini-tournament/
```

Default Admin PIN: **`0000`** — change immediately in Admin → Settings.

## GitHub Pages Deployment

### 1. Build and Deploy
```bash
npm run deploy
```
This runs `vite build` and deploys the `dist/` directory to the `gh-pages` branch.

### 2. Enable GitHub Pages
In your repository: **Settings → Pages → Build and deployment → Source: `Deploy from a branch` → Branch: `gh-pages` / `/ (root)` → Save**

Live at:
`https://shouravmisro.github.io/minitournament/`

## Tech Stack

| Tool | Version |
|------|---------|
| React | 19 |
| Vite | 8 |
| Tailwind CSS | 4 |
| Lucide React | 1.66 |
| gh-pages | 6 |

## Project Structure

```
src/
├── context/
│   ├── TournamentContext.jsx   # State store + bulk parser
│   └── AuthContext.jsx         # PIN role gate
├── components/
│   ├── Navbar.jsx              # Nav + PIN modal
│   ├── OrganizerProfile.jsx    # Banner + editor
│   ├── BulkDumpWizard.jsx      # 3-step quick-start wizard
│   ├── AdminPanel.jsx          # Full admin control center
│   ├── CaptainPanel.jsx        # Captain dashboard
│   ├── PlayerPanel.jsx         # Player profile & availability
│   ├── PublicHub.jsx           # Public landing
│   ├── PlayerList.jsx          # Filterable player directory
│   ├── PlayerProfileModal.jsx  # FIFA-style card
│   ├── CaptainList.jsx         # Captain/team browser
│   ├── TeamDetailsModal.jsx    # Full team page
│   ├── SpinWheel.jsx           # Canvas draft wheel
│   ├── MatchEngine.jsx         # Fixture gen + score entry
│   ├── LeagueStandings.jsx     # Auto-computed table
│   ├── KnockoutBracket.jsx     # Visual KO tree
│   └── AwardsSystem.jsx        # Dynamic awards + trophy room
└── App.jsx                     # Tab navigation per role
```

