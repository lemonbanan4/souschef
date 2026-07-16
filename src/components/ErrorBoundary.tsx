import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Last-resort crash screen — without this, any render error is a blank white page. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[souschef] render crash:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="crash-screen">
        <div className="crash-card clay">
          <div className="crash-emoji">🍝</div>
          <h1>Mamma mia!</h1>
          <p>Gino dropped the pasta — something went wrong in la cucina.</p>
          <p className="crash-hint">Your recipes, XP and streaks are safe. A reload should fix it.</p>
          <button className="cook-btn" onClick={() => window.location.reload()}>
            Reload the kitchen 🔄
          </button>
        </div>
      </div>
    );
  }
}
