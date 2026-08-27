# NextGen Virtual File System — Architecture

This document describes the complete architecture of **NextGen Virtual File System (NVFS)**: an educational, in-memory simulation of POSIX-style file management. NVFS is delivered as two cooperating products that share the same conceptual model:

1. **C++ core console** (`index.cpp`) — a native CLI kernel that allocates real heap buffers and walks linked inode lists.
2. **React + TypeScript dashboard** (`src/`) — a browser console that reimplements the same structures in TypeScript so students can visualize allocation, commands, and live inode usage.

No disk, kernel, or real `open(2)` syscall is involved. All metadata and file bytes live in process memory for the lifetime of the program (C++) or the page session (web).

---

## 1. Purpose and design goals

NVFS exists to make operating-system file-system internals *observable*:

- Show how a **superblock** tracks global capacity.
- Show how **inodes** store per-file metadata separate from data.
- Show how a **system file table** holds open-file state (offsets, mode, reference count).
- Show how a **user file descriptor table (UFDT)** maps small integer FDs to file-table entries.
- Expose a compact POSIX-inspired command set (`create`, `open`, `read`, `write`, `lseek`, `close`, `rm`, …).

Constraints are intentionally small so every table fits on one screen:

| Constant | Value | Meaning |
| :--- | :--- | :--- |
| `MAXINODE` | 50 | Maximum files / inodes in the Disk Inode List Block (DILB) |
| `MAXFILESIZE` | 2048 | Bytes allocated per regular file buffer |
| UFDT size | 50 | Maximum concurrently open file descriptors |
| File name | 50 chars | C++ `FileName[50]` |
| Permissions | 1 / 2 / 3 | READ / WRITE / READ+WRITE |
| File types | 1 / 2 | REGULAR / SPECIAL (C++ defines SPECIAL; operations target REGULAR) |
| `lseek` origins | 0 / 1 / 2 | START / CURRENT / END |

---

## 2. High-level system view

```
┌─────────────────────────────────────────────────────────────────┐
│                     Presentation layer                          │
│  C++ stdin/stdout REPL          React NVFS Terminal dashboard   │
│  (index.cpp main loop)          (Terminal, StatsPanel, Help)    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ parsed command tokens
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Command dispatcher                          │
│  create / open / read / write / lseek / close / closeall /      │
│  rm / truncate / ls / stat / fstat / man / help / info / clear  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Virtual kernel (in memory)                  │
│                                                                 │
│   Superblock ──► DILB (inode list) ──► per-file data buffer     │
│        ▲                    ▲                                   │
│        │                    │ inode pointer                     │
│        │             System File Table                          │
│        │                    ▲                                   │
│        │                    │ ptrfiletable                      │
│        └──────────── UFDT[0..49]  (FD = array index)            │
└─────────────────────────────────────────────────────────────────┘
```

Lookup path used by almost every I/O operation:

```
filename  →  UFDT scan (GetFDFromName)
          →  FILETABLE (mode, read offset, write offset, count)
          →  INODE (name, size, permission, type, Buffer)
          →  Buffer[offset .. offset+n]
```

Alternatively, metadata-only commands (`stat`, `ls`) walk the inode list without requiring an open FD. The C++ `rm` path can also reclaim an inode that is not currently open.

---

## 3. Dual implementation map

The two runtimes are **conceptually isomorphic**. They are not binary-compatible and do not share a process.

| Concern | C++ core (`index.cpp`) | TypeScript kernel (`src/lib/nvfs.ts`) | Web UI |
| :--- | :--- | :--- | :--- |
| Superblock | Global `SUPERBLOCKObj` | `NVFS.superBlock` | `StatsPanel` polls `getSystemInfo()` |
| Inodes | Singly linked list (`head`, `CreateDILB`) | `Map<number, INode>` | `ls` / `stat` tables in the terminal |
| File table | Heap `FILETABLE` per open | `FileTable` objects in `ufdt` | Not drawn; used by command handlers |
| UFDT | `UFDT UFDTArr[50]` | `Map<number, FileTable>` keyed by FD | FD printed on `create` |
| Data | `malloc(MAXFILESIZE)` per file | `inode.buffer: string` | `write` / `read` output lines |
| REPL | `main()` + `sscanf` | `Terminal.handleCommand` | Framer Motion output, toasts |
| Extra C++ ops | `open`, `closeall`, `lseek`, `fstat`, `man`, `exit` | Not exposed in the dashboard command switch | Help sidebar documents the web subset |

