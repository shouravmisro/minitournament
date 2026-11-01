import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050814] text-amber-50 flex items-center justify-center p-4 relative overflow-hidden">
          <div className="canvas-noise" />
          <div className="fixed inset-0 bg-gradient-to-br from-[#050814] via-[#0b132b] to-[#171433] z-0 pointer-events-none" />

          <div className="max-w-md w-full sketch-border bg-[#0b132b] rounded-2xl p-6 text-center shadow-2xl space-y-5 relative z-10">
            <div className="w-14 h-14 bg-red-950/40 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-serif text-amber-200">The Scribe's Notice</h2>
              <p className="text-xs font-serif text-amber-500/60 mt-1">
                A rendering disruption in the Codex was caught safely.
              </p>
            </div>
            <div className="text-xs text-red-300 font-mono bg-[#050814] p-3 rounded-xl border border-red-900/40 text-left overflow-x-auto max-h-32">
              {this.state.error?.message || 'Unknown render exception'}
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2.5 bg-[#050814] hover:bg-amber-950/40 border border-amber-700/40 text-amber-300 rounded-xl text-xs font-serif flex items-center gap-2 transition-all shadow-[0_0_8px_rgba(217,119,6,0.1)]"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try Again
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '';
                  window.location.reload();
                }}
                className="px-5 py-2.5 bg-[#050814] border border-amber-500/60 text-amber-200 hover:bg-amber-900/40 rounded-xl text-xs font-serif font-bold flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(217,119,6,0.25)]"
              >
                <Home className="w-3.5 h-3.5" /> Return to Hub
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
