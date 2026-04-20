import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-slate-950 text-white p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">System Anomaly Detected</h1>
          <p className="mb-6 text-slate-400">The core interface has encountered an error. Please re-initialize.</p>
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-mono text-left overflow-auto max-h-40 custom-scrollbar">
            {this.state.error?.message && this.state.error.message.startsWith('{') ? (
              <pre>{JSON.stringify(JSON.parse(this.state.error.message), null, 2)}</pre>
            ) : (
              <p>{this.state.error?.message || 'Unknown error'}</p>
            )}
          </div>
          <button 
            className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-slate-200 transition-all"
            onClick={() => window.location.reload()}
          >
            RE-INITIALIZE CORE
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
