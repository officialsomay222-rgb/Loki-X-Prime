import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
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
          <button 
            className="px-6 py-3 bg-cyan-600 rounded-xl font-bold hover:bg-cyan-500 transition-all"
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
