# 🏆 Mini Tournament App — One-Night Master Blueprint

## 1. Project Overview & Tech Stack

A lightweight, mobile-first Single Page Application (SPA) designed to run local sports/esports tournaments from player draft to trophy presentation. Built to be completed in one night and hosted directly on **GitHub Pages**.

* **Frontend Framework:** React (Vite) + Tailwind CSS + Lucide React Icons
* **Database / Sync:** Firebase Realtime Database or Supabase (with automatic `localStorage` fallback + JSON Import/Export for instant GitHub Pages reliability)
* **Authentication:** Fast 4-Digit PIN Role Gate (Admin Master PIN, Captain PIN, Player PIN) — zero email verification friction
* **Hosting:** GitHub Pages (`gh-pages` branch deployment)

## 2. Antigravity Model Strategy

Use this model allocation inside your `Mini tournament` workspace to maximize speed and preserve your thinking-model quotas:

| Model | Primary Role in This Build | 
| ----- | ----- | 
| **Claude Opus 4.6 (Thinking)** | **Phase 1 Architect:** Use once at the start to generate the global state store, the Smart Bulk Text Parser, PIN authentication wrapper, and tournament fixture/standings math engine. | 
| **Claude Sonnet 4.6 (Thinking)** | **Phase 2 & 3 Complex Logic:** Use for the HTML5 Canvas "Spin the Wheel" draft physics, dynamic roster assignment, and the League/Knockout bracket progression logic. | 
| **Gemini 3.8 Flash High** | **Default UI & Iteration Engine:** Keep selected for 80% of the night—building the 3 role panels, Quick-Dump modal, player/captain profile cards, dynamic award badges, Tailwind polish, and GitHub deployment scripts. | 
| **GPT-OSS 120B (Medium)** | **Seed Data Generator:** Use to generate realistic dummy lists (12–50 players, sample WhatsApp dump lists, and initial awards) so you can test the UI immediately. | 

## 3. Core Data Schema (Single Source of Truth)

Keep your entire tournament state in a unified JSON structure so it syncs effortlessly across Firebase and `localStorage`:

```json
{
  "organizer": {
    "name": "Local Champions League",
    "hostName": "City Sports Club",
    "logoUrl": "",
    "venue": "Central Turf Arena",
    "mapLink": "https://maps.google.com",
    "contactWhatsApp": "+1234567890",
    "rules": ["7-a-side format", "15-minute halves", "Rolling substitutions"],
    "format": "HYBRID" 
  },
  "captains": [
    { "id": "cap_1", "name": "Shourav", "pin": "1111", "teamId": "team_1", "avatar": "" }
  ],
  "teams": [
    {
      "id": "team_1",
      "name": "Team Shourav",
      "captainId": "cap_1",
      "logo": "⚡",
      "primaryColor": "#10B981",
      "motto": "Strike Fast, Win First",
      "rosterIds": ["plr_1"]
    }
  ],
  "players": [
    {
      "id": "plr_1",
      "name": "Shadman",
      "pin": "0001",
      "position": "MID",
      "rawPositions": ["CM", "ATM"],
      "jerseyNumber": 10,
      "avatar": "",
      "bio": "Playmaker",
      "status": "UNDRAFTED",
      "teamId": null,
      "availability": "AVAILABLE",
      "stats": { "matches": 0, "goals": 0, "assists": 0, "cleanSheets": 0, "mvpCount": 0 }
    }
  ],
  "matches": [
    {
      "id": "m_1",
      "stage": "LEAGUE",
      "round": 1,
      "teamAId": "team_1",
      "teamBId": "team_2",
      "scoreA": 2,
      "scoreB": 1,
      "status": "COMPLETED"
    }
  ],
  "awards": [
    {
      "id": "awd_1",
      "title": "Best Playmaker",
      "icon": "🎯",
      "categoryType": "CUSTOM",
      "winnerPlayerId": "plr_1",
      "statNote": "6 Goal Contributions"
    }
  ]
}
```

## 4. Complete Feature Specifications (All 12 Modules)

### A. Role-Based Panels & Quick-Start Onboarding

1. **Admin Panel (Master PIN):**
   * Edit **Organizer Profile** & tournament rules.
   * Launch the **Smart Bulk Player Dump & Quick-Start Wizard** (paste 12–50 players at once).
   * Add/Edit/Delete individual Players and Captains, or toggle any player into a Captain with 1 click.
   * Control the **Spin the Wheel** draft (or grant temporary spin permission to the active Captain).
   * Generate League/Knockout fixtures and enter live match scores + player match stats.
   * Create, edit, and assign **Dynamic Awards**.

