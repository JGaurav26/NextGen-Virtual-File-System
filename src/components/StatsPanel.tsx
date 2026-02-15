import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HardDrive, FileText, Database } from "lucide-react";
import { NVFS } from "@/lib/nvfs";

interface StatsPanelProps {
  nvfs: NVFS;
}

const StatsPanel = ({ nvfs }: StatsPanelProps) => {
  const [stats, setStats] = useState(nvfs.getSystemInfo());
  const [fileCount, setFileCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(nvfs.getSystemInfo());
      setFileCount(nvfs.listFiles().length);
    }, 500);

    return () => clearInterval(interval);
  }, [nvfs]);

  const usedInodes = stats.totalInodes - stats.freeInode;
  const usagePercentage = (usedInodes / stats.totalInodes) * 100;

  return (
    <div className="px-6 py-4 border-b border-primary/30 bg-card/30">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/30 border border-primary/20 rounded p-4 hover:border-primary/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Total Inodes</div>
              <div className="text-2xl font-bold text-primary text-glow-green">{stats.totalInodes}</div>
            </div>
            <Database className="w-8 h-8 text-primary/50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-muted/30 border border-accent/20 rounded p-4 hover:border-accent/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Free Inodes</div>
              <div className="text-2xl font-bold text-accent text-glow-cyan">{stats.freeInode}</div>
            </div>
            <HardDrive className="w-8 h-8 text-accent/50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-muted/30 border border-warning/20 rounded p-4 hover:border-warning/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Total Files</div>
              <div className="text-2xl font-bold text-warning text-glow-yellow">{fileCount}</div>
            </div>
            <FileText className="w-8 h-8 text-warning/50" />
          </div>
        </motion.div>
      </div>

      {/* Usage bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Inode Usage</span>
          <span>{usagePercentage.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-accent to-warning"
            initial={{ width: 0 }}
            animate={{ width: `${usagePercentage}%` }}
            transition={{ duration: 0.5 }}
            style={{ boxShadow: "0 0 10px hsl(var(--primary))" }}
          />
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
