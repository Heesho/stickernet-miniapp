"use client";

import type { NotificationsProps } from "./Notifications.types";

export function Notifications({ setActiveTab }: NotificationsProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center text-[var(--app-foreground-muted)]">
        Activity page - Coming soon
      </div>
    </div>
  );
}