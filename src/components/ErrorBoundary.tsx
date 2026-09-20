import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected verification error occurred.',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[NIRIKSHAK Error Boundary Caught]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6 text-[#2D322E]">
          <div className="max-w-md w-full bg-white border border-[#E7E3DC] rounded-2xl p-7 shadow-sm text-center">
            <div className="w-12 h-12 rounded-xl bg-[#FAECE7] text-[#9E432A] flex items-center justify-center mx-auto mb-4 border border-[#F7D0C4]">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold font-serif text-[#2D322E]">Inspection Session Interrupted</h2>
            <p className="text-xs text-[#535953] mt-2 leading-relaxed">
              Something went wrong loading this verification view. Your recorded data has been safely preserved in local storage.
            </p>
            <div className="mt-4 p-3 bg-[#FAF8F5] border border-[#E7E3DC] rounded-lg text-left font-mono text-xs text-[#7A827B] truncate">
              {this.state.errorMessage}
            </div>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="h-11 px-4 bg-[#52796F] hover:bg-[#45665E] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, errorMessage: '' });
                  window.location.href = '/';
                }}
                className="h-11 px-4 bg-[#FAF8F5] border border-[#E7E3DC] text-[#2D322E] text-xs font-semibold rounded-xl flex items-center gap-2 hover:bg-[#F6F4EE]"
              >
                <Home className="w-4 h-4" />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
