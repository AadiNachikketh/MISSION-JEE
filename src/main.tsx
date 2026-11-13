import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Unexpected rendering error',
    };
  }

  componentDidCatch(error: Error) {
    console.error('[LAKSHYA] Caught application error:', error);
  }

  handleReset = () => {
    try {
      localStorage.clear();
    } catch {
      // ignore storage errors
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: '#0A0E1F',
            color: '#dee1fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '460px',
              width: '100%',
              background: '#131938',
              border: '1px solid #2A3362',
              borderRadius: '20px',
              padding: '28px',
            }}
          >
            <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#ffffff' }}>
              LAKSHYA Recovery Mode
            </h1>
            <p style={{ fontSize: '14px', color: '#CBD5E1', marginBottom: '16px', lineHeight: 1.5 }}>
              Something prevented the screen from loading cleanly ({this.state.message}). Resetting local app cache usually fixes this immediately.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                background: '#7C5CFF',
                color: '#ffffff',
                border: 'none',
                borderRadius: '999px',
                padding: '10px 20px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset Local Data &amp; Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
