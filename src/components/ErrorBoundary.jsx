import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="px-3 pt-6 pb-6">
          <div className="bg-card rounded-xl border border-destructive/20 p-6 text-center space-y-3 max-w-sm mx-auto">
            <AlertTriangle className="w-10 h-10 text-destructive/60 mx-auto" />
            <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Something went wrong
            </h3>
            <p className="text-sm text-muted-foreground">
              {this.props.fallbackMessage || "This section couldn't load. Try refreshing."}
            </p>
            <Button
              onClick={() => this.setState({ hasError: false })}
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}