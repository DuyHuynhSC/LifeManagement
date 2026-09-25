import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
    console.error('Uncaught error in React tree:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/30">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-lg font-black text-white mb-2">Đã có lỗi xảy ra</h2>
          <p className="text-xs text-slate-300 max-w-sm mb-4 leading-relaxed">
            {this.state.error?.message || 'Ứng dụng gặp sự cố không mong muốn.'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition active:scale-95"
          >
            <RefreshCw size={14} />
            <span>Tải lại ứng dụng</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