2. **Smart Bulk Player Dump & Quick-Start Wizard (Instant Setup):**
   * **Raw Text Dump Box:** Organizer pastes a messy WhatsApp/Messenger list of 12–50 players (numbered, bulleted, or newline-separated).
   * **Intelligent Line Parser:**
     * Strips leading numbers/bullets (e.g., `1. `, `- `).
     * **Captain Detection:** If a line contains `(captain)`, `(cap)`, or `(c)` (case-insensitive), e.g., `shourav (captain)`, it automatically creates a Captain profile, generates a default team (`Team Shourav`), and assigns a 4-digit PIN.
     * **Multi-Position & Custom Tag Detection:** Extracts anything inside parentheses/brackets like `shadman(CM,ATM)` or `rahim (GK/CB)`. Saves the exact tags (`["CM", "ATM"]`) to display on their badge and maps the primary category (`GK`, `DEF`, `MID`, `FWD`, or `FLEX`) for draft wheel filtering:
       * `GK`, `GOALKEEPER` $\rightarrow$ `GK`
       * `CB`, `LB`, `RB`, `WB`, `DEF`, `DF` $\rightarrow$ `DEF`
       * `CM`, `CDM`, `CAM`, `ATM`, `LM`, `RM`, `MID`, `MF` $\rightarrow$ `MID`
       * `ST`, `CF`, `LW`, `RW`, `FWD`, `ATT` $\rightarrow$ `FWD`
     * **No Position Fallback:** If a line is just a name like `tanvir`, it sets `position: "FLEX"` and `rawPositions: ["ANY"]`.
   * **Interactive Preview & Captain Selector Step:** Before saving, displays a quick preview grid of all parsed players where the Organizer can tap a **"Make Captain" Crown Icon** on any additional players (if captains weren't written in the text) and click **"Start Tournament"** to populate all lists and teams in 1 second.

3. **Captain Panel (Captain Select + 4-Digit PIN):**
   * Edit **Team Name & Basic Details** (badge/emoji, primary jersey color, team motto).
   * Trigger **Spin the Wheel** when it is their active turn in the draft.
   * View drafted squad, see player availability, and toggle starting lineup status.

4. **Player Panel (Player Select + 4-Digit PIN):**
   * Edit personal **Player Profile** (display name, avatar URL, preferred positions, jersey number, short bio).
   * Toggle matchday availability (`Available`, `Injured`, `Doubtful`).
   * View assigned team, captain contact, and upcoming match schedule.

### B. Profiles, Directories & Draft Mechanics

5. **Organizer Profile:**
   * Public banner & modal displaying host name, logo, tournament rules, venue link, and a one-tap contact button.

6. **Player List:**
   * Filterable by broad category (`ALL`, `GK`, `DEF`, `MID`, `FWD`, `FLEX`) or specific sub-position tags (`CM`, `ATM`, etc.) and draft status (`Available` vs. `Drafted`), with search bar.

7. **Captain List:**
   * Cards displaying each Captain, their linked Team badge, current roster count, and a 1-click Admin toggle to promote/demote captains.

8. **Player Profile Card (Modal/View):**
   * FIFA/Sports-style card showing player photo, main position + sub-position pills (e.g., `CM` `ATM`), team affiliation, bio, live tournament stats, and won **Dynamic Awards**.

9. **Team Name & Basic Details View:**
   * Dedicated team page showing custom team name, motto, color theme, Captain badge, full drafted roster, and match history.

10. **Spin the Wheel (Interactive Draft Engine):**
    * HTML5 Canvas roulette wheel populated dynamically with currently `UNDRAFTED` players (filterable by position pot, including `FLEX` / `ANY` players).
    * Selecting an active Captain/Team and spinning the wheel plays a smooth deceleration animation, announces the drafted player in a celebratory modal, and automatically assigns `player.teamId = activeTeam.id` and `player.status = "DRAFTED"`.

### C. Tournament Engine & Dynamic Awards

11. **Championship / League Format:**
    * **League Table:** Automatically computes Played ($P$), Won ($W$), Drawn ($D$), Lost ($L$), Goals For ($GF$), Goals Against ($GA$), Goal Difference ($GD = GF - GA$), and Points ($Pts = (W \times 3) + D$).
    * **Knockout Bracket:** Visual tree for Quarter-Finals, Semi-Finals, and Final that advances winners automatically based on score entry.

12. **Dynamic Awards System (Organizer Customizable):**
    * Organizer can create unlimited custom award slots (e.g., *Best Player, Best GK, Best DEF, Best MID, Playmaker, Top Scorer, Puskas Goal, Fair Play*).
    * Supports both **Auto-Suggestion** and **Manual Override** (Admin selects any player from a dropdown and adds a custom stat note).

## 5. The 3-Phase One-Night Execution Plan

### Phase 1: Core Architecture, Smart Bulk Dump & The 3 Role Panels

**Goal:** Get the app running with full state persistence, the Smart Bulk Player Dump wizard, Organizer Profile, and PIN-protected Admin, Captain, and Player panels.

* **Recommended Models:** `Claude Opus 4.6 (Thinking)` for architecture, state store & regex parser $\rightarrow$ `Gemini 3.8 Flash High` for panel UIs.
* **Checklist:**
  * [ ] Initialize React + Tailwind CSS + Lucide Icons in the workspace.
  * [ ] Create `TournamentContext.jsx` with full CRUD actions and the **Smart Bulk Parser function** that parses raw text lines like `shourav (captain)`, `shadman(CM,ATM)`, or plain names into structured Captains, Teams, and Players.
  * [ ] Build the **Quick-Start Bulk Dump Modal** inside the Admin Panel with a live preview table where the Organizer can also click a Crown button to toggle Captains before confirming.
  * [ ] Build the top Navigation Bar with Role Switcher (`Public Hub`, `Player Panel`, `Captain Panel`, `Admin Panel`) and 4-digit PIN modal.
  * [ ] Build the **Organizer Profile** header, **Player Panel**, and **Captain Panel**.

> **Copy-Paste Prompt for Antigravity (Phase 1):**
> `@tournament_blueprint.md Build Phase 1 of the Mini Tournament App using React, Tailwind CSS, and Lucide icons. Implement the complete TournamentContext state store using Section 3's schema with localStorage persistence. Crucially, implement the 'Smart Bulk Player Dump & Quick-Start Wizard' from Module 2 so an organizer can paste a 12-50 player text list like 'shourav (captain)', 'shadman(CM,ATM)', or plain names without positions, preview the parsed list, toggle captains with one click, and auto-generate teams and PINs. Also build the Navigation bar, Organizer Profile view, and the PIN-protected Admin, Captain, and Player Panels.`

### Phase 2: Directories, Profiles & Interactive "Spin the Wheel" Draft

**Goal:** Build the public directories, rich Player/Team views, and the centerpiece animated Draft Wheel that assigns players to captains.

* **Recommended Models:** `Claude Sonnet 4.6 (Thinking)` for the Spin the Wheel canvas component $\rightarrow$ `Gemini 3.8 Flash High` for Player/Captain/Team cards.
* **Checklist:**
  * [ ] Build the **Player List** with position filters (`ALL`, `GK`, `DEF`, `MID`, `FWD`, `FLEX`), sub-position badges (`CM`, `ATM`), draft status filter, and clickable **Player Profile** modal.
  * [ ] Build the **Captain List** & **Team Details View** showing team colors, captain badge, motto, and current squad list.
  * [ ] Build the **Spin the Wheel** component using HTML5 `<canvas>` with smooth easing animation.
  * [ ] Add a "Select Active Captain" selector and "Position Pot Filter" above the wheel so when the wheel stops on a player, a "Confirm Draft Pick" button immediately assigns that player to the Captain's team roster.

> **Copy-Paste Prompt for Antigravity (Phase 2):**
> `@tournament_blueprint.md Build Phase 2. Create the filterable Player List (showing both main categories and raw sub-position badges like CM, ATM, or FLEX), Captain List, Team Details view, and the FIFA-style Player Profile modal. Then build the interactive 'Spin the Wheel' Draft module: allow the Admin or active Captain to filter undrafted players by position pot, spin an animated colorful wheel, and automatically assign the winning player to the selected Captain's team roster.`

### Phase 3: Championship Engine, Dynamic Awards & GitHub Pages Deployment

**Goal:** Complete the tournament lifecycle with fixture generation, live standings, knockout brackets, customizable awards, and one-command GitHub Pages hosting.

* **Recommended Models:** `Claude Sonnet 4.6 (Thinking)` for bracket/standings logic $\rightarrow$ `Gemini 3.8 Flash High` for Dynamic Awards UI and deployment config.
* **Checklist:**
  * [ ] Build the **Match Generator & Scoreboard**: One-click button in Admin Panel to generate Round-Robin League fixtures or Knockout matchups based on the created teams, plus live score inputs.
  * [ ] Build the **Championship / League View**: Auto-sorted League Standings table ($P, W, D, L, GF, GA, GD, Pts$) and visual Knockout Bracket tree.
  * [ ] Build the **Dynamic Awards System**: In the Admin Panel, allow the organizer to create/delete custom awards (pre-loaded with *Best Player, Best GK, Best DEF, Best MID, Playmaker, Top Scorer*), assign a winning player, and render a public "Trophy Room" grid.
  * [ ] Add JSON Export/Import state sharing + optional Firebase Realtime DB sync, configure `vite.config.js` `base` path, and deploy to GitHub Pages.

> **Copy-Paste Prompt for Antigravity (Phase 3):**
> `@tournament_blueprint.md Build Phase 3. Implement the Championship & League engine with a round-robin fixture generator, live Admin score entry, auto-calculated League Standings table, and a visual Knockout Bracket view. Next, build the Dynamic Awards System where the Organizer can add custom awards (Best Player, GK, DEF, MID, Playmaker, Top Scorer, etc.), link them to winning players, and display them in a public Trophy Room. Finally, configure the project for GitHub Pages deployment.`