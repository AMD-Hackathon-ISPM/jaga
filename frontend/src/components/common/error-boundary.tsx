"use client";

import { Component, type ReactNode } from "react";
import { ErrorState } from "@/components/ui/error-state";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * App-wide error boundary. Catches render errors below the route boundaries.
 * Safety: shows a neutral failure message, never an estimate (design §2).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="mx-auto w-full max-w-flow px-4 py-8">
            <ErrorState
              title="Something went wrong"
              description="No result was produced. Reload and try again, or use the standard clinical pathway."
              onRetry={this.reset}
            />
          </div>
        )
      );
    }
    return this.props.children;
  }
}
