export const MAXINODE = 50;
export const MAXFILESIZE = 2048;
export const MAXFD = 50;
export const READ = 1;
export const WRITE = 2;
export const READ_WRITE = 3;
export const REGULAR = 1;
export const START = 0;
export const CURRENT = 1;
export const END = 2;

export const modeLabel = (mode: number) => {
  if (mode === READ) return "R";
  if (mode === WRITE) return "W";
  if (mode === READ_WRITE) return "RW";
  return String(mode);
};

const allowsRead = (mode: number) => mode === READ || mode === READ_WRITE;
const allowsWrite = (mode: number) => mode === WRITE || mode === READ_WRITE;

const modePermitted = (permission: number, requested: number) => {
  if (requested === READ) return allowsRead(permission);
  if (requested === WRITE) return allowsWrite(permission);
  if (requested === READ_WRITE) return permission === READ_WRITE;
  return false;
};

export interface INode {
  inodeNumber: number;
  fileSize: number;
  fileActualSize: number;
  fileType: number;
  buffer: string;
  linkCount: number;
  referenceCount: number;
  permission: number;
  creationTime: Date;
}

export interface FileTable {
  readOffset: number;
  writeOffset: number;
  count: number;
  mode: number;
  inodeNumber: number;
}

export interface SuperBlock {
  totalInodes: number;
  freeInode: number;
}

export interface NamedFile {
  fileName: string;
  inodeNumber: number;
  fileSize: number;
  fileActualSize: number;
  fileType: number;
  linkCount: number;
  referenceCount: number;
  permission: number;
  creationTime: Date;
}

export interface UfdtRow {
  fd: number;
  mode: number;
  readOffset: number;
  writeOffset: number;
  inodeNumber: number;
  count: number;
}

export interface InodeRow {
  inodeNumber: number;
  fileType: number;
  fileActualSize: number;
  fileSize: number;
  linkCount: number;
  referenceCount: number;
  permission: number;
  names: string[];
  orphaned: boolean;
}

export interface KernelSnapshot {
  superBlock: SuperBlock;
  namespace: { name: string; inodeNumber: number }[];
  inodes: InodeRow[];
  ufdt: UfdtRow[];
}

export class NVFS {
  private namespace: Map<string, number>;
  private inodes: Map<number, INode>;
  private ufdt: Map<number, FileTable>;
  private superBlock: SuperBlock;

  constructor() {
    this.namespace = new Map();
    this.inodes = new Map();
    this.ufdt = new Map();
    this.superBlock = { totalInodes: MAXINODE, freeInode: MAXINODE };
    for (let i = 1; i <= MAXINODE; i++) {
      this.inodes.set(i, this.emptyInode(i));
    }
  }

  private emptyInode(inodeNumber: number): INode {
    return {
      inodeNumber,
      fileSize: 0,
      fileActualSize: 0,
      fileType: 0,
      buffer: "",
      linkCount: 0,
      referenceCount: 0,
      permission: 0,
      creationTime: new Date(0),
    };
  }

  private namesFor(inodeNumber: number): string[] {
    return [...this.namespace.entries()]
      .filter(([, ino]) => ino === inodeNumber)
      .map(([name]) => name);
  }

  private displayName(inode: INode): string {
    return this.namesFor(inode.inodeNumber)[0] ?? `(inode ${inode.inodeNumber})`;
  }

  private getInodeByName(fileName: string): INode | null {
    const n = this.namespace.get(fileName);
    if (n === undefined) return null;
    const inode = this.inodes.get(n);
    if (!inode || inode.fileType === 0) return null;
    return inode;
  }

  private getFDFromName(fileName: string): number {
    const inode = this.getInodeByName(fileName);
    if (!inode) return -1;
    for (const [fd, ft] of this.ufdt.entries()) {
      if (ft.inodeNumber === inode.inodeNumber) return fd;
    }
    return -1;
  }

  private getNextFD(): number {
    for (let i = 0; i < MAXFD; i++) {
      if (!this.ufdt.has(i)) return i;
    }
    return -1;
  }

  private allocInode(): INode | null {
    for (const inode of this.inodes.values()) {
      if (inode.fileType === 0) return inode;
    }
    return null;
  }

