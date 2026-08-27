import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HardDrive, FileText, Database, FolderOpen } from "lucide-react";
import { NVFS } from "@/lib/nvfs";

interface StatsPanelProps {
  nvfs: NVFS;
  tick: number;
}

const StatsPanel = ({ nvfs, tick }: StatsPanelProps) => {
  const [stats, setStats] = useState(nvfs.getSystemInfo());
  const [fileCount, setFileCount] = useState(0);
  const [openFds, setOpenFds] = useState(0);

  useEffect(() => {
    const refresh = () => {
      const snap = nvfs.snapshot();
      setStats(snap.superBlock);
      setFileCount(snap.namespace.length);
      setOpenFds(snap.ufdt.length);
    };
    refresh();
    const interval = setInterval(refresh, 400);
    return () => clearInterval(interval);
  }, [nvfs, tick]);

  const usedInodes = stats.totalInodes - stats.freeInode;
  const usagePercentage = (usedInodes / stats.totalInodes) * 100;

  const cards = [
    {
      label: "Total Inodes",
      value: stats.totalInodes,
      hint: "DILB pool",
      icon: Database,
      valueClass: "text-primary text-glow-green",
      iconClass: "text-primary/60",
      ring: "border-primary/25 hover:border-primary/50",
      glow: "from-primary/15",
    },
    {
      label: "Free Inodes",
      value: stats.freeInode,
      hint: "FileType == 0",
      icon: HardDrive,
      valueClass: "text-accent text-glow-cyan",
      iconClass: "text-accent/60",
      ring: "border-accent/25 hover:border-accent/50",
      glow: "from-accent/15",
    },
    {
      label: "Names",
      value: fileCount,
      hint: "Namespace entries",
      icon: FileText,
      valueClass: "text-warning text-glow-yellow",
      iconClass: "text-warning/60",
      ring: "border-warning/25 hover:border-warning/50",
      glow: "from-warning/15",
    },
    {
      label: "Open FDs",
      value: openFds,
      hint: "UFDT slots",
      icon: FolderOpen,
      valueClass: "text-foreground",
      iconClass: "text-primary/50",
      ring: "border-primary/20 hover:border-primary/40",
      glow: "from-primary/10",
    },
  ];

  return (
    <div className="px-5 pt-4 md:px-6 border-b border-primary/15 bg-card/20">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className={`relative overflow-hidden rounded-xl border bg-muted/25 p-4 transition-colors ${card.ring}`}
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.glow} to-transparent`} />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
                  {card.label}
                </div>
                <div className={`text-3xl font-semibold tabular-nums ${card.valueClass}`}>{card.value}</div>
                <div className="mt-1 text-[11px] text-muted-foreground/80">{card.hint}</div>
              </div>
              <card.icon className={`w-7 h-7 ${card.iconClass}`} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 mb-4">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-2">
          <span>Inode usage</span>
          <span className="tabular-nums text-foreground/80">
            {usedInodes}/{stats.totalInodes} · {usagePercentage.toFixed(1)}%
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden border border-primary/10">
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-accent to-warning"
            initial={{ width: 0 }}
            animate={{ width: `${usagePercentage}%` }}
            transition={{ duration: 0.5 }}
            style={{ boxShadow: "0 0 12px hsl(var(--primary) / 0.6)" }}
          />
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
