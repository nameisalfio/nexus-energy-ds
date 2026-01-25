import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Mail, Lock, ArrowRight, Loader2, User, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { LoginHeader } from "@/components/layout/LoginHeader";

type AuthMode = "login" | "register";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (mode === "register" && !username) {
      setError("Username is required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
      // Role is read from the user data, redirect accordingly
      const stored = localStorage.getItem("nexus-user");
      if (stored) {
        const userData = JSON.parse(stored);
        navigate(userData.role === "ADMIN" ? "/admin" : "/user");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
    setUsername("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <LoginHeader />
      
      <main className="flex min-h-screen items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md animate-scale-in">
          {/* Glass Card */}
          <div className="glass-card-elevated p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 glow-ring mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                {mode === "login" ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === "login" 
                  ? "Sign in to access the Energy Portal" 
                  : "Register to get started with Nexus"}
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-secondary/30">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
                    mode === "login"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <User className="h-4 w-4" />
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
                    mode === "register"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <UserPlus className="h-4 w-4" />
                  Register
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username - Only for registration */}
              {mode === "register" && (
                <div className="animate-fade-in">
                  <label className="data-label mb-2 block">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="johndoe"
                      className="input-glass pl-11"
                      autoComplete="username"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="data-label mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="input-glass pl-11"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="data-label mb-2 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-glass pl-11"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 animate-fade-in">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary-glow w-full flex items-center justify-center gap-2 py-3 mt-6"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {mode === "login" ? "Sign In" : "Create Account"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Demo hint */}
            <div className="mt-6 rounded-lg bg-secondary/30 p-3">
              <p className="text-xs text-muted-foreground text-center mb-2">
                Demo credentials:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-secondary/50 p-2">
                  <p className="font-medium text-foreground">Admin</p>
                  <p className="text-muted-foreground">admin@nexus.com</p>
                  <p className="text-muted-foreground">admin123</p>
                </div>
                <div className="rounded-md bg-secondary/50 p-2">
                  <p className="font-medium text-foreground">User</p>
                  <p className="text-muted-foreground">user@nexus.com</p>
                  <p className="text-muted-foreground">user123</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Nexus Energy Portal © 2024 • Enterprise Edition
          </p>
        </div>
      </main>
    </div>
  );
}
