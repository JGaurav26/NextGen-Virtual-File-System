// NVFS (Next Gen Virtual File System) Logic
// Simulating the C++ file system in TypeScript

export const MAXINODE = 50;
export const MAXFILESIZE = 2048;
export const READ = 1;
export const WRITE = 2;
export const REGULAR = 1;

export interface INode {
  fileName: string;
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
  inode: INode | null;
}

export interface SuperBlock {
  totalInodes: number;
  freeInode: number;
}

export class NVFS {
  private inodes: Map<number, INode>;
  private ufdt: Map<number, FileTable>;
  private superBlock: SuperBlock;
  private nextInodeNumber: number;

  constructor() {
    this.inodes = new Map();
    this.ufdt = new Map();
    this.nextInodeNumber = 1;
    this.superBlock = {
      totalInodes: MAXINODE,
      freeInode: MAXINODE,
    };
  }

  private getInode(fileName: string): INode | null {
    for (const inode of this.inodes.values()) {
      if (inode.fileName === fileName && inode.fileType !== 0) {
        return inode;
      }
    }
    return null;
  }

  private getFDFromName(fileName: string): number {
    for (const [fd, ft] of this.ufdt.entries()) {
      if (ft.inode?.fileName === fileName) {
        return fd;
      }
    }
    return -1;
  }

  private getNextFD(): number {
    for (let i = 0; i < 50; i++) {
      if (!this.ufdt.has(i)) {
        return i;
      }
    }
    return -1;
  }

  createFile(fileName: string, permission: number): { success: boolean; message: string; fd?: number } {
    if (!fileName || permission < 1 || permission > 3) {
      return { success: false, message: "Invalid parameters" };
    }

    if (this.superBlock.freeInode === 0) {
      return { success: false, message: "No free inodes available" };
    }

    if (this.getInode(fileName)) {
      return { success: false, message: "File already exists" };
    }

    const fd = this.getNextFD();
    if (fd === -1) {
      return { success: false, message: "File table is full" };
    }

    const inode: INode = {
      fileName,
      inodeNumber: this.nextInodeNumber++,
      fileSize: MAXFILESIZE,
      fileActualSize: 0,
      fileType: REGULAR,
      buffer: "",
      linkCount: 1,
      referenceCount: 1,
      permission,
      creationTime: new Date(),
    };

    this.inodes.set(inode.inodeNumber, inode);
    
    const fileTable: FileTable = {
      readOffset: 0,
      writeOffset: 0,
      count: 1,
      mode: permission,
      inode,
    };

    this.ufdt.set(fd, fileTable);
    this.superBlock.freeInode--;

    return { success: true, message: `File '${fileName}' created successfully with FD: ${fd}`, fd };
  }

  writeFile(fileName: string, data: string): { success: boolean; message: string; bytesWritten?: number } {
    const fd = this.getFDFromName(fileName);
    if (fd === -1) {
      return { success: false, message: "File not found or not open" };
    }

    const ft = this.ufdt.get(fd)!;
    if ((ft.mode !== WRITE && ft.mode !== READ + WRITE) || 
        (ft.inode!.permission !== WRITE && ft.inode!.permission !== READ + WRITE)) {
      return { success: false, message: "No write permission" };
    }

    if (ft.writeOffset + data.length > MAXFILESIZE) {
      return { success: false, message: "File size limit exceeded" };
    }

    ft.inode!.buffer = ft.inode!.buffer.substring(0, ft.writeOffset) + data + ft.inode!.buffer.substring(ft.writeOffset + data.length);
    ft.writeOffset += data.length;
    ft.inode!.fileActualSize = Math.max(ft.inode!.fileActualSize, ft.writeOffset);

    return { success: true, message: `${data.length} bytes written to '${fileName}'`, bytesWritten: data.length };
  }

  readFile(fileName: string, bytes: number): { success: boolean; message: string; data?: string } {
    const fd = this.getFDFromName(fileName);
    if (fd === -1) {
      return { success: false, message: "File not found or not open" };
    }

    const ft = this.ufdt.get(fd)!;
    if (ft.readOffset >= ft.inode!.fileActualSize) {
      return { success: false, message: "End of file reached" };
    }

    const actualBytes = Math.min(bytes, ft.inode!.fileActualSize - ft.readOffset);
    const data = ft.inode!.buffer.substring(ft.readOffset, ft.readOffset + actualBytes);
    ft.readOffset += actualBytes;

    return { success: true, message: `Read ${actualBytes} bytes from '${fileName}'`, data };
  }

  deleteFile(fileName: string): { success: boolean; message: string } {
    const fd = this.getFDFromName(fileName);
    if (fd === -1) {
      return { success: false, message: "File not found" };
    }

    const ft = this.ufdt.get(fd)!;
    if (ft.inode) {
      this.inodes.delete(ft.inode.inodeNumber);
    }
    this.ufdt.delete(fd);
    this.superBlock.freeInode++;

    return { success: true, message: `File '${fileName}' deleted successfully` };
  }

  listFiles(): INode[] {
    return Array.from(this.inodes.values()).filter(inode => inode.fileType !== 0);
  }

  getFileInfo(fileName: string): { success: boolean; message: string; info?: INode } {
    const inode = this.getInode(fileName);
    if (!inode) {
      return { success: false, message: "File not found" };
    }
    return { success: true, message: "File info retrieved", info: inode };
  }

  truncateFile(fileName: string): { success: boolean; message: string } {
    const fd = this.getFDFromName(fileName);
    if (fd === -1) {
      return { success: false, message: "File not found" };
    }

    const ft = this.ufdt.get(fd)!;
    ft.inode!.buffer = "";
    ft.inode!.fileActualSize = 0;
    ft.readOffset = 0;
    ft.writeOffset = 0;

    return { success: true, message: `File '${fileName}' truncated successfully` };
  }

  getSystemInfo(): SuperBlock {
    return { ...this.superBlock };
  }

  closeFile(fileName: string): { success: boolean; message: string } {
    const fd = this.getFDFromName(fileName);
    if (fd === -1) {
      return { success: false, message: "File not found" };
    }

    this.ufdt.delete(fd);
    return { success: true, message: `File '${fileName}' closed` };
  }
}
