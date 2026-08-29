import React, { Component, ReactNode, ErrorInfo } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught AfriChat React Error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('africhat_theme');
      localStorage.removeItem('africhat_ad_settings');
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-stone-950 text-stone-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <h2 className="text-lg font-black text-white">AfriChat Connect</h2>
            <p className="text-xs text-stone-400">
              Une interruption temporaire a été interceptée. Cliquez sur le bouton ci-dessous pour recharger immédiatement l'interface.
            </p>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-stone-950 text-left font-mono text-[11px] text-rose-400/90 max-h-28 overflow-y-auto border border-stone-800">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg hover:brightness-110 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recharger l'application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}



