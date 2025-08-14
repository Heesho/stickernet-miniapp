"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('OnchainKit Error Boundary caught an error:', error, errorInfo);
    
    // Log specific OnchainKit/hydration errors
    if (error.message.includes('Minified React error #418')) {
      console.error('Hydration mismatch detected. This often happens with OnchainKit components that depend on wallet state.');
    }
    if (error.message.includes('Minified React error #423')) {
      console.error('useLayoutEffect warning in SSR. OnchainKit components should be client-side only.');
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-600 dark:text-red-400 text-sm mb-4 text-center">
            {this.state.error?.message.includes('Minified React error') 
              ? 'There was a rendering issue. This might be related to wallet connection state.'
              : this.state.error?.message || 'An unexpected error occurred'
            }
          </p>
          <Button
            onClick={() => {
              this.setState({ hasError: false, error: undefined });
              window.location.reload();
            }}
            variant="outline"
          >
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}