import React, { memo } from 'react';
import { Button, Icon } from "../../ui";

interface BoardErrorStateProps {
  error: string | null;
  onBackToHome: () => void;
}

export const BoardErrorState = memo(function BoardErrorState({ 
  error, 
  onBackToHome 
}: BoardErrorStateProps) {
  return (
    <div className="text-center py-8 animate-fade-in">
      <Icon name="profile" size="lg" className="text-[var(--app-foreground-muted)] mx-auto mb-4" />
      <p className="text-[var(--app-foreground-muted)]">{error || 'Board not found'}</p>
      <Button 
        onClick={onBackToHome} 
        variant="outline" 
        className="mt-4"
      >
        Back to Home
      </Button>
    </div>
  );
});