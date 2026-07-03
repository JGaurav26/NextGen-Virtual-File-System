# NextGen Virtual File System (NVFS)

[![C++](https://img.shields.io/badge/C%2B%2B-17-blue.svg?style=flat-square&logo=c%2B%2B)](https://isocpp.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?style=flat-square&logo=vite)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

**NextGen Virtual File System (NVFS)** is an educational in-memory virtual file system that simulates POSIX-style file system structures and operations. It features a complete **C++ Core Simulation Console** and a corresponding **Interactive React + TypeScript Terminal Web Dashboard** that visualizes file system stats, structures, and CLI commands directly in the browser.

🔗 **Live Web Demo**: [https://neon-vfs-console.lovable.app/](https://neon-vfs-console.lovable.app/)  
🛠️ **Project Workspace on Lovable**: [Lovable Project URL](https://lovable.dev/projects/509df011-b065-4114-a23e-c510df350589)

---

## 📸 Screenshots & Interface

The frontend dashboard provides a cyberpunk-style retro CRT terminal interface containing:
*   **Live CLI Console**: Run all virtual commands, navigate with Up/Down arrow keys for history, and see output lines color-coded by status.
*   **Real-time Statistics Panel**: Visual progress bars representing active Inode allocation, total free vs. used inodes, and total files count.
*   **Command Reference Sidebar**: Quick-access help panel listing all supported operations, their parameter usages, descriptions, and examples.

---

## 🏗️ Architectural Concept & System Design

The virtual file system simulates real-world operating system file management concepts by allocating memory buffers in a structured in-memory table.

```
       +---------------------------------------------+
       |             Interactive Console             |
       +----------------------+----------------------+
                              | Command Input
                              v
       +---------------------------------------------+
       |         User File Descriptor Table          |
       |                  (UFDT)                     |
       +----------------------+----------------------+
                              | Index Lookup
                              v
       +---------------------------------------------+
       |             System File Table               |
       |       (Read/Write Offsets, Mode, Count)     |
       +----------------------+----------------------+
                              | Inode Pointer
                              v
       +---------------------------------------------+
       |             Disk Inode List Block           |
       |                (DILB / Inodes)              |
       +----------------------+----------------------+
                              | Buffer Reference
                              v
       +---------------------------------------------+
       |                 File Buffer                 |
       |             (File Content / Data)           |
       +---------------------------------------------+
```

### Key Data Structures

1.  **Superblock**: Tracks system-wide metadata, specifically the total number of inodes (`50` by default) and the number of currently free inodes.
2.  **Inode (Index Node)**: Represents metadata for each file:
    *   File Name (Max 50 characters)
    *   Inode Number
    *   File Size (Max 2048 bytes)
    *   File Actual Size
    *   File Type (Regular/Special)
    *   Memory Buffer pointer (holds actual content)
    *   Link Count & Reference Count
    *   Permissions (Read, Write, Read+Write)
3.  **File Table**: Intermediate system-wide table storing read/write offsets, reference counts, access modes, and pointers to specific inodes.
4.  **User File Descriptor Table (UFDT)**: An array containing pointers to entries in the system-wide File Table. The array index is the file descriptor (FD) returned to the user upon file creation or opening.

---

## 💻 Terminal Commands Reference

| Command | Usage | Description | Example |
| :--- | :--- | :--- | :--- |
| **`create`** | `create <filename> <permission>` | Creates a new file with specified permission: `1` (Read), `2` (Write), `3` (Read+Write) | `create notes.txt 3` |
| **`write`** | `write <filename> <data>` | Writes data to an open file | `write notes.txt Hello World` |
| **`read`** | `read <filename> <bytes>` | Reads the specified number of bytes from the file starting at the read offset | `read notes.txt 100` |
| **`ls`** | `ls` | Lists all files present in the file system with their attributes | `ls` |
| **`stat`** | `stat <filename>` | Displays detailed file metadata (inode number, size, permissions, links, creation time) | `stat notes.txt` |
| **`fstat`** | `fstat <fd>` | Displays metadata using the file descriptor instead of file name | `fstat 0` |
| **`rm`** | `rm <filename>` | Deletes the file, releasing its buffer and inode back to the system | `rm notes.txt` |
| **`open`** | `open <filename> <mode>` | Opens an existing file in `1` (Read), `2` (Write), or `3` (Read+Write) mode | `open notes.txt 3` |
| **`close`** | `close <filename>` | Closes the file, removing its entry from the UFDT | `close notes.txt` |
| **`closeall`** | `closeall` | Closes all currently opened files | `closeall` |
| **`lseek`** | `lseek <filename> <offset> <from>` | Moves the read/write cursor: `0` (Start), `1` (Current), `2` (End) | `lseek notes.txt 5 0` |
| **`truncate`**| `truncate <filename>` | Clears all data inside a file without deleting the file entry | `truncate notes.txt` |
| **`info`** | `info` | View current system configuration, total inodes, and used vs free allocation | `info` |
| **`help`** | `help` / `man <cmd>` | Shows general instructions or specific manual page for a command | `man create` |
| **`clear`** | `clear` | Clears the terminal screen | `clear` |

---

## 🛠️ Getting Started & Installation

### 🖥️ 1. Running the C++ Core (CLI console)

To run the native C++ CLI virtual file system locally, you need a C++ compiler (like `g++`).

```sh
# Compile the C++ program
g++ index.cpp -o nvfs

# Run the executable
./nvfs
```

Inside the CLI console, you can run all commands listed in the commands reference table. Type `exit` to exit the C++ program.

### 🌐 2. Running the React Web Application

To run the interactive visual terminal locally in your browser, ensure you have **Node.js** (v18+) and **npm** installed.

```sh
# Clone the repository (or navigate to the project directory)
cd NextGen-Virtual-File-System

# Install dependencies
npm install

# Start the local development server
npm run dev
```

Open `http://localhost:5173` (or the port specified in terminal) in your browser to view the application.

---

## 📁 Repository Structure

*   [index.cpp](file:///Users/gauravjadhav/Documents/Gaurav/Programming/Github_Desktop/NextGen-Virtual-File-System/index.cpp): Core implementation of the virtual file system in C++.
*   `src/`: React frontend code.
    *   `src/lib/nvfs.ts`: TypeScript translation of the C++ structures and system logic.
    *   `src/components/Terminal.tsx`: Main interactive terminal interface.
    *   `src/components/StatsPanel.tsx`: Live Inode and file counters.
    *   `src/components/HelpSidebar.tsx`: Command manual slideout menu.
*   `public/`: Static web assets.

---

## 🧑‍💻 Developed By

*   **Gaurav Jadhav** (Information Technology Department)

If you find this project educational or useful, feel free to give the repository a ⭐!
