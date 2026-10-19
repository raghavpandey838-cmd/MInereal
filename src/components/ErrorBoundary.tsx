/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Minecraft Uncaught Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetData = () => {
    try {
      localStorage.removeItem('mc_save_world');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-[#121212] text-white flex flex-col items-center justify-center p-6 z-50 select-none">
          <div className="max-w-md w-full bg-[#202020] border-4 border-[#3c3c3c] p-6 shadow-2xl text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-400 tracking-wider">GAME CRASHED</h1>
            <p className="text-sm text-gray-300">
              Minecraft Web Edition encountered an unexpected error during execution.
            </p>
            {this.state.error && (
              <div className="bg-[#111] p-3 rounded text-left font-mono text-xs text-red-300 overflow-x-auto max-h-32 border border-red-900/50">
                {this.state.error.message}
              </div>
            )}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={this.handleReload}
                className="w-full py-2.5 bg-[#4c4c4c] hover:bg-[#5c5c5c] text-white font-bold border-2 border-b-4 border-r-4 border-black active:border-2 text-sm transition"
              >
                Reload Game
              </button>
              <button
                onClick={this.handleResetData}
                className="w-full py-2 bg-[#2f2f2f] hover:bg-red-900/40 text-gray-300 hover:text-red-300 border border-gray-700 text-xs transition"
              >
                Clear Saved World & Restart
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