  private reclaimIfUnused(inode: INode) {
    if (inode.linkCount > 0 || inode.referenceCount > 0) return;
    this.inodes.set(inode.inodeNumber, this.emptyInode(inode.inodeNumber));
    this.superBlock.freeInode++;
  }

  private bindFd(inode: INode, mode: number): number {
    const fd = this.getNextFD();
    if (fd === -1) return -1;
    this.ufdt.set(fd, {
      readOffset: 0,
      writeOffset: 0,
      count: 1,
      mode,
      inodeNumber: inode.inodeNumber,
    });
    inode.referenceCount++;
    return fd;
  }

  private closeSlot(fd: number): boolean {
    const ft = this.ufdt.get(fd);
    if (!ft) return false;
    const inode = this.inodes.get(ft.inodeNumber);
    this.ufdt.delete(fd);
    if (inode) {
      inode.referenceCount = Math.max(0, inode.referenceCount - 1);
      this.reclaimIfUnused(inode);
    }
    return true;
  }

  createFile(fileName: string, permission: number): { success: boolean; message: string; fd?: number } {
    if (!fileName || permission < 1 || permission > 3) {
      return { success: false, message: "Invalid parameters" };
    }
    if (this.superBlock.freeInode === 0) {
      return { success: false, message: "No free inodes available" };
    }
    if (this.namespace.has(fileName)) {
      return { success: false, message: "File already exists" };
    }

    const inode = this.allocInode();
    if (!inode) {
      return { success: false, message: "No free inodes available" };
    }

    const fd = this.getNextFD();
    if (fd === -1) {
      return { success: false, message: "File table is full" };
    }

    inode.fileSize = MAXFILESIZE;
    inode.fileActualSize = 0;
    inode.fileType = REGULAR;
    inode.buffer = "";
    inode.linkCount = 1;
    inode.referenceCount = 0;
    inode.permission = permission;
    inode.creationTime = new Date();

    this.namespace.set(fileName, inode.inodeNumber);
    this.superBlock.freeInode--;

    const opened = this.bindFd(inode, permission);
    return {
      success: true,
      message: `File '${fileName}' created with inode ${inode.inodeNumber}, FD ${opened}`,
      fd: opened,
    };
  }

  openFile(fileName: string, mode: number): { success: boolean; message: string; fd?: number } {
    if (!fileName || mode < 1 || mode > 3) {
      return { success: false, message: "Invalid parameters" };
    }
    const inode = this.getInodeByName(fileName);
    if (!inode) {
      return { success: false, message: "File not present" };
    }
    if (!modePermitted(inode.permission, mode)) {
      return { success: false, message: "Permission denied" };
    }
    const fd = this.bindFd(inode, mode);
    if (fd === -1) {
      return { success: false, message: "File table is full" };
    }
    return { success: true, message: `File '${fileName}' opened with FD ${fd}`, fd };
  }

  writeFile(fileName: string, data: string): { success: boolean; message: string; bytesWritten?: number } {
    const fd = this.getFDFromName(fileName);
    if (fd === -1) {
      return { success: false, message: "File is not open. Use open <filename> <mode>" };
    }

    const ft = this.ufdt.get(fd)!;
    const inode = this.inodes.get(ft.inodeNumber)!;

    if (!allowsWrite(ft.mode) || !allowsWrite(inode.permission)) {
      return { success: false, message: "Permission denied" };
    }
    if (inode.fileType !== REGULAR) {
      return { success: false, message: "Not a regular file" };
    }
    if (ft.writeOffset + data.length > MAXFILESIZE) {
      return { success: false, message: "File size limit exceeded" };
    }

    const buf = inode.buffer.padEnd(ft.writeOffset, "\0");
    inode.buffer =
      buf.substring(0, ft.writeOffset) + data + buf.substring(ft.writeOffset + data.length);
    ft.writeOffset += data.length;
    inode.fileActualSize = Math.max(inode.fileActualSize, ft.writeOffset);

    return {
      success: true,
      message: `${data.length} bytes written to '${fileName}' via FD ${fd}`,
      bytesWritten: data.length,
    };
  }

  readFile(fileName: string, bytes: number): { success: boolean; message: string; data?: string } {
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return { success: false, message: "Invalid number of bytes" };
    }
    const fd = this.getFDFromName(fileName);
    if (fd === -1) {
      return { success: false, message: "File is not open. Use open <filename> <mode>" };
    }

