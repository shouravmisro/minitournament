import React, { useState, useEffect } from 'react';
import {
  Cloud, CloudOff, Check, AlertCircle, Copy, ExternalLink,
  RefreshCw, UploadCloud, X, Shield, Sparkles
} from 'lucide-react';
import {
  getFirebaseConfig, saveFirebaseConfig, initFirebase,
  getDb, pushAllLocalToCloud
} from '../services/firebase';
import { useGlobal, useOrganizer } from '../context/GlobalContext';
import { useTournament } from '../context/TournamentContext';

export default function FirebaseSyncModal({ onClose }) {
  const { global } = useGlobal();
  const { organizer } = useOrganizer();
  const { state: tournamentState } = useTournament();

  const [currentConfig, setCurrentConfig] = useState(getFirebaseConfig);
  const [configInput, setConfigInput] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const isConnected = Boolean(currentConfig?.apiKey && currentConfig?.projectId);

  function parseConfigString(text) {
    const clean = text.trim();
    // 1. Try parsing JSON directly
    try {
      const parsed = JSON.parse(clean);
      if (parsed.apiKey && parsed.projectId) return parsed;
    } catch {}

    // 2. Try regex extraction from JS code (e.g. const firebaseConfig = { ... })
    const extractField = (key) => {
      const match = clean.match(new RegExp(`['"]?${key}['"]?\\s*:\\s*['"]([^'"]+)['"]`, 'i'));
      return match ? match[1] : '';
    };

    const apiKey = extractField('apiKey');
    const projectId = extractField('projectId');
    const authDomain = extractField('authDomain');
    const storageBucket = extractField('storageBucket');
    const messagingSenderId = extractField('messagingSenderId');
    const appId = extractField('appId');

    if (apiKey && projectId) {
      return { apiKey, projectId, authDomain, storageBucket, messagingSenderId, appId };
    }
    return null;
  }

  function handleConnect() {
    setErrorMessage('');
    setStatusMessage('');

    if (!configInput.trim()) {
      setErrorMessage('Please paste your Firebase configuration.');
      return;
    }

    const parsed = parseConfigString(configInput);
    if (!parsed) {
      setErrorMessage('Could not extract Firebase config. Please paste the full firebaseConfig object.');
      return;
    }

    try {
      saveFirebaseConfig(parsed);
      const res = initFirebase(parsed);
      if (res) {
        setCurrentConfig(parsed);
        setStatusMessage('Firebase connected successfully! Initializing live sync...');
        setTimeout(() => {
          handleUploadLocalData();
        }, 800);
      } else {
        setErrorMessage('Failed to initialize Firebase with the provided configuration.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Connection error.');
    }
  }

  async function handleUploadLocalData() {
    setIsSyncing(true);
    setStatusMessage('');
    setErrorMessage('');
    try {
      await pushAllLocalToCloud(
        global.activeTournamentId,
        tournamentState,
        global,
        organizer
      );
      setStatusMessage('All local tournaments, teams, players & matches synced to Cloud! Everyone opening the link will now see live data.');
    } catch (err) {
      setErrorMessage('Upload error: ' + (err.message || 'Make sure Firestore is in test mode with read/write enabled.'));
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[#050814]/85 backdrop-blur-md z-[200] flex items-center justify-center p-3 sm:p-4">
      <div className="sketch-border bg-[#0b132b] rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-amber-50">
        {/* Header */}
        <div className="px-5 py-4 border-b border-amber-900/30 border-dashed flex items-center justify-between shrink-0 bg-[#050814]/80">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-[#050814] text-amber-500/60 border border-amber-900/40'}`}>
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl text-amber-200">Firebase Cloud Live Sync</h3>
              <p className="text-xs text-amber-500/60">Share your tournament live with friends on any device</p>
            </div>
          </div>
          <button onClick={onClose} className="text-amber-500/60 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Connection Status Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
            isConnected
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-[#050814]/60 border-amber-900/30'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
              <div>
                <p className="font-serif text-sm font-bold text-amber-100">
                  {isConnected ? 'Cloud Live Sync Active' : 'Standalone Offline Mode'}
                </p>
                <p className="text-xs text-amber-500/60">
                  {isConnected
                    ? `Project: ${currentConfig.projectId} • Realtime updates enabled`
                    : 'Data is stored only in this browser (localStorage)'}
                </p>
              </div>
            </div>
          </div>

          {statusMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sync actions if connected */}
          {isConnected ? (
            <div className="bg-[#050814]/40 border border-amber-900/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Multi-Device Cloud Sync
                  </p>
                  <p className="text-[11px] text-amber-500/60 mt-0.5">
                    Any score, goal, rating, or roster change is instantly pushed to Firebase Firestore.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleUploadLocalData}
                disabled={isSyncing}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all disabled:opacity-50"
              >
                <UploadCloud className="w-4 h-4" />
                {isSyncing ? 'Syncing with Cloud...' : 'Push All Local Tournaments to Cloud'}
              </button>
            </div>
          ) : (
            /* Connect Form */
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-amber-100 block mb-1">
                  Paste your Firebase Configuration
                </label>
                <textarea
                  rows={6}
                  value={configInput}
                  onChange={e => setConfigInput(e.target.value)}
                  placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "my-tourney.firebaseapp.com",\n  projectId: "my-tourney",\n  storageBucket: "my-tourney.appspot.com",\n  messagingSenderId: "...",\n  appId: "..."\n};`}
                  className="w-full bg-gray-950 border border-amber-900/40 rounded-xl p-3 text-xs font-mono text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="button"
                onClick={handleConnect}
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-950 flex items-center justify-center gap-2 transition-all"
              >
                <Cloud className="w-4 h-4" /> Connect & Start Live Cloud Sync
              </button>
            </div>
          )}

          {/* Quick Setup Instructions Accordion */}
          <div className="border-t border-amber-900/30 border-dashed pt-3">
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <span>{showInstructions ? 'Hide setup instructions' : 'How to get free Firebase Config (3 minutes)'}</span>
            </button>

            {showInstructions && (
              <div className="mt-2.5 p-3.5 bg-gray-950 rounded-xl border border-amber-900/30 border-dashed text-xs text-amber-100 space-y-2">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" /> Free Setup Steps:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-amber-500/60 text-[11px]">
                  <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">console.firebase.google.com</a> and click <strong>"Add project"</strong> (100% Free).</li>
                  <li>Click the Web icon <strong>(&lt;/&gt;)</strong> to register an app. Copy the <code>firebaseConfig</code> code snippet.</li>
                  <li>In the left sidebar, click <strong>Build → Firestore Database</strong> → <strong>Create database</strong>.</li>
                  <li>Choose <strong>"Start in test mode"</strong> (allows public read/write by you and friends) and click Enable.</li>
                  <li>Paste the config above and click <strong>"Connect & Start Live Cloud Sync"</strong>!</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-amber-900/30 border-dashed bg-gray-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#050814] hover:bg-[#0b132b] text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

