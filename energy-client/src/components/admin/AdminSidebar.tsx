import { useState, useRef } from "react";
import {
  Database,
  Upload,
  Play,
  Square,
  Trash2,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SystemStatus } from "@/types/reading";

interface AdminSidebarProps {
  systemStatus: SystemStatus;
  totalRecords: number;
  onUploadCSV: (file: File) => void;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  onPurgeData: () => void;
  onOpenAccessControl: () => void;
}

export function AdminSidebar({
  systemStatus,
  totalRecords,
  onUploadCSV,
  onStartSimulation,
  onStopSimulation,
  onPurgeData,
  onOpenAccessControl,
}: AdminSidebarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      await onUploadCSV(file);
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const isStreaming = systemStatus === "STREAMING";

  return (
    <aside className="admin-sidebar flex flex-col pt-20 animate-slide-in-left">
      {/* System Status */}
      <div className="border-b border-sidebar-border p-6">
        <div className="flex items-center gap-3">
          <div
            className={cn("h-3 w-3 rounded-full", {
              "status-online pulse-glow": systemStatus === "STREAMING",
              "status-warning": systemStatus === "PROCESSING",
              "status-error": systemStatus === "ERROR",
              "status-idle": systemStatus === "IDLE",
            })}
          />
          <div>
            <p className="text-sm font-medium">System Status</p>
            <p className="text-xs text-muted-foreground">{systemStatus}</p>
          </div>
        </div>
      </div>

      {/* Database Info */}
      <div className="border-b border-sidebar-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Database Load</span>
        </div>
        <div className="rounded-lg bg-secondary/50 p-4">
          <p className="data-label">Total Records</p>
          <p className="data-value text-2xl mt-1">
            {totalRecords.toLocaleString()}
          </p>
          <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min((totalRecords / 100000) * 100, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {Math.min((totalRecords / 100000) * 100, 100).toFixed(1)}% capacity
          </p>
        </div>
      </div>

      {/* Infrastructure Controls */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Infrastructure</span>
        </div>

        <div className="space-y-3">
          {/* CSV Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isStreaming}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg border border-border/50 p-3",
              "bg-secondary/30 transition-all duration-200",
              "hover:bg-primary/10 hover:border-primary/30",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Upload className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {isUploading ? "Uploading..." : "Load CSV Dataset"}
            </span>
          </button>

          {/* Simulation Controls */}
          {!isStreaming ? (
            <button
              onClick={onStartSimulation}
              disabled={totalRecords === 0}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg p-3",
                "bg-status-online/10 text-status-online border border-status-online/30",
                "transition-all duration-200 hover:bg-status-online/20",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <Play className="h-4 w-4" />
              <span className="text-sm font-medium">Start Simulation</span>
            </button>
          ) : (
            <button
              onClick={onStopSimulation}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg p-3",
                "bg-status-warning/10 text-status-warning border border-status-warning/30",
                "transition-all duration-200 hover:bg-status-warning/20"
              )}
            >
              <Square className="h-4 w-4" />
              <span className="text-sm font-medium">Stop Simulation</span>
            </button>
          )}

          {/* Purge Data */}
          <button
            onClick={onPurgeData}
            disabled={isStreaming || totalRecords === 0}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg p-3",
              "bg-destructive/10 text-destructive border border-destructive/30",
              "transition-all duration-200 hover:bg-destructive/20",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-sm font-medium">Purge All Records</span>
          </button>
        </div>

        {/* Management - Only Access Control */}
        <div className="mt-8">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Management
          </p>
          <div className="space-y-1">
            <button
              onClick={onOpenAccessControl}
              className="w-full flex items-center gap-3 rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
            >
              <Users className="h-4 w-4" />
              <span className="text-sm">Access Control</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <p className="text-xs text-muted-foreground text-center">
          Nexus Admin Console v2.0
        </p>
      </div>
    </aside>
  );
}