The dashboard is a **teaching visualization** of the same model. The C++ program remains the native kernel; the TypeScript kernel now matches Unix open-file semantics more closely: a **namespace** (name → inode number), a pre-allocated **DILB** of 50 inodes, **UFDT** slots with independent offsets, **hard links** (`link`), **unlink-while-open** (`rm` with nlink=0 until last `close`), and `open` / `lseek` / `fstat` / `closeall`.

---

## 4. Frontend architecture (React dashboard)

### 4.1 Stack

- **Vite 5** + **React 18** + **TypeScript 5**
- **Tailwind CSS** design tokens in `src/index.css` (HSL CSS variables)
- **shadcn/ui** primitives under `src/components/ui/`
- **Framer Motion** for line and panel animation
- **lucide-react** icons
- **sonner** toasts for create/write/delete/truncate feedback
- **React Router** (`/` console, `*` themed 404)

There is no backend, database, or WebSocket. The `NVFS` instance lives in a React `useRef` for the lifetime of the `Terminal` component. Refreshing the browser resets the file system.

### 4.2 Component topology

```
App.tsx
  QueryClientProvider / TooltipProvider / Toasters
  BrowserRouter
    Route "/"  →  pages/Index.tsx  →  components/Terminal.tsx
    Route "*"  →  pages/NotFound.tsx

Terminal.tsx
  ├── holds NVFS instance (useRef)
  ├── command history, output buffer, help visibility
  ├── StatsPanel.tsx     (500 ms poll of superblock + file count)
  └── HelpSidebar.tsx    (command manual overlay / dock)
```

**Data flow**

1. User submits a line in the prompt (`Fabulous NVFS :>`).
2. `handleCommand` tokenizes on whitespace and switches on the first word.
3. Handlers call `nvfsRef.current.*` methods.
4. Results are appended as color-coded `OutputLine` records (`command`, `success`, `error`, `info`, `warning`, `output`).
5. `StatsPanel` independently re-reads kernel state every 500 ms so inode bars stay live without lifting all command results into global state.

### 4.3 Web command surface

Implemented in `Terminal.tsx` (not a 1:1 copy of C++ `main`):

| Command | Kernel method | Notes |
| :--- | :--- | :--- |
| `help` | UI only | Opens `HelpSidebar` |
| `clear` | UI only | Clears output lines |
| `info` | `getSystemInfo()` | ASCII box of total / free / used inodes |
| `ls` | `listFiles()` | Table of name, inode, size, links, time |
| `create` | `createFile(name, perm)` | Allocates inode + UFDT entry; returns FD |
| `write` | `writeFile(name, data)` | Data is remaining argv tokens (or a demo default) |
| `read` | `readFile(name, bytes)` | Advances read offset |
| `rm` | `deleteFile(name)` | Requires an open UFDT entry in the TS kernel |
| `stat` | `getFileInfo(name)` | Inode metadata |
| `truncate` | `truncateFile(name)` | Zeroes buffer and offsets |
| `close` | `closeFile(name)` | Drops UFDT entry |

Arrow Up / Down walk `commandHistory`.

### 4.4 Visual layer (presentation only)

Appearance is driven by CSS tokens and layout chrome, not by kernel changes:

- Phosphor / cyan / amber semantic colors for success, info, and warning.
- CRT scan overlay, grid background, glass header, window traffic-light chrome.
- IBM Plex Mono for console text; Outfit for UI chrome.
- Stats cards map **Total Inodes**, **Free Inodes**, and **Total Files** onto the superblock + inode map.

---

## 5. C++ kernel architecture

### 5.1 Boot sequence

`main()` always:

