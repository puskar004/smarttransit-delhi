import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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
    console.error('Transit UI Error caught by boundary:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#07090e] text-white font-sans select-none">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-[#0e1118] border border-[#f59e0b]/50 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#f59e0b]/15 text-[#f59e0b] flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-black uppercase tracking-tight text-white">
                {this.props.fallbackTitle || 'Delhi Transit System Recovery'}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                A temporary rendering conflict occurred while synchronizing live GPS telemetry.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#141824] border border-[#232b3d] text-[11px] font-mono text-slate-400 text-left overflow-x-auto max-h-24">
              {this.state.error?.message || 'Unexpected state synchronization exception'}
            </div>

            <button
              type="button"
              onClick={this.handleReload}
              className="w-full py-3 rounded-xl bg-[#CCFF00] hover:bg-[#d8ff33] text-black font-sans font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm active:scale-95"
            >
              <RefreshCw className="w-4 h-4 stroke-[2.5]" />
              <span>Reload Transit Session</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
