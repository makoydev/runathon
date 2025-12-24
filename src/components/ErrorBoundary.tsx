import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-gradient-to-br from-rose-50 via-sky-50 to-violet-50 py-8 px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-6xl mb-4" role="img" aria-label="Warning">
                ⚠️
              </div>
              <h1 className="text-2xl font-bold text-slate-700 mb-2">
                Something went wrong
              </h1>
              <p className="text-slate-500 mb-6">
                An unexpected error occurred. Please try again.
              </p>
              {this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-600">
                    Error details
                  </summary>
                  <pre className="mt-2 p-3 bg-slate-100 rounded-lg text-xs text-slate-600 overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <button
                onClick={this.handleReset}
                aria-label="Try again and reset the application"
                className="px-6 py-3 bg-gradient-to-r from-violet-400 to-sky-400 hover:from-violet-500 hover:to-sky-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
