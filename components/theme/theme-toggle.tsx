"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, mounted, toggleTheme } = useTheme();
  const isDark = mounted && theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
      aria-pressed={isDark}
      title={isDark ? "Mode Terang" : "Mode Gelap"}
      className={`min-h-[44px] min-w-[44px] px-3 rounded-xl border border-outline-variant bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface inline-flex items-center justify-center gap-2 text-xs font-semibold transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      )}
      <span className="hidden lg:inline">{isDark ? "Terang" : "Gelap"}</span>
    </button>
  );
}
