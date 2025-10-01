<p align="center">
  <img src="https://img.shields.io/badge/Project-NextGen%20Virtual%20File%20System-green?style=for-the-badge&logo=linux" alt="NVFS Logo">
</p>

<h1 align="center">📂 NextGen Virtual File System (NVFS) 📂</h1>

<p align="center">
  <b>A C-based system programming project that emulates core functionalities of UNIX-like file systems.</b>  
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Language-C-blue?style=flat-square&logo=c" alt="Language">  
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-lightgrey?style=flat-square&logo=linux" alt="Platform">  
  <img src="https://img.shields.io/badge/Status-Completed-success?style=flat-square" alt="Status">  
</p>

---

## 🚀 Features
- Emulation of **file system data structures**:  
  - Inode Table  
  - File Table  
  - User File Descriptor Table (UAREA)  
  - Superblock  
  - Disk Inode List Block  
  - Data Blocks & Boot Block  

- Implementation of **system calls**:  
  `open`, `close`, `read`, `write`, `lseek`, `stat`, `chmod`, `unlink`

- Support for UNIX-like **commands**:  
  `ls`, `ls -l`, `ls -a`, `rm`, `cat`, `cd`, `chmod`, `cp`, `df`, `find`, `grep`, `ln`, `mkdir`, `pwd`, `touch`, `uname`, `man`, `mkfs`

- Demonstrates **internal working** of system calls and commands  
- Lightweight **learning tool** for File System architecture & algorithms  

---

## 🛠️ Technology Stack
- **Language:** C (System Programming)  
- **Platform:** Windows NT / Linux distributions  
- **Architecture:** Intel 32-bit processor  
- **Interface:** Command-Line Interface (CLI)  

---

## 📖 Project Overview
NVFS replicates the **behavior of UNIX File Systems** in a virtual environment, storing and manipulating records in **primary storage (RAM)**.  
It serves as a **hands-on tool** to learn how file systems are structured and how system calls interact with underlying data structures.  

---

## 📂 Data Structures
- **Inode** – Represents files and metadata  
- **File Table** – Tracks open files  
- **User File Descriptor Table (UAREA)** – Maps user processes to files  
- **Superblock** – Contains global FS metadata  
- **Disk Inode List Block** – Manages inode storage  
- **Data Blocks** – Store actual file content  

---

## 📊 Project Flow
1. Initialize core data structures  
2. Create & manage files/directories  
3. Execute file system commands  
4. Handle system calls internally  
5. Display results on CLI  

---
<!--
## 📸 Demo
Add screenshots here to showcase:
- File creation & manipulation  
- Directory operations  
- System call handling  

*(Tip: Use `![Alt text](image.png)` to add screenshots once you push them into the repo)*
---
-->

## 📚 References
- *Advanced Programming in the UNIX Environment* – W. Richard Stevens  
- UNIX File System documentation  

---

## 💡 Possible Improvements
- GUI-based interface for visualization  
- 64-bit platform support  
- Extension to persistent storage instead of primary memory  

---

## 📌 Usage
```bash
# Compile
g++ nvfs.c -o nvfs

# Run
./nvfs
