import { useState } from "react";
import { X, Shield, User, Crown } from "lucide-react";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AccessControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessControlPanel({ isOpen, onClose }: AccessControlPanelProps) {
  const { registeredUsers, changeUserRole, user: currentUser } = useAuth();
  const [changingUserId, setChangingUserId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setChangingUserId(userId);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    changeUserRole(userId, newRole);
    setChangingUserId(null);
    toast.success(`User role updated to ${newRole}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl max-h-[80vh] glass-card-elevated p-6 mx-4 animate-scale-in overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Access Control</h2>
              <p className="text-sm text-muted-foreground">
                Manage user roles and permissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-secondary/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
          {registeredUsers.map((user) => (
            <div
              key={user.id}
              className={cn(
                "rounded-xl border border-border/50 bg-secondary/30 p-4",
                "transition-all duration-200 hover:bg-secondary/50",
                user.id === currentUser?.id && "ring-2 ring-primary/30"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    user.role === "ADMIN" 
                      ? "bg-status-warning/10 text-status-warning" 
                      : "bg-primary/10 text-primary"
                  )}>
                    {user.role === "ADMIN" ? (
                      <Crown className="h-5 w-5" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {user.username}
                      {user.id === currentUser?.id && (
                        <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Role Toggle */}
                  <div className="flex rounded-lg border border-border/50 overflow-hidden">
                    <button
                      onClick={() => handleRoleChange(user.id, "USER")}
                      disabled={changingUserId === user.id}
                      className={cn(
                        "px-3 py-1.5 text-sm font-medium transition-all duration-200",
                        user.role === "USER"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                        changingUserId === user.id && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      User
                    </button>
                    <button
                      onClick={() => handleRoleChange(user.id, "ADMIN")}
                      disabled={changingUserId === user.id}
                      className={cn(
                        "px-3 py-1.5 text-sm font-medium transition-all duration-200",
                        user.role === "ADMIN"
                          ? "bg-status-warning text-white"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                        changingUserId === user.id && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      Admin
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            {registeredUsers.length} registered user{registeredUsers.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
