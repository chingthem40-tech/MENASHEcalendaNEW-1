import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  eventId: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, eventId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error, eventId: `err-${Date.now()}` };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const eventId = `err-${Date.now()}`;
    console.error("[ErrorBoundary] Uncaught error:", { eventId, error, componentStack: info.componentStack });
    this.setState({ eventId });
  }

  private reload = () => {
    window.location.reload();
  };

  private goHome = () => {
    window.location.href = "/";
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: "32px 24px",
          background: "#080e1a",
          color: "#e8d5a3",
          textAlign: "center",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{ fontSize: 48 }}>✦</div>

        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#D4AF37" }}>
          Something went wrong
        </h1>

        <p style={{ margin: 0, fontSize: 14, color: "rgba(232,213,163,0.7)", maxWidth: 320, lineHeight: 1.6 }}>
          An unexpected error occurred. Your data is safe. Please reload the page or return to the home screen.
        </p>

        {this.state.eventId && (
          <p style={{ margin: 0, fontSize: 11, color: "rgba(232,213,163,0.35)", fontFamily: "monospace" }}>
            Ref: {this.state.eventId}
          </p>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={this.reload}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg,#D4AF37,#A0821A)",
              color: "#0F1829",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
          <button
            onClick={this.goHome}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "1.5px solid rgba(212,175,55,0.35)",
              background: "transparent",
              color: "#D4AF37",
              fontWeight: 500,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }
}
