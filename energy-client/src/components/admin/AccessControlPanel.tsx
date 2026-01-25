import { useState, useEffect } from "react";
import { X, Shield, User, Crown, RefreshCw } from "lucide-react";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AccessControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RegisteredUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

export function AccessControlPanel({ isOpen, onClose }: AccessControlPanelProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [changingUserId, setChangingUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!currentUser?.token) return;
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8081/api/auth/users", {
        headers: { "Authorization": `Bearer ${currentUser.token}` }
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      toast.error("Failed to load user directory");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchUsers();
  }, [isOpen]);

  const handleRoleChange = async (email: string, newRole: UserRole) => {
    if (!currentUser?.token) return;
    setChangingUserId(email); 
    try {
      const response = await fetch("http://localhost:8081/api/auth/users/change-role", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, newRole })
      });

      if (!response.ok) throw new Error();
      
      toast.success(`Role updated to ${newRole} for ${email}`);
      await fetchUsers(); 
    } catch (err) {
      toast.error("Permission update failed");
    } finally {
      setChangingUserId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative z-10 w-full max-w-2xl max-h-[80vh] glass-card-elevated p-6 mx-4 animate-scale-in flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Access Control</h2>
              <p className="text-sm text-muted-foreground">Managing infrastructure privileges</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-secondary/50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
          {isLoading && users.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm italic">Querying security records...</p>
            </div>
          ) : (
            users.map((u) => (
              <div key={u.id} className={cn(
                "rounded-xl border border-border/50 bg-secondary/30 p-4 transition-all",
                u.email === currentUser?.email && "ring-1 ring-primary/50"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      u.role === "ADMIN" ? "bg-status-warning/10 text-status-warning" : "bg-primary/10 text-primary"
                    )}>
                      {u.role === "ADMIN" ? <Crown className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {u.username} {u.email === currentUser?.email && <span className="text-[10px] ml-1 opacity-50">(YOU)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex rounded-lg border border-border/50 overflow-hidden bg-background/50">
                    {(["USER", "ADMIN"] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRoleChange(u.email, r)}
                        disabled={changingUserId === u.email || u.email === currentUser?.email}
                        className={cn(
                          "px-4 py-1.5 text-xs font-bold transition-all",
                          u.role === r ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground",
                          (changingUserId === u.email || u.email === currentUser?.email) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}