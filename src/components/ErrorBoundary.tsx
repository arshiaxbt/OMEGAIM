'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: string | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-black gap-4">
          <div className="text-red-400 font-mono text-xl">SOMETHING WENT WRONG</div>
          <div className="text-gray-500 font-mono text-xs max-w-md text-center">
            {this.state.error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="rounded border border-green-500 px-6 py-2 font-mono text-sm text-green-400 hover:bg-green-500 hover:text-black"
          >
            RELOAD
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
