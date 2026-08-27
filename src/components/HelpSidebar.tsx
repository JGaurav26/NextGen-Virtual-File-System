import { motion, AnimatePresence } from "framer-motion";
import { X, Terminal, FileText, Pencil, Eye, Trash2, Info, Scissors, FolderOpen, Link2, MoveHorizontal, BookOpen } from "lucide-react";

interface HelpSidebarProps {
  show: boolean;
  onClose: () => void;
}

const commands = [
  {
    name: "create",
    icon: FileText,
    usage: "create <filename> <permission>",
    description: "Allocate an inode, add a namespace entry, and open an FD (POSIX creat).",
    example: "create myfile.txt 3",
  },
  {
    name: "open",
    icon: FolderOpen,
    usage: "open <filename> <mode>",
    description: "Open an existing name. Extra opens add UFDT slots and bump reference count.",
    example: "open myfile.txt 3",
  },
  {
    name: "close",
    icon: FolderOpen,
    usage: "close <filename>",
    description: "Drop one UFDT slot. Inode stays unless nlink and refs are both 0.",
    example: "close myfile.txt",
  },
  {
    name: "closeall",
    icon: FolderOpen,
    usage: "closeall",
    description: "Close every open file descriptor.",
    example: "closeall",
  },
  {
    name: "write",
    icon: Pencil,
    usage: "write <filename> <data>",
    description: "Write at the current write offset. File must be open with write mode.",
    example: "write myfile.txt Hello World",
  },
  {
    name: "read",
    icon: Eye,
    usage: "read <filename> <bytes>",
    description: "Read from the current read offset. File must be open with read mode.",
    example: "read myfile.txt 100",
  },
  {
    name: "lseek",
    icon: MoveHorizontal,
    usage: "lseek <filename> <offset> <from>",
    description: "Move offsets. from: 0=START, 1=CURRENT, 2=END.",
    example: "lseek myfile.txt 0 0",
  },
  {
    name: "link",
    icon: Link2,
    usage: "link <old> <new>",
    description: "Hard link: second name, same inode, nlink++.",
    example: "link myfile.txt alias.txt",
  },
  {
    name: "ls",
    icon: Terminal,
    usage: "ls",
    description: "List namespace names with inode, size, nlink, refs.",
    example: "ls",
  },
  {
    name: "stat",
    icon: Info,
    usage: "stat <filename>",
    description: "Inode metadata by name.",
    example: "stat myfile.txt",
  },
  {
    name: "fstat",
    icon: Info,
    usage: "fstat <fd>",
    description: "Metadata plus offsets for an open descriptor.",
    example: "fstat 0",
  },
  {
    name: "rm",
    icon: Trash2,
    usage: "rm <filename>",
    description: "Unlink a name. Data is freed only when nlink=0 and no open FDs.",
    example: "rm myfile.txt",
  },
  {
    name: "truncate",
    icon: Scissors,
    usage: "truncate <filename>",
    description: "Clear file bytes and reset offsets on all FDs for that inode.",
    example: "truncate myfile.txt",
  },
  {
    name: "man",
    icon: BookOpen,
    usage: "man <command>",
    description: "Short manual for a command.",
    example: "man lseek",
  },
  {
    name: "info",
    icon: Info,
    usage: "info",
    description: "Superblock totals.",
    example: "info",
  },
  {
    name: "clear",
    icon: Terminal,
    usage: "clear",
    description: "Clear the terminal screen",
    example: "clear",
  },
  {
    name: "help",
    icon: Info,
    usage: "help",
    description: "Show this help panel",
    example: "help",
  },
];

const HelpSidebar = ({ show, onClose }: HelpSidebarProps) => {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed md:relative right-0 top-0 h-full w-full md:w-[26rem] glass-panel border-l border-primary/20 z-50 overflow-y-auto"
          >
            <div className="sticky top-0 glass-panel border-b border-primary/20 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-accent">Manual</p>
                <h2 className="text-lg font-semibold text-primary text-glow-green">Command Reference</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg border border-primary/15 hover:bg-muted/50 transition-colors"
                aria-label="Close help"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {commands.map((cmd, index) => (
                <motion.div
                  key={cmd.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="rounded-xl border border-primary/15 bg-muted/20 p-4 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <cmd.icon className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="font-mono font-semibold text-primary">{cmd.name}</h3>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Usage</span>
                      <code className="mt-1 block text-accent font-mono text-xs">{cmd.usage}</code>
                    </div>

                    <p className="text-muted-foreground leading-relaxed">{cmd.description}</p>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Example</span>
                      <code className="mt-1 block text-warning font-mono text-xs bg-muted/50 px-2.5 py-1.5 rounded-md">
                        {cmd.example}
                      </code>
                    </div>
                  </div>
                </motion.div>
              ))}

              <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 mt-4">
                <h3 className="font-semibold text-accent mb-2">Kernel notes</h3>
                <ul className="text-sm text-muted-foreground space-y-2 leading-relaxed">
                  <li>Watch Namespace → Inode → UFDT update after every command.</li>
                  <li>Permissions: 1 = READ, 2 = WRITE, 3 = READ+WRITE.</li>
                  <li>create opens an FD; close then open to reopen.</li>
                  <li>rm of the last name while still open leaves an orphaned inode until close.</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HelpSidebar;
