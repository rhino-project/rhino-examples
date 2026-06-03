import { Component, type ErrorInfo, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null; info: ErrorInfo | null }> {
  state = { error: null as Error | null, info: null as ErrorInfo | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[ErrorBoundary]', error, info); this.setState({ error, info }); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, color: '#fff', background: '#1a0f0f', minHeight: '100vh', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
          <h2 style={{ color: '#ff6b6b', marginTop: 0 }}>Render error</h2>
          <pre style={{ color: '#ff9b9b', whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
          <details style={{ marginTop: 16 }}><summary style={{ cursor: 'pointer', color: '#ffb547' }}>Stack</summary>
            <pre style={{ color: '#999', fontSize: 11, whiteSpace: 'pre-wrap' }}>{this.state.error.stack}</pre>
          </details>
          {this.state.info && <details style={{ marginTop: 8 }}><summary style={{ cursor: 'pointer', color: '#ffb547' }}>Component stack</summary>
            <pre style={{ color: '#999', fontSize: 11, whiteSpace: 'pre-wrap' }}>{this.state.info.componentStack}</pre>
          </details>}
        </div>
      );
    }
    return this.props.children as ReactNode;
  }
}
