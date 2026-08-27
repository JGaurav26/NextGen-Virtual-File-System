import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NVFS } from "@/lib/nvfs";
import { ChevronRight, Terminal as TerminalIcon, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import StatsPanel from "./StatsPanel";
import HelpSidebar from "./HelpSidebar";
import InspectorPanel from "./InspectorPanel";
import { modeLabel } from "@/lib/nvfs";

const MAN: Record<string, string[]> = {
  create: ["Allocate inode + namespace name, then open an FD.", "Usage: create <filename> <permission>  (1=R 2=W 3=RW)"],
  open: ["Add a UFDT slot for an existing name.", "Usage: open <filename> <mode>"],
  close: ["Remove one UFDT entry; decrement inode refs.", "Usage: close <filename>"],
  closeall: ["Close every descriptor in the UFDT.", "Usage: closeall"],
  write: ["Copy bytes at the write offset (file must be open for write).", "Usage: write <filename> <data>"],
  read: ["Copy bytes from the read offset (file must be open for read).", "Usage: read <filename> <bytes>"],
  lseek: ["Reposition read/write offsets.", "Usage: lseek <filename> <offset> <from>", "from: 0=START 1=CURRENT 2=END"],
  link: ["Second directory name for the same inode (nlink++).", "Usage: link <old> <new>"],
  rm: ["Unlink a name. Free inode only when nlink=0 and refs=0.", "Usage: rm <filename>"],
  stat: ["Print inode fields by name.", "Usage: stat <filename>"],
  fstat: ["Print inode + file-table offsets by FD.", "Usage: fstat <fd>"],
  truncate: ["Zero file data; reset offsets on all FDs for that inode.", "Usage: truncate <filename>"],
  ls: ["List namespace entries.", "Usage: ls"],
  info: ["Superblock totals.", "Usage: info"],
};

interface OutputLine {
  id: number;
  type: "command" | "success" | "error" | "info" | "warning" | "output";
  text: string;
}

const Terminal = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<OutputLine[]>([
    {
      id: 0,
      type: "info",
      text: "=============================================",
    },
    {
      id: 1,
      type: "success",
      text: "   🧠 NEXT GEN VIRTUAL FILE SYSTEM (NVFS)",
    },
    {
      id: 2,
      type: "info",
      text: "   Developed by: Gaurav Jadhav (IT Dept.)",
    },
    {
      id: 3,
      type: "info",
      text: "=============================================",
    },
    {
      id: 4,
      type: "warning",
      text: "Type 'help' · kernel: create/open/close/lseek/link/fstat  · watch tables below",
    },
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
  const [tick, setTick] = useState(0);
  const nvfsRef = useRef(new NVFS());
  const outputEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lineIdRef = useRef(5);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  const addOutput = (type: OutputLine["type"], text: string) => {
    setOutput((prev) => [...prev, { id: lineIdRef.current++, type, text }]);
  };

  const handleCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    addOutput("command", `Fabulous NVFS :> ${trimmedCmd}`);
    setCommandHistory((prev) => [...prev, trimmedCmd]);
    setHistoryIndex(-1);

    const parts = trimmedCmd.split(/\s+/);
    const command = parts[0].toLowerCase();

    switch (command) {
      case "help":
        setShowHelp(true);
        addOutput("info", "Help panel opened. Available commands listed on the right.");
        break;

      case "clear":
        setOutput([]);
        break;

      case "info":
        const sysInfo = nvfsRef.current.getSystemInfo();
        addOutput("info", "╔════════════════════════════════╗");
        addOutput("info", "║   SYSTEM INFORMATION           ║");
        addOutput("info", "╠════════════════════════════════╣");
        addOutput("info", `║ Total Inodes  : ${sysInfo.totalInodes.toString().padEnd(14)}║`);
        addOutput("info", `║ Free Inodes   : ${sysInfo.freeInode.toString().padEnd(14)}║`);
        addOutput("info", `║ Used Inodes   : ${(sysInfo.totalInodes - sysInfo.freeInode).toString().padEnd(14)}║`);
        addOutput("info", "╚════════════════════════════════╝");
        break;

      case "ls":
        const files = nvfsRef.current.listFiles();
        if (files.length === 0) {
          addOutput("warning", "No files in the system");
        } else {
          addOutput("info", "╔════════════════════════════════════════════════════════════════════╗");
          addOutput("info", "║ Name           Inode   Size     nlink  refs  Created              ║");
          addOutput("info", "╠════════════════════════════════════════════════════════════════════╣");
          files.forEach((file) => {
            const name = file.fileName.padEnd(14);
            const inode = file.inodeNumber.toString().padEnd(7);
            const size = file.fileActualSize.toString().padEnd(8);
            const links = file.linkCount.toString().padEnd(6);
            const refs = file.referenceCount.toString().padEnd(5);
            const date = file.creationTime.toLocaleTimeString().padEnd(12);
            addOutput("output", `║ ${name} ${inode} ${size} ${links} ${refs} ${date} ║`);
          });
          addOutput("info", "╚════════════════════════════════════════════════════════════════════╝");
        }
        break;

      case "create":
        if (parts.length !== 3) {
          addOutput("error", "Usage: create <filename> <permission>");
          addOutput("error", "Permission: 1=READ, 2=WRITE, 3=READ+WRITE");
        } else {
          const result = nvfsRef.current.createFile(parts[1], parseInt(parts[2]));
          if (result.success) {
            addOutput("success", result.message);
            toast.success(result.message);
          } else {
            addOutput("error", result.message);
            toast.error(result.message);
          }
        }
        break;

      case "write":
        if (parts.length < 2) {
          addOutput("error", "Usage: write <filename>");
        } else {
          const fileName = parts[1];
          addOutput("warning", `Enter data for '${fileName}': `);
          // In a real implementation, you'd handle this with a modal or prompt
          // For demo, we'll simulate with the rest of the command
          const data = parts.slice(2).join(" ") || "Sample data written to file";
          const result = nvfsRef.current.writeFile(fileName, data);
          if (result.success) {
            addOutput("success", result.message);
            toast.success(result.message);
          } else {
            addOutput("error", result.message);
            toast.error(result.message);
          }
        }
        break;

      case "read":
        if (parts.length !== 3) {
          addOutput("error", "Usage: read <filename> <bytes>");
        } else {
          const result = nvfsRef.current.readFile(parts[1], parseInt(parts[2]));
          if (result.success) {
            addOutput("success", result.message);
            addOutput("output", `Data: ${result.data}`);
          } else {
            addOutput("error", result.message);
          }
        }
        break;

      case "rm":
        if (parts.length !== 2) {
          addOutput("error", "Usage: rm <filename>");
        } else {
          const result = nvfsRef.current.deleteFile(parts[1]);
          if (result.success) {
            addOutput("success", result.message);
            toast.success(result.message);
          } else {
            addOutput("error", result.message);
            toast.error(result.message);
          }
        }
        break;

      case "stat":
        if (parts.length !== 2) {
          addOutput("error", "Usage: stat <filename>");
        } else {
          const result = nvfsRef.current.getFileInfo(parts[1]);
          if (result.success && result.info) {
            addOutput("info", "╔════════════════════════════════════════╗");
            addOutput("info", `║ File: ${result.info.fileName.padEnd(32)}║`);
            addOutput("info", "╠════════════════════════════════════════╣");
            addOutput("info", `║ Inode Number    : ${result.info.inodeNumber.toString().padEnd(19)}║`);
            addOutput("info", `║ File Size       : ${result.info.fileActualSize.toString().padEnd(19)}║`);
            addOutput("info", `║ Link Count      : ${result.info.linkCount.toString().padEnd(19)}║`);
            addOutput("info", `║ Ref Count       : ${result.info.referenceCount.toString().padEnd(19)}║`);
            addOutput("info", `║ Permission      : ${modeLabel(result.info.permission).padEnd(19)}║`);
            addOutput("info", `║ Created         : ${result.info.creationTime.toLocaleString().padEnd(19)}║`);
            addOutput("info", "╚════════════════════════════════════════╝");
          } else {
            addOutput("error", result.message);
          }
        }
        break;

      case "truncate":
        if (parts.length !== 2) {
          addOutput("error", "Usage: truncate <filename>");
        } else {
          const result = nvfsRef.current.truncateFile(parts[1]);
          if (result.success) {
            addOutput("success", result.message);
            toast.success(result.message);
          } else {
            addOutput("error", result.message);
            toast.error(result.message);
          }
        }
        break;

      case "close":
        if (parts.length !== 2) {
          addOutput("error", "Usage: close <filename>");
        } else {
          const result = nvfsRef.current.closeFile(parts[1]);
          if (result.success) {
            addOutput("success", result.message);
          } else {
            addOutput("error", result.message);
          }
        }
        break;

      case "closeall":
        {
          const result = nvfsRef.current.closeAll();
          addOutput("success", result.message);
        }
        break;

      case "open":
        if (parts.length !== 3) {
          addOutput("error", "Usage: open <filename> <mode>");
          addOutput("error", "Mode: 1=READ, 2=WRITE, 3=READ+WRITE");
        } else {
          const result = nvfsRef.current.openFile(parts[1], parseInt(parts[2], 10));
          if (result.success) {
            addOutput("success", result.message);
            toast.success(result.message);
          } else {
            addOutput("error", result.message);
            toast.error(result.message);
          }
        }
        break;

      case "link":
        if (parts.length !== 3) {
          addOutput("error", "Usage: link <oldname> <newname>");
        } else {
          const result = nvfsRef.current.linkFile(parts[1], parts[2]);
          if (result.success) {
            addOutput("success", result.message);
            toast.success(result.message);
          } else {
            addOutput("error", result.message);
            toast.error(result.message);
          }
        }
        break;

      case "lseek":
        if (parts.length !== 4) {
          addOutput("error", "Usage: lseek <filename> <offset> <from>");
          addOutput("error", "from: 0=START, 1=CURRENT, 2=END");
        } else {
          const result = nvfsRef.current.lseekFile(
            parts[1],
            parseInt(parts[2], 10),
            parseInt(parts[3], 10),
          );
          if (result.success) {
            addOutput("success", result.message);
          } else {
            addOutput("error", result.message);
          }
        }
        break;

      case "fstat":
        if (parts.length !== 2) {
          addOutput("error", "Usage: fstat <fd>");
        } else {
          const result = nvfsRef.current.fstat(parseInt(parts[1], 10));
          if (result.success && result.info) {
            addOutput("info", "╔════════════════════════════════════════╗");
            addOutput("info", `║ FD ${result.info.fd}  mode ${modeLabel(result.info.mode).padEnd(28)}║`);
            addOutput("info", "╠════════════════════════════════════════╣");
            addOutput("info", `║ Name            : ${result.info.fileName.padEnd(19)}║`);
            addOutput("info", `║ Inode           : ${result.info.inodeNumber.toString().padEnd(19)}║`);
            addOutput("info", `║ Size            : ${result.info.fileActualSize.toString().padEnd(19)}║`);
            addOutput("info", `║ nlink / refs    : ${`${result.info.linkCount} / ${result.info.referenceCount}`.padEnd(19)}║`);
            addOutput("info", `║ r/w offsets     : ${`${result.info.readOffset} / ${result.info.writeOffset}`.padEnd(19)}║`);
            addOutput("info", "╚════════════════════════════════════════╝");
          } else {
            addOutput("error", result.message);
          }
        }
        break;

      case "man":
        if (parts.length !== 2) {
          addOutput("error", "Usage: man <command>");
        } else {
          const pages = MAN[parts[1].toLowerCase()];
          if (!pages) {
            addOutput("error", `No manual entry for '${parts[1]}'`);
          } else {
            pages.forEach((line) => addOutput("info", line));
          }
        }
        break;

      default:
        addOutput("error", `Command not found: ${command}`);
        addOutput("warning", "Type 'help' for available commands");
        break;
    }

    setTick((n) => n + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      handleCommand(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput("");
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    }
  };

  const getLineColor = (type: OutputLine["type"]) => {
    switch (type) {
      case "command":
        return "text-accent";
      case "success":
        return "text-terminal-success text-glow-green";
      case "error":
        return "text-terminal-error";
      case "info":
        return "text-terminal-info";
      case "warning":
        return "text-terminal-warning";
      default:
        return "text-foreground";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden grid-bg">
      <div className="absolute inset-0 pointer-events-none crt-overlay opacity-40" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent scan-line" />
      </div>

      <header className="relative z-10 border-b border-primary/15 glass-panel sticky top-0">
        <div className="flex items-center justify-between px-5 md:px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
              <TerminalIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-primary text-glow-green">NVFS Console</h1>
              <p className="text-[11px] text-muted-foreground tracking-wide">
                NextGen Virtual File System · POSIX open-file kernel
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-soft" />
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Kernel online</span>
            </div>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary/10 border border-primary/25 hover:bg-primary/20 transition-colors text-sm"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Help</span>
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10">
        <StatsPanel nvfs={nvfsRef.current} tick={tick} />
        <InspectorPanel nvfs={nvfsRef.current} tick={tick} />
      </div>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
          <div className="flex-1 bg-card/80 border border-primary/20 rounded-2xl border-glow overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-primary/15 px-4 py-2.5 bg-muted/25">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
                <span className="ml-3 text-[11px] font-mono text-muted-foreground">nvfs@localhost — bash</span>
              </div>
              <span className="hidden sm:inline text-[11px] font-mono text-accent/80">Fabulous NVFS :&gt;</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-1 font-mono text-[13px] leading-relaxed">
              <AnimatePresence>
                {output.map((line) => (
                  <motion.div
                    key={line.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${getLineColor(line.type)} whitespace-pre-wrap break-words`}
                  >
                    {line.text}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={outputEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="border-t border-primary/15 p-3.5 md:p-4 bg-muted/20">
              <div className="flex items-center gap-2 rounded-lg border border-primary/15 bg-background/40 px-3 py-2.5">
                <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-accent font-mono text-sm whitespace-nowrap">Fabulous NVFS :&gt;</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent border-none outline-none text-foreground font-mono text-sm placeholder:text-muted-foreground"
                  placeholder="Type a command..."
                  autoFocus
                />
                <span className="w-1.5 h-5 bg-primary cursor-blink rounded-sm" />
              </div>
            </form>
          </div>
        </div>

        <HelpSidebar show={showHelp} onClose={() => setShowHelp(false)} />
      </div>
    </div>
  );
};

export default Terminal;
