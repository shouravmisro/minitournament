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

/* ── Combined Championship view ── */
function ChampionshipView() {
  const [subTab, setSubTab] = useState('standings');
  const SUB = [
    { id: 'standings', label: 'Standings', icon: TrendingUp },
    { id: 'fixtures',  label: 'Fixtures',  icon: Calendar   },
    { id: 'bracket',   label: 'Knockout',  icon: GitBranch  },
  ];
  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-gray-800/60 rounded-xl w-fit">
        {SUB.map(s => {
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setSubTab(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                subTab === s.id ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>
      {subTab === 'standings' && <LeagueStandings />}
      {subTab === 'fixtures'  && <MatchEngine />}
      {subTab === 'bracket'   && <KnockoutBracket />}
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

function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex border-b border-gray-800 mb-6 overflow-x-auto scrollbar-none">
      {tabs.map(t => {
        const Icon     = t.icon;
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all shrink-0 ${
              isActive
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{t.label}</span>
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
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 pt-5 pb-16">
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
        {renderContent()}
      </main>
      <footer className="border-t border-gray-800/60 py-5 text-center">
        <p className="text-xs text-gray-700">
          Mini Tournament App • React + Tailwind CSS + Lucide Icons
        </p>
      </footer>
    </div>
  );
}

/* ── Router: shows TournamentManager when no active tournament ── */
function AppRouter() {
  const { global } = useGlobal();

  if (!global.activeTournamentId) {
    return (
      <ErrorBoundary>
        <TournamentManager />
      </ErrorBoundary>
    );
  }

  return (
    // key prop forces TournamentProvider to remount (fresh localStorage load) on tournament switch
    <TournamentProvider
      key={global.activeTournamentId}
      storageKey={`mt_state_${global.activeTournamentId}`}
    >
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
