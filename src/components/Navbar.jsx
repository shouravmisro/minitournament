import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import { useGlobal, useOrganizer } from '../context/GlobalContext';
import {
  Trophy, Shield, Users, User, Menu, X, LogOut, Lock,
  Crown, Home, ChevronLeft, Settings, Cloud,
} from 'lucide-react';
import { isFirebaseConfigured } from '../services/firebase';
import FirebaseSyncModal from './FirebaseSyncModal';

export default function Navbar() {
  const { state }                      = useTournament();
  const { role, logout, login }        = useAuth();
  const { global, deselectTournament } = useGlobal();
  const { organizer }                  = useOrganizer();

  const [menuOpen,        setMenuOpen]        = useState(false);
  const [pinModal,        setPinModal]        = useState(null);
  const [pinInput,        setPinInput]        = useState('');
  const [pinError,        setPinError]        = useState('');
  const [selectList,      setSelectList]      = useState(null);
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [showCloudModal,  setShowCloudModal]  = useState(false);

  const roleBadge = {
    PUBLIC:  { label: 'Public Hub',    icon: Home,   color: 'bg-gray-600'  },
    ADMIN:   { label: 'Admin Panel',   icon: Shield, color: 'bg-red-600'   },
    CAPTAIN: { label: 'Captain Panel', icon: Crown,  color: 'bg-amber-600' },
    PLAYER:  { label: 'Player Panel',  icon: User,   color: 'bg-blue-600'  },
  };

  const current = roleBadge[role];
  const RoleIcon = current.icon;

  // Active tournament meta
  const activeTournament = global.tournaments.find(t => t.id === global.activeTournamentId);
  const tournamentName   = activeTournament?.name || state.organizer?.name || 'Mini Tournament';
  const hasCloud = isFirebaseConfigured();

  function handlePinSubmit(targetRole, entityId = null) {
    setPinError('');
    if (targetRole === 'ADMIN') {
      if (pinInput === state.adminPin) { login('ADMIN'); closePinModal(); }
      else setPinError('Invalid Admin PIN');
    } else if (targetRole === 'CAPTAIN') {
      const cap = state.captains.find(c => c.id === entityId);
      if (cap && pinInput === cap.pin) { login('CAPTAIN', cap.id); closePinModal(); }
      else setPinError('Invalid Captain PIN');
    } else if (targetRole === 'PLAYER') {
      const plr = state.players.find(p => p.id === entityId);
      if (plr && pinInput === plr.pin) { login('PLAYER', plr.id); closePinModal(); }
      else setPinError('Invalid Player PIN');
    }
  }

  function closePinModal() {
    setPinModal(null);
    setPinInput('');
    setPinError('');
    setSelectList(null);
    setSelectedEntityId(null);
  }

  function openRoleLogin(targetRole) {
    setMenuOpen(false);
    if (targetRole === 'PUBLIC') { login('PUBLIC'); return; }
    if (targetRole === 'ADMIN')  { setPinModal('ADMIN'); return; }
    if (targetRole === 'CAPTAIN') {
      setSelectList({ role: 'CAPTAIN', items: state.captains });
      setPinModal('CAPTAIN');
      return;
    }
    if (targetRole === 'PLAYER') {
      setSelectList({ role: 'PLAYER', items: state.players });
      setPinModal('PLAYER');
      return;
    }
  }

  function handleBack() {
    setMenuOpen(false);
    logout();             // reset auth role to PUBLIC before leaving
    deselectTournament();
  }

  return (
    <>
      {/* ── Navbar ── */}
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">

          {/* Left: Back + Logo */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <button
              onClick={handleBack}
              title="All Tournaments"
              className="flex items-center gap-1 text-gray-400 hover:text-amber-400 transition-colors shrink-0 p-1 rounded-lg hover:bg-gray-800"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-medium">Tournaments</span>
            </button>

            <div className="flex items-center gap-1.5 min-w-0">
              <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-white text-sm truncate leading-none">
                  {tournamentName}
                </p>
                {organizer.name && (
                  <p className="text-xs text-gray-500 truncate leading-none">{organizer.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Centre: Role Badge */}
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-medium ${current.color} shrink-0`}>
            <RoleIcon className="w-3.5 h-3.5" />
            <span>{current.label}</span>
          </div>

          {/* Right: Cloud Sync Pill + Logout + Menu */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Cloud Sync Status Indicator */}
            <button
              onClick={() => setShowCloudModal(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                hasCloud
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white hover:bg-gray-700'
              }`}
              title={hasCloud ? 'Firebase Live Sync Active' : 'Configure Cloud Sync'}
            >
              <Cloud className={`w-3.5 h-3.5 ${hasCloud ? 'text-emerald-400 animate-pulse' : 'text-gray-400'}`} />
              <span className="hidden sm:inline text-[11px]">
                {hasCloud ? 'Live Sync' : 'Cloud Sync'}
              </span>
            </button>

            {role !== 'PUBLIC' && (
              <button
                onClick={logout}
                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile role badge */}
        <div className={`sm:hidden px-4 pb-2 flex items-center justify-between`}>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-xs font-medium ${current.color}`}>
            <RoleIcon className="w-3 h-3" />
            <span>{current.label}</span>
          </div>

          <button
            onClick={() => setShowCloudModal(true)}
            className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1"
          >
            <Cloud className="w-3 h-3 text-emerald-400" />
            <span>{hasCloud ? 'Cloud Live' : 'Setup Cloud'}</span>
          </button>
        </div>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="border-t border-gray-800 bg-gray-900 px-4 py-3 space-y-1">
            <p className="text-xs text-gray-600 uppercase tracking-wider font-medium px-3 pb-1">Switch Role</p>
            {(['PUBLIC', 'PLAYER', 'CAPTAIN', 'ADMIN']).map(r => {
              const badge  = roleBadge[r];
              const BIcon  = badge.icon;
              const isActive = role === r;
              return (
                <button
                  key={r}
                  onClick={() => openRoleLogin(r)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <BIcon className="w-4 h-4" />
                  {badge.label}
                  {r !== 'PUBLIC' && <Lock className="w-3 h-3 ml-auto text-gray-500" />}
                </button>
              );
            })}
            <div className="border-t border-gray-800 my-1" />
            <button
              onClick={() => { setMenuOpen(false); setShowCloudModal(true); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-400 hover:bg-gray-800 transition-colors"
            >
              <Cloud className="w-4 h-4" />
              Firebase Cloud Live Sync
            </button>
            <button
              onClick={handleBack}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to All Tournaments
            </button>
          </div>
        )}
      </nav>

      {/* ── PIN Modal ── */}
      {pinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                {pinModal === 'ADMIN' ? 'Admin Login' : pinModal === 'CAPTAIN' ? 'Captain Login' : 'Player Login'}
              </h3>
              <button onClick={closePinModal} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Entity selector */}
            {selectList && (
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium">Select your name:</label>
                <select
                  value={selectedEntityId || ''}
                  onChange={e => setSelectedEntityId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm"
                >
                  <option value="">-- Choose from roster --</option>
                  {selectList.items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} {item.position ? `(${item.position})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* PIN input */}
            <form onSubmit={e => { e.preventDefault(); handlePinSubmit(pinModal, selectedEntityId); }} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 font-medium">Enter 4-Digit PIN:</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  placeholder="••••"
                  autoFocus
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-center text-2xl tracking-widest font-mono"
                />
              </div>

              {pinError && (
                <p className="text-sm text-red-400 text-center">{pinError}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closePinModal}
                  className="flex-1 py-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pinInput.length !== 4 || (selectList && !selectedEntityId)}
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-sm font-bold"
                >
                  Enter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cloud Sync Modal */}
      {showCloudModal && (
        <FirebaseSyncModal onClose={() => setShowCloudModal(false)} />
      )}
    </>
  );
}
