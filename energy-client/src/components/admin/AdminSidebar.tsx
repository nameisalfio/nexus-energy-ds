import { useState, useRef } from "react";
import { Upload, Play, Square, Trash2, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SystemStatus } from "@/types/types";

interface AdminSidebarProps {
  systemStatus: SystemStatus;
  totalRecords: number;
  isDatasetLoaded: boolean;
  onUploadCSV: (file: File) => void;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  onPurgeData: () => void;
  onOpenAccessControl: () => void;
}

export function AdminSidebar({
  systemStatus,
  totalRecords,
  isDatasetLoaded,
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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isStreaming = systemStatus === "STREAMING";
  const isProcessing = systemStatus === "PROCESSING";
  const canStart = (isDatasetLoaded || totalRecords > 0) && systemStatus === "IDLE";

  return (
    <aside className="admin-sidebar flex flex-col pt-20 animate-slide-in-left">
      <div className="border-b border-sidebar-border p-6">
        <div className="flex items-center gap-3">
          <div className={cn("h-3 w-3 rounded-full", {
              "status-online pulse-glow": isStreaming,
              "status-warning": isProcessing,
              "status-idle": systemStatus === "IDLE",
          })} />
          <div>
            <p className="text-sm font-medium">System Status</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{systemStatus}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider">Infrastructure</span>
        </div>
          <div className="space-y-4">
            {/* Action: CSV Ingestion */}
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isStreaming}
              className="w-full flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 p-4 transition-all hover:bg-primary/10 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <Upload className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">{isUploading ? "Processing..." : "Upload CSV"}</span>
              </div>
            </button>

            {/* Simulation (start/stop) */}
            {!isStreaming ? (
              <button
                onClick={onStartSimulation}
                disabled={!canStart}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl p-4 transition-all duration-300",
                  "bg-status-online text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]",
                  "hover:bg-status-online/90 hover:scale-[1.02] active:scale-[0.98]",
                  "disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed"
                )}
              >
                <Play className="h-4 w-4 fill-current" />
                <span className="text-sm font-black uppercase tracking-wider">Start Simulation</span>
              </button>
            ) : (
              <button
                onClick={onStopSimulation}
                className="w-full flex items-center gap-3 rounded-xl p-4 bg-status-error text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all hover:bg-status-error/90"
              >
                <Square className="h-4 w-4 fill-current" />
                <span className="text-sm font-black uppercase tracking-wider">Stop Simulation</span>
              </button>
            )}

            {/* Purge Action */}
            <button
              onClick={onPurgeData}
              disabled={isStreaming}
              className="w-full flex items-center gap-3 rounded-xl p-4 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-tighter">Purge Data Storage</span>
            </button>
          </div>

        <div className="mt-12 border-t border-border/50 pt-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Management</p>
          <button
            onClick={onOpenAccessControl}
            className="w-full flex items-center gap-3 rounded-xl p-3 text-muted-foreground transition-all hover:bg-secondary/50 hover:text-foreground"
          >
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Access Control</span>
          </button>
        </div>
      </div>

      <div className="p-6 border-t border-sidebar-border">
        <p className="text-[10px] text-muted-foreground font-mono">NEXUS_OS // V2.0.42</p>
      </div>
    </aside>
  );
}