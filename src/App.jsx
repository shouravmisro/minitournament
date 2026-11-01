import React, { useState } from 'react';
import { GlobalProvider, useGlobal } from './context/GlobalContext';
import { TournamentProvider } from './context/TournamentContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar            from './components/Navbar';
import TournamentManager from './components/TournamentManager';
import ErrorBoundary     from './components/ErrorBoundary';
import PublicHub         from './components/PublicHub';
import AdminPanel        from './components/AdminPanel';
import CaptainPanel      from './components/CaptainPanel';
import PlayerPanel       from './components/PlayerPanel';
import PlayerList        from './components/PlayerList';
import CaptainList       from './components/CaptainList';
import AuctionDraft      from './components/AuctionDraft';
import MatchEngine       from './components/MatchEngine';
import LeagueStandings   from './components/LeagueStandings';
import KnockoutBracket   from './components/KnockoutBracket';
import AwardsSystem      from './components/AwardsSystem';
import {
  Home, Users, Crown, Dices, Shield, User,
  Trophy, GitBranch, Calendar, TrendingUp,
} from 'lucide-react';

/* ── UI Upgraded Championship view ── */
function ChampionshipView() {
  const [subTab, setSubTab] = useState('standings');
  const SUB = [
    { id: 'standings', label: 'Standings', icon: TrendingUp },
    { id: 'fixtures',  label: 'Fixtures',  icon: Calendar   },
    { id: 'bracket',   label: 'Knockout',  icon: GitBranch  },
  ];
  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1.5 sketch-border rounded-2xl w-fit mx-auto sm:mx-0 shadow-lg" style={{ borderRadius: '1rem' }}>
        {SUB.map(s => {
          const Icon = s.icon;
          const isActive = subTab === s.id;
          return (
            <button key={s.id} onClick={() => setSubTab(s.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-serif tracking-wide transition-all ${
                isActive 
                  ? 'bg-amber-900/40 text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(217,119,6,0.2)]' 
                  : 'text-amber-100/50 hover:text-amber-200 hover:bg-[#0b132b]/50'
              }`}>
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>
      <div className="animate-in fade-in duration-500">
        {subTab === 'standings' && <LeagueStandings />}
        {subTab === 'fixtures'  && <MatchEngine />}
        {subTab === 'bracket'   && <KnockoutBracket />}
      </div>
    </div>
  );
}

/* ── Tab definitions per role ── */
const PUBLIC_TABS = [
  { id: 'hub',          label: 'Hub',          icon: Home       },
  { id: 'players',      label: 'Players',      icon: Users      },
  { id: 'captains',     label: 'Teams',        icon: Crown      },
  { id: 'championship', label: 'Championship', icon: TrendingUp },
  { id: 'trophy',       label: 'Trophies',     icon: Trophy     },
];
const ADMIN_TABS = [
  { id: 'admin',        label: 'Admin',        icon: Shield     },
  { id: 'players',      label: 'Players',      icon: Users      },
  { id: 'captains',     label: 'Teams',        icon: Crown      },
  { id: 'draft',        label: 'Draft',        icon: Dices      },
  { id: 'championship', label: 'Championship', icon: TrendingUp },
  { id: 'awards',       label: 'Awards',       icon: Trophy     },
];
const CAPTAIN_TABS = [
  { id: 'captain',      label: 'My Team',      icon: Crown      },
  { id: 'players',      label: 'Players',      icon: Users      },
  { id: 'draft',        label: 'Draft',        icon: Dices      },
  { id: 'championship', label: 'Championship', icon: TrendingUp },
];
const PLAYER_TABS = [
  { id: 'player',       label: 'Profile',      icon: User       },
  { id: 'players',      label: 'Players',      icon: Users      },
  { id: 'captains',     label: 'Teams',        icon: Crown      },
  { id: 'championship', label: 'Championship', icon: TrendingUp },
  { id: 'trophy',       label: 'Trophies',     icon: Trophy     },
];

/* ── UI Upgraded TabBar ── */
function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex border-b border-amber-900/40 mb-8 pb-2 overflow-x-auto scrollbar-none gap-6 sm:gap-8 pt-2">
      {tabs.map(t => {
        const Icon     = t.icon;
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)}
            className={`nav-button flex items-center gap-2 pb-2 text-sm sm:text-base font-serif tracking-widest uppercase whitespace-nowrap shrink-0 ${
              isActive
                ? 'active'
                : 'text-amber-100/50 hover:text-amber-200'
            }`}
          >
            <Icon className="w-4 h-4 mb-0.5" />
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AppContent() {
  const { role } = useAuth();
  const [tab, setTab] = useState('hub');

  React.useEffect(() => {
    const defaults = { PUBLIC: 'hub', ADMIN: 'admin', CAPTAIN: 'captain', PLAYER: 'player' };
    setTab(defaults[role] ?? 'hub');
  }, [role]);

  const tabs =
    role === 'ADMIN'   ? ADMIN_TABS   :
    role === 'CAPTAIN' ? CAPTAIN_TABS :
    role === 'PLAYER'  ? PLAYER_TABS  :
                         PUBLIC_TABS;

  function renderContent() {
    switch (tab) {
      case 'hub':          return <PublicHub       />;
      case 'admin':        return <AdminPanel       />;
      case 'captain':      return <CaptainPanel     />;
      case 'player':       return <PlayerPanel      />;
      case 'players':      return <PlayerList       />;
      case 'captains':     return <CaptainList      />;
      case 'draft':        return <AuctionDraft     />;
      case 'championship': return <ChampionshipView />;
      case 'awards':       return <AwardsSystem     />;
      case 'trophy':       return <AwardsSystem publicView />;
      default:             return null;
    }
  }

  return (
    <div className="relative min-h-screen bg-[#050814] overflow-x-hidden text-amber-50 font-sans selection:bg-amber-700/50">
      
      {/* Background Layers */}
      <div className="canvas-noise" />
      <div className="fixed inset-0 bg-gradient-to-br from-[#050814] via-[#0b132b] to-[#171433] z-0 pointer-events-none" />
      
      {/* Turbulent Orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-amber-500/10 rounded-full blur-[100px] bg-starry-1 mix-blend-screen pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-600/15 rounded-[40%_60%_70%_30%] blur-[120px] bg-starry-2 mix-blend-screen pointer-events-none z-0" />

      {/* Main UI Wrapper */}
      <div className="relative z-20 flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pt-6 pb-20">
          <TabBar tabs={tabs} active={tab} onChange={setTab} />
          
          <div className="animate-in fade-in duration-700">
            {renderContent()}
          </div>
        </main>

        <footer className="border-t border-amber-900/30 py-6 text-center bg-[#050814]/50 backdrop-blur-sm">
          <p className="text-[10px] font-mono tracking-widest uppercase text-amber-500/60">
            The Codex Arena • FC Chompa Premier League
          </p>
        </footer>
      </div>
    </div>
  );
}

/* ── Router ── */
function AppRouter() {
  const { global } = useGlobal();

  if (global.showManager) {
    return (
      <ErrorBoundary>
        <TournamentManager />
      </ErrorBoundary>
    );
  }

  const activeId = global.activeTournamentId || (global.tournaments?.[0]?.id) || 't_mvwya9yi';

  return (
    <TournamentProvider key={activeId} storageKey={`mt_state_${activeId}`}>
      <AuthProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AuthProvider>
    </TournamentProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GlobalProvider>
        <AppRouter />
      </GlobalProvider>
    </ErrorBoundary>
  );
}