1. `InitialiseSuperBlock()` — nulls all 50 UFDT slots; sets `TotalINodes = FreeInode = 50`.
2. `CreateDILB()` — allocates 50 inode nodes, numbered 1…50, `FileType = 0` (free), linked from `head`.
3. Enters an infinite REPL until `exit`.

### 5.2 Data structures (C)

**Superblock**

```c
typedef struct superblock {
    int TotalINodes;
    int FreeInode;
} SUPERBLOCK;
```

**Inode (DILB node)**

```c
typedef struct inode {
    char FileName[50];
    int InodeNumber;
    int FileSize;          /* allocated capacity, MAXFILESIZE */
    int FileActualSize;    /* logical size written */
    int FileType;          /* 0 free, REGULAR, SPECIAL */
    char *Buffer;          /* heap file contents */
    int LinkCount;
    int ReferenceCount;    /* open instances */
    int permission;        /* 1, 2, 3 */
    struct inode *next;
} INODE;
```

**File table entry (per open)**

```c
typedef struct filetable {
    int readoffest;        /* read cursor (spelling preserved from source) */
    int writeoffset;       /* write cursor */
    int count;
    int mode;              /* open mode 1/2/3 */
    PINODE ptrinode;
} FILETABLE;
```

**UFDT slot**

```c
typedef struct ufdt {
    PFILETABLE ptrfiletable;
} UFDT;

UFDT UFDTArr[50];
```

The FD returned to the user is the **index** into `UFDTArr`.

### 5.3 Operation catalog (C++)

| Function | Role |
| :--- | :--- |
| `CreateFile` | Find free inode (`FileType == 0`), allocate `FILETABLE` + 2048-byte buffer, bind UFDT slot, decrement `FreeInode`, return FD |
| `OpenFile` | Validate inode + permission vs mode, allocate new file-table + UFDT slot, increment `ReferenceCount` |
| `ReadFile` / `WriteFile` | Permission + mode checks, copy to/from `Buffer` at current offsets, clamp to `MAXFILESIZE` / EOF |
| `LseekFile` | Reposition read or write offset from START / CURRENT / END |
| `CloseFileByName` / `CloseAllFile` | Decrement `ReferenceCount`, free file-table, null UFDT slot (inode remains unless deleted) |
| `rm_File` | Unlink / reclaim inode and buffer; if not open, still clear DILB entry |
| `truncate_File` | `memset` buffer, reset offsets and actual size |
| `Ls_file` / `stat_file` / `fstat_file` | Metadata dump |
| `man` / `DisplayHelp` | Command documentation |

### 5.4 Create-file control flow (C++)

```
CreateFile(name, permission)
  reject invalid name / permission
  reject FreeInode == 0
  reject duplicate active name (Get_Inode)
  walk DILB for FileType == 0          → inode slot
  walk UFDTArr for NULL ptrfiletable   → FD
  malloc FILETABLE
  fill mode, offsets = 0, ptrinode
  copy name, set REGULAR, LinkCount=1, ReferenceCount=1
  malloc Buffer[MAXFILESIZE]
  FreeInode--
  return FD
```

Write/read then become **offset arithmetic on that buffer**, not path lookups on a disk.

---

## 6. TypeScript kernel architecture (`src/lib/nvfs.ts`)

The class `NVFS` is the in-browser analog of the globals in `index.cpp`.

**State**

- `namespace: Map<string, inodeNumber>` — directory-entry analog (flat, single directory).
- `inodes: Map<number, INode>` — pre-allocated DILB slots 1…50; `fileType === 0` means free.
- `ufdt: Map<number, FileTable>` — open files; keys are FDs 0…49. File-table entries store `inodeNumber`, not a copied name.
- `superBlock: { totalInodes, freeInode }`.

**Helpers**

- `getInodeByName` — namespace lookup, then DILB.
- `getFDFromName` — first UFDT slot whose inode matches that name.
- `getNextFD` / `allocInode` / `reclaimIfUnused` — FD and inode lifecycle.

**Web command surface (advanced)**

