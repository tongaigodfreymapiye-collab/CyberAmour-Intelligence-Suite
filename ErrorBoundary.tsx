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
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cyber-bg flex items-center justify-center p-6 text-center">
          <div className="glass-card p-8 max-w-md space-y-4">
            <h2 className="text-2xl font-bold text-red-400">Something went wrong</h2>
            <p className="text-slate-400 text-sm">
              An unexpected error occurred. Our security systems are looking into it.
            </p>
            <pre className="text-[10px] text-slate-600 bg-black/30 p-4 rounded-xl overflow-auto max-h-32 text-left">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-cyber-purple text-white font-bold rounded-xl"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
