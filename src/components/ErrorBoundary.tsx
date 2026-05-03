import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-slate-950 text-white p-6 text-center overflow-auto">
          <h1 className="text-2xl font-bold mb-4">System Anomaly Detected</h1>
          <p className="mb-6 text-slate-400">The core interface has encountered an error. Please re-initialize.</p>
          <div className="w-full max-w-4xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-mono text-left overflow-auto max-h-96 custom-scrollbar whitespace-pre-wrap">
            <div className="mb-2 font-bold text-red-300">Error Message:</div>
            <div className="mb-4">
              {this.state.error?.message && this.state.error.message.startsWith('{') ? (
                <pre>{JSON.stringify(JSON.parse(this.state.error.message), null, 2)}</pre>
              ) : (
                <p>{this.state.error?.message || 'Unknown error'}</p>
              )}
            </div>

            {this.state.error?.stack && (
              <>
                <div className="mb-2 font-bold text-red-300">Stack Trace:</div>
                <div className="mb-4">{this.state.error.stack}</div>
              </>
            )}

            {this.state.errorInfo?.componentStack && (
              <>
                <div className="mb-2 font-bold text-red-300">Component Stack:</div>
                <div>{this.state.errorInfo.componentStack}</div>
              </>
            )}
          </div>
          <button 
            aria-label="Re-initialize Core"
            className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-slate-200 transition-all focus-visible:ring-4 focus-visible:ring-cyan-500/50 focus-visible:outline-none"
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