| Command | Kernel method |
| :--- | :--- |
| `create` / `open` / `close` / `closeall` | allocate/bind/drop UFDT |
| `read` / `write` / `lseek` | offset I/O with mode ∩ permission checks |
| `link` / `rm` | nlink++; unlink; reclaim when nlink=0 and refs=0 |
| `stat` / `fstat` / `truncate` / `ls` / `info` | metadata |
| `man` | static pages in the terminal |

The inspector (`InspectorPanel`) renders `NVFS.snapshot()`: namespace, active inodes (orphans highlighted), and UFDT.

---

## 7. Permission and offset model

Permissions and open modes use the same integers:

- `READ = 1`
- `WRITE = 2`
- `READ+WRITE = 3`

A write is allowed only if **both** the file-table `mode` and the inode `permission` include WRITE. A read is allowed only if both include READ (C++ `ReadFile`). The TypeScript `readFile` currently checks existence/open state and EOF, not mode bits; C++ is stricter.

Offsets:

- **Read offset** advances on `read` (and on `lseek` when the open mode includes read).
- **Write offset** advances on `write` (and on write-mode `lseek`).
- Logical file size (`FileActualSize`) is the high-water mark of the write cursor (and can grow on some `lseek` write paths in C++).

---

## 8. Repository layout

```
NextGen-Virtual-File-System/
├── index.cpp                 C++ kernel + REPL
├── architecture.md           This document
├── README.md                 User-facing overview and command table
├── index.html                SPA shell
├── package.json              Vite / React toolchain
├── src/
│   ├── main.tsx              React mount
│   ├── App.tsx               Providers + routes
│   ├── index.css             Design tokens and effects
│   ├── lib/nvfs.ts           TypeScript kernel
│   ├── pages/Index.tsx       Console route
│   ├── pages/NotFound.tsx    Unknown routes
│   └── components/
│       ├── Terminal.tsx      REPL + layout
│       ├── StatsPanel.tsx    Live superblock visualization
│       └── HelpSidebar.tsx   Command manual
└── public/                   Static assets
```

---

## 9. Runtime topologies

### Native

```
g++ index.cpp -o nvfs
./nvfs
```

Single process, blocking `fgets` loop, prints to stdout.

### Web

```
npm install
npm run dev     # Vite dev server, typically http://localhost:5173
```

Single-page app; all kernel calls are in-memory JavaScript on the main thread.

---

## 10. Educational mapping to a real Unix VFS

NVFS is a **simplified teaching analog**, not a Linux VFS clone.

| Unix idea | NVFS analog |
| :--- | :--- |
| Superblock | `SUPERBLOCK` / `SuperBlock` |
| Inode table / DILB | Linked inodes or `Map` of `INode` |
| `struct file` | `FILETABLE` |
| Per-process FD table | `UFDTArr` / `ufdt` |
| `dentry` / directory tree | Absent — flat single namespace |
| Block allocator / inode bitmap | `FreeInode` counter + `FileType == 0` |
| Page cache / buffer cache | Direct `Buffer` pointer / string |
| Persistence / journaling | None |
| Multi-user / credentials | None — one implicit user |

That reduction is deliberate: students can trace every pointer from FD to bytes without mount namespaces, dentries, or disk block groups.

---

## 11. Invariants

1. `FreeInode + (active files)` equals `MAXINODE` after successful create/delete in the C++ DILB model.
2. A non-null `UFDTArr[fd].ptrfiletable` always points at a valid `FILETABLE` whose `ptrinode` is a DILB node.
3. `FileActualSize` never exceeds `MAXFILESIZE`.
4. FD values are always in `0..49`.
5. Closing a file releases the file-table slot; deleting a file releases the inode (and buffer) back to the pool.
6. The web dashboard kernel is session-scoped: unmount or reload wipes all maps.

---

## 12. Summary

NVFS is a two-surface teaching file system: a **C++ in-memory kernel** with a classic UFDT → file table → inode → buffer chain, and a **React console** that visualizes a TypeScript translation of that chain. Architecture is intentionally shallow and explicit so every command is a walk across those four tables—not a hidden OS call.
