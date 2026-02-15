import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NVFS } from "@/lib/nvfs";
import { ChevronRight, Terminal as TerminalIcon, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import StatsPanel from "./StatsPanel";
import HelpSidebar from "./HelpSidebar";

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
      text: "Type 'help' for available commands",
    },
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
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
          addOutput("info", "║ File Name       Inode    Size      Links    Created On            ║");
          addOutput("info", "╠════════════════════════════════════════════════════════════════════╣");
          files.forEach((file) => {
            const name = file.fileName.padEnd(15);
            const inode = file.inodeNumber.toString().padEnd(8);
            const size = file.fileActualSize.toString().padEnd(9);
            const links = file.linkCount.toString().padEnd(8);
            const date = file.creationTime.toLocaleTimeString().padEnd(18);
            addOutput("output", `║ ${name} ${inode} ${size} ${links} ${date} ║`);
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
            addOutput("info", `║ Permission      : ${result.info.permission.toString().padEnd(19)}║`);
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

      default:
        addOutput("error", `Command not found: ${command}`);
        addOutput("warning", "Type 'help' for available commands");
        break;
    }
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
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent scan-line" />
      </div>

      {/* Header */}
      <header className="border-b border-primary/30 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <TerminalIcon className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-primary text-glow-green">NVFS Terminal</h1>
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-2 px-4 py-2 rounded bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Help</span>
          </button>
        </div>
      </header>

      {/* Stats Panel */}
      <StatsPanel nvfs={nvfsRef.current} />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Terminal */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="flex-1 bg-card border border-primary/30 rounded border-glow overflow-hidden flex flex-col">
            {/* Output area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-sm">
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

            {/* Input area */}
            <form onSubmit={handleSubmit} className="border-t border-primary/30 p-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-accent font-mono text-sm">Fabulous NVFS :&gt;</span>
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
                <span className="w-2 h-5 bg-primary cursor-blink" />
              </div>
            </form>
          </div>
        </div>

        {/* Help Sidebar */}
        <HelpSidebar show={showHelp} onClose={() => setShowHelp(false)} />
      </div>
    </div>
  );
};

export default Terminal;
