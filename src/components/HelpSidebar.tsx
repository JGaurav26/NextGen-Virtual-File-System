import { motion, AnimatePresence } from "framer-motion";
import { X, Terminal, FileText, Pencil, Eye, Trash2, Info, Scissors } from "lucide-react";

interface HelpSidebarProps {
  show: boolean;
  onClose: () => void;
}

const commands = [
  {
    name: "create",
    icon: FileText,
    usage: "create <filename> <permission>",
    description: "Create a new file with specified permissions (1=READ, 2=WRITE, 3=READ+WRITE)",
    example: "create myfile.txt 3",
  },
  {
    name: "write",
    icon: Pencil,
    usage: "write <filename> <data>",
    description: "Write data to an existing file",
    example: "write myfile.txt Hello World",
  },
  {
    name: "read",
    icon: Eye,
    usage: "read <filename> <bytes>",
    description: "Read specified number of bytes from a file",
    example: "read myfile.txt 100",
  },
  {
    name: "ls",
    icon: Terminal,
    usage: "ls",
    description: "List all files in the system with their details",
    example: "ls",
  },
  {
    name: "stat",
    icon: Info,
    usage: "stat <filename>",
    description: "Display detailed information about a file",
    example: "stat myfile.txt",
  },
  {
    name: "rm",
    icon: Trash2,
    usage: "rm <filename>",
    description: "Delete a file from the system",
    example: "rm myfile.txt",
  },
  {
    name: "truncate",
    icon: Scissors,
    usage: "truncate <filename>",
    description: "Remove all data from a file (file remains)",
    example: "truncate myfile.txt",
  },
  {
    name: "info",
    icon: Info,
    usage: "info",
    description: "Display system information (total, free, and used inodes)",
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed md:relative right-0 top-0 h-full w-full md:w-96 bg-card border-l border-primary/30 z-50 overflow-y-auto"
          >
            <div className="sticky top-0 bg-card border-b border-primary/30 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary text-glow-green">Command Reference</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted/50 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {commands.map((cmd, index) => (
                <motion.div
                  key={cmd.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-muted/30 border border-primary/20 rounded p-4 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <cmd.icon className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-primary">{cmd.name}</h3>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Usage:</span>
                      <code className="ml-2 text-accent font-mono">{cmd.usage}</code>
                    </div>
                    
                    <p className="text-muted-foreground">{cmd.description}</p>
                    
                    <div>
                      <span className="text-muted-foreground">Example:</span>
                      <code className="ml-2 text-warning font-mono bg-muted/50 px-2 py-1 rounded">
                        {cmd.example}
                      </code>
                    </div>
                  </div>
                </motion.div>
              ))}

              <div className="bg-muted/30 border border-accent/20 rounded p-4 mt-6">
                <h3 className="font-bold text-accent mb-2">💡 Tips</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Use ↑ and ↓ arrow keys to navigate command history</li>
                  <li>• File permissions: 1=READ, 2=WRITE, 3=READ+WRITE</li>
                  <li>• Maximum file size: 2048 bytes</li>
                  <li>• Maximum inodes: 50</li>
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
