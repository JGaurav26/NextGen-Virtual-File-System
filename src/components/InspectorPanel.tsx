import { useEffect, useState } from "react";
import type { KernelSnapshot, NVFS } from "@/lib/nvfs";
import { modeLabel } from "@/lib/nvfs";

interface InspectorPanelProps {
  nvfs: NVFS;
  tick: number;
}

const InspectorPanel = ({ nvfs, tick }: InspectorPanelProps) => {
  const [snap, setSnap] = useState<KernelSnapshot>(nvfs.snapshot());

  useEffect(() => {
    setSnap(nvfs.snapshot());
    const interval = setInterval(() => setSnap(nvfs.snapshot()), 400);
    return () => clearInterval(interval);
  }, [nvfs, tick]);

  const used = snap.superBlock.totalInodes - snap.superBlock.freeInode;

  return (
    <div className="px-4 md:px-6 pb-3">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <section className="rounded-xl border border-primary/20 bg-card/70 overflow-hidden">
          <header className="flex items-center justify-between border-b border-primary/15 px-3 py-2">
            <h3 className="text-[11px] uppercase tracking-[0.16em] text-primary">Namespace</h3>
            <span className="font-mono text-[10px] text-muted-foreground">{snap.namespace.length} names</span>
          </header>
          <div className="max-h-36 overflow-auto p-2 font-mono text-[11px]">
            {snap.namespace.length === 0 ? (
              <p className="text-muted-foreground px-1 py-2">empty — no directory entries</p>
            ) : (
              <table className="w-full">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="text-left font-normal pb-1">name</th>
                    <th className="text-right font-normal pb-1">inode</th>
                  </tr>
                </thead>
                <tbody>
                  {snap.namespace.map((row) => (
                    <tr key={row.name} className="text-accent">
                      <td className="py-0.5 pr-2 truncate max-w-[10rem]">{row.name}</td>
                      <td className="py-0.5 text-right tabular-nums text-foreground">{row.inodeNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-accent/20 bg-card/70 overflow-hidden">
          <header className="flex items-center justify-between border-b border-accent/15 px-3 py-2">
            <h3 className="text-[11px] uppercase tracking-[0.16em] text-accent">DILB / Inodes</h3>
            <span className="font-mono text-[10px] text-muted-foreground">
              {used}/{snap.superBlock.totalInodes} used
            </span>
          </header>
          <div className="max-h-36 overflow-auto p-2 font-mono text-[11px]">
            {snap.inodes.length === 0 ? (
              <p className="text-muted-foreground px-1 py-2">all 50 inodes free</p>
            ) : (
              <table className="w-full">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="text-left font-normal pb-1">#</th>
                    <th className="text-left font-normal pb-1">nlink</th>
                    <th className="text-left font-normal pb-1">refs</th>
                    <th className="text-left font-normal pb-1">size</th>
                    <th className="text-left font-normal pb-1">names</th>
                  </tr>
                </thead>
                <tbody>
                  {snap.inodes.map((row) => (
                    <tr key={row.inodeNumber} className={row.orphaned ? "text-warning" : "text-foreground"}>
                      <td className="py-0.5 tabular-nums">{row.inodeNumber}</td>
                      <td className="py-0.5 tabular-nums">{row.linkCount}</td>
                      <td className="py-0.5 tabular-nums">{row.referenceCount}</td>
                      <td className="py-0.5 tabular-nums">{row.fileActualSize}</td>
                      <td className="py-0.5 truncate max-w-[8rem] text-primary">
                        {row.orphaned ? "(orphaned)" : row.names.join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-warning/20 bg-card/70 overflow-hidden">
          <header className="flex items-center justify-between border-b border-warning/15 px-3 py-2">
            <h3 className="text-[11px] uppercase tracking-[0.16em] text-warning">UFDT</h3>
            <span className="font-mono text-[10px] text-muted-foreground">{snap.ufdt.length} open</span>
          </header>
          <div className="max-h-36 overflow-auto p-2 font-mono text-[11px]">
            {snap.ufdt.length === 0 ? (
              <p className="text-muted-foreground px-1 py-2">no open file descriptors</p>
            ) : (
              <table className="w-full">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="text-left font-normal pb-1">fd</th>
                    <th className="text-left font-normal pb-1">mode</th>
                    <th className="text-left font-normal pb-1">r/w off</th>
                    <th className="text-left font-normal pb-1">ino</th>
                  </tr>
                </thead>
                <tbody>
                  {snap.ufdt.map((row) => (
                    <tr key={row.fd} className="text-foreground">
                      <td className="py-0.5 tabular-nums text-warning">{row.fd}</td>
                      <td className="py-0.5 text-accent">{modeLabel(row.mode)}</td>
                      <td className="py-0.5 tabular-nums">
                        {row.readOffset}/{row.writeOffset}
                      </td>
                      <td className="py-0.5 tabular-nums text-primary">{row.inodeNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default InspectorPanel;
