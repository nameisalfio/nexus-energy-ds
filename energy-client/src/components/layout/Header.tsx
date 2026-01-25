import { Sun, Moon, Zap, LogOut, User } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

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
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 glow-ring">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Nexus Energy</h1>
            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Core Infrastructure</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/40 transition-all hover:bg-secondary"
          >
            {theme === "dark" ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-primary" />}
          </button>

          {isAuthenticated && !isLoginPage && (
            <div className="flex items-center gap-4 pl-4 border-l border-border/50">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold">{user?.email}</p>
                <p className="text-[10px] text-primary uppercase font-black">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive border border-destructive/20 transition-all hover:bg-destructive hover:text-white"
                title="Sign Out"
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