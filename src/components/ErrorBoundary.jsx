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
        <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-900 border border-red-500/30 rounded-2xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Application Notice</h2>
              <p className="text-xs text-gray-400 mt-1">
                A rendering issue was prevented from breaking your session.
              </p>
            </div>
            <div className="text-xs text-red-300 font-mono bg-gray-950 p-3 rounded-xl border border-gray-800 text-left overflow-x-auto max-h-32">
              {this.state.error?.message || 'Unknown render exception'}
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try Again
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '';
                  window.location.reload();
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-amber-950"
              >
                <Home className="w-3.5 h-3.5" /> Reload Hub
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
