import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 m-4 bg-error-container text-on-error-container rounded-xl border border-error/20">
          <h2 className="text-lg font-bold mb-2 text-error">Something went wrong</h2>
          <p className="text-sm font-mono opacity-80 mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