    const ft = this.ufdt.get(fd)!;
    const inode = this.inodes.get(ft.inodeNumber)!;

    if (!allowsRead(ft.mode) || !allowsRead(inode.permission)) {
      return { success: false, message: "Permission denied" };
    }
    if (inode.fileType !== REGULAR) {
      return { success: false, message: "Not a regular file" };
    }
    if (ft.readOffset >= inode.fileActualSize) {
      return { success: false, message: "End of file reached" };
    }

    const actualBytes = Math.min(bytes, inode.fileActualSize - ft.readOffset);
    const data = inode.buffer.substring(ft.readOffset, ft.readOffset + actualBytes);
    ft.readOffset += actualBytes;

    return { success: true, message: `Read ${actualBytes} bytes from '${fileName}' via FD ${fd}`, data };
  }

  deleteFile(fileName: string): { success: boolean; message: string } {
    const inode = this.getInodeByName(fileName);
    if (!inode) {
      return { success: false, message: "File not found" };
    }

    this.namespace.delete(fileName);
    inode.linkCount = Math.max(0, inode.linkCount - 1);

    const stillOpen = inode.referenceCount > 0;
    this.reclaimIfUnused(inode);

    if (inode.linkCount === 0 && stillOpen) {
      return {
        success: true,
        message: `Unlinked '${fileName}'. Inode ${inode.inodeNumber} stays until last close (nlink=0, refs=${inode.referenceCount})`,
      };
    }
    if (inode.linkCount > 0) {
      return {
        success: true,
        message: `Removed name '${fileName}'. Inode ${inode.inodeNumber} still has ${inode.linkCount} link(s)`,
      };
    }
    return { success: true, message: `File '${fileName}' deleted; inode ${inode.inodeNumber} reclaimed` };
  }

  linkFile(oldName: string, newName: string): { success: boolean; message: string } {
    if (!oldName || !newName) {
      return { success: false, message: "Usage: link <oldname> <newname>" };
    }
    const inode = this.getInodeByName(oldName);
    if (!inode) {
      return { success: false, message: "Source file not found" };
    }
    if (this.namespace.has(newName)) {
      return { success: false, message: "Target name already exists" };
    }
    this.namespace.set(newName, inode.inodeNumber);
    inode.linkCount++;
    return {
      success: true,
      message: `Linked '${newName}' → inode ${inode.inodeNumber} (nlink=${inode.linkCount})`,
    };
  }

  listFiles(): NamedFile[] {
    return [...this.namespace.entries()].map(([fileName, inodeNumber]) => {
      const inode = this.inodes.get(inodeNumber)!;
      return {
        fileName,
        inodeNumber,
        fileSize: inode.fileSize,
        fileActualSize: inode.fileActualSize,
        fileType: inode.fileType,
        linkCount: inode.linkCount,
        referenceCount: inode.referenceCount,
        permission: inode.permission,
        creationTime: inode.creationTime,
      };
    });
  }

  getFileInfo(fileName: string): { success: boolean; message: string; info?: NamedFile } {
    const inode = this.getInodeByName(fileName);
    if (!inode) {
      return { success: false, message: "File not found" };
    }
    return {
      success: true,
      message: "File info retrieved",
      info: {
        fileName,
        inodeNumber: inode.inodeNumber,
        fileSize: inode.fileSize,
        fileActualSize: inode.fileActualSize,
        fileType: inode.fileType,
        linkCount: inode.linkCount,
        referenceCount: inode.referenceCount,
        permission: inode.permission,
        creationTime: inode.creationTime,
      },
    };
  }

  fstat(fd: number): { success: boolean; message: string; info?: NamedFile & { fd: number; mode: number; readOffset: number; writeOffset: number } } {
    const ft = this.ufdt.get(fd);
    if (fd < 0 || fd >= MAXFD || !ft) {
      return { success: false, message: "Invalid or unused file descriptor" };
    }
    const inode = this.inodes.get(ft.inodeNumber)!;
    return {
      success: true,
      message: "fstat ok",
      info: {
        fd,
        mode: ft.mode,
        readOffset: ft.readOffset,
        writeOffset: ft.writeOffset,
        fileName: this.displayName(inode),
        inodeNumber: inode.inodeNumber,
        fileSize: inode.fileSize,
        fileActualSize: inode.fileActualSize,
        fileType: inode.fileType,
        linkCount: inode.linkCount,
        referenceCount: inode.referenceCount,
        permission: inode.permission,
        creationTime: inode.creationTime,
      },
    };
  }

  truncateFile(fileName: string): { success: boolean; message: string } {
    const fd = this.getFDFromName(fileName);
    if (fd === -1) {
      return { success: false, message: "File is not open" };
    }
    const ft = this.ufdt.get(fd)!;
    const inode = this.inodes.get(ft.inodeNumber)!;
    inode.buffer = "";
    inode.fileActualSize = 0;
    for (const open of this.ufdt.values()) {
      if (open.inodeNumber === inode.inodeNumber) {
        open.readOffset = 0;
        open.writeOffset = 0;
      }
    }
    return { success: true, message: `File '${fileName}' truncated` };
  }

  lseekFile(fileName: string, offset: number, whence: number): { success: boolean; message: string } {
    const fd = this.getFDFromName(fileName);
    if (fd === -1) {
      return { success: false, message: "File is not open" };
    }
    if (![START, CURRENT, END].includes(whence) || !Number.isFinite(offset)) {
      return { success: false, message: "Invalid lseek parameters (from: 0=START 1=CURRENT 2=END)" };
    }

    const ft = this.ufdt.get(fd)!;
    const inode = this.inodes.get(ft.inodeNumber)!;

    const move = (cursor: number, cap: number) => {
      let next = cursor;
      if (whence === START) next = offset;
      else if (whence === CURRENT) next = cursor + offset;
      else next = inode.fileActualSize + offset;
      if (next < 0 || next > cap) return null;
      return next;
    };

    if (allowsRead(ft.mode)) {
      const next = move(ft.readOffset, inode.fileActualSize);
      if (next === null) return { success: false, message: "lseek out of bounds (read offset)" };
      ft.readOffset = next;
    }
    if (allowsWrite(ft.mode)) {
      const next = move(ft.writeOffset, MAXFILESIZE);
      if (next === null) return { success: false, message: "lseek out of bounds (write offset)" };
      if (next > inode.fileActualSize) inode.fileActualSize = next;
      ft.writeOffset = next;
    }

    return {
      success: true,
      message: `lseek FD ${fd}: read=${ft.readOffset} write=${ft.writeOffset}`,
    };
  }

  getSystemInfo(): SuperBlock {
    return { ...this.superBlock };
  }

  closeFile(fileName: string): { success: boolean; message: string } {
    const fd = this.getFDFromName(fileName);
    if (fd === -1) {
      return { success: false, message: "There is no such open file" };
    }
    this.closeSlot(fd);
    return { success: true, message: `Closed '${fileName}' (FD ${fd})` };
  }

  closeAll(): { success: boolean; message: string } {
    const fds = [...this.ufdt.keys()];
    fds.forEach((fd) => this.closeSlot(fd));
    return { success: true, message: `Closed ${fds.length} open file descriptor(s)` };
  }

  snapshot(): KernelSnapshot {
    const activeInodes: InodeRow[] = [];
    for (const inode of this.inodes.values()) {
      if (inode.fileType === 0 && inode.referenceCount === 0) continue;
      const names = this.namesFor(inode.inodeNumber);
      activeInodes.push({
        inodeNumber: inode.inodeNumber,
        fileType: inode.fileType,
        fileActualSize: inode.fileActualSize,
        fileSize: inode.fileSize,
        linkCount: inode.linkCount,
        referenceCount: inode.referenceCount,
        permission: inode.permission,
        names,
        orphaned: inode.fileType !== 0 && names.length === 0,
      });
    }

    return {
      superBlock: { ...this.superBlock },
      namespace: [...this.namespace.entries()].map(([name, inodeNumber]) => ({ name, inodeNumber })),
      inodes: activeInodes,
      ufdt: [...this.ufdt.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([fd, ft]) => ({
          fd,
          mode: ft.mode,
          readOffset: ft.readOffset,
          writeOffset: ft.writeOffset,
          inodeNumber: ft.inodeNumber,
          count: ft.count,
        })),
    };
  }
}
