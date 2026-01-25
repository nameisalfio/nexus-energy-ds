import { Sun, Moon, Zap } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export function LoginHeader() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/50 bg-background/80 backdrop-blur-glass">
      <div className="flex h-full items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 glow-ring">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Nexus Energy
            </h1>
            <p className="text-xs text-muted-foreground">Portal v2.0</p>
          </div>
        </div>

        {/* Right side - Theme Toggle only */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="glass-card flex h-10 w-10 items-center justify-center transition-all duration-200 hover:scale-105 hover:bg-primary/10"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-chart-4" />
            ) : (
              <Moon className="h-5 w-5 text-primary" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
