import { Sun, Moon, Zap, LogOut } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isLoginPage = location.pathname === "/login";

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

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
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

          {/* User info & Logout */}
          {isAuthenticated && !isLoginPage && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.role === "ADMIN" ? "Administrator" : "Observer"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="glass-card flex h-10 w-10 items-center justify-center text-muted-foreground transition-all duration-200 hover:text-destructive hover:bg-destructive/10"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
