"use client";

import { Icon } from "../Icon";
import { NAV_ITEMS } from "@/lib/constants";

type BottomNavigationProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function BottomNavigation({ activeTab, setActiveTab }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-black backdrop-blur-md z-50">
      <div className="flex justify-around items-center px-2 py-4 pb-6 safe-area-inset-bottom">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
              activeTab === item.id
                ? "text-[var(--app-accent)]"
                : "text-[var(--app-foreground-muted)] hover:text-[var(--app-foreground)]"
            }`}
          >
            <Icon 
              name={item.icon as any} 
              size="md" 
              className={`transition-transform duration-200 ${
                activeTab === item.id ? "scale-110" : ""
              }`}
            />
            <span className={`text-xs mt-1 font-medium transition-all duration-200 ${
              activeTab === item.id ? "opacity-100" : "opacity-70"
            }`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}