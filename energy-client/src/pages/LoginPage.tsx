import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Mail, Lock, ArrowRight, Loader2, User, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
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
  
    setIsLoading(true);
    try {
      if (mode === "login") {
        const userData = await login(email, password);
        toast.success(`Welcome back, ${userData.username}!`);
        navigate(userData.role === "ADMIN" ? "/admin" : "/user");
      } else {
        await register(username, email, password);
        toast.success("Registration successful! You can now sign in.");
        setMode("login");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg); 
      toast.error(msg); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <LoginHeader />
      
      <main className="flex min-h-screen items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md animate-scale-in">
          <div className="glass-card-elevated p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 glow-ring mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                {mode === "login" ? "Nexus - Login" : "Nexus - Create Account"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === "login" 
                  ? "Sign in to access the Energy Portal" 
                  : "Permanent registration to the Nexus Database"}
              </p>
            </div>

            <div className="mb-6">
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-secondary/30">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
                    mode === "login" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
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
                    mode === "register" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <UserPlus className="h-4 w-4" />
                  Register
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="animate-fade-in">
                  <label htmlFor="username" className="data-label mb-2 block">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      className="input-glass pl-11"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="data-label mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@nexus.com"
                    className="input-glass pl-11"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="data-label mb-2 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-glass pl-11"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 animate-fade-in">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary-glow w-full flex items-center justify-center gap-2 py-3 mt-6"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>
                    {mode === "login" ? "Sign In" : "Register me"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <footer className="mt-6 text-center text-xs text-muted-foreground">
            Nexus Energy Portal © 2026 • Enterprise Production
          </footer>
        </div>
      </main>
    </div>
  );
}