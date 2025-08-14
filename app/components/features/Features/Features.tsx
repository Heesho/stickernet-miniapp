"use client";

import { Button, Card, Icon } from "../../ui";
import { APP_FEATURES } from "@/lib/constants";
import type { FeaturesProps } from "../Home/Home.types";

export function Features({ setActiveTab }: FeaturesProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Key Features">
        <ul className="space-y-3 mb-4">
          {APP_FEATURES.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Icon name={feature.icon as any} className="text-[var(--app-accent)] mt-1 mr-2" />
              <span className="text-[var(--app-foreground-muted)]">
                {feature.description}
              </span>
            </li>
          ))}
        </ul>
        <Button variant="outline" onClick={() => setActiveTab("home")}>
          Back to Home
        </Button>
      </Card>
    </div>
  );
}