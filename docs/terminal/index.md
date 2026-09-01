---
outline: deep
---

# Terminal

Xed-Editor ships with a fully-featured terminal that runs **Ubuntu 24.04** Linux Rootfs
distribution inside a sandbox. It is used for running commands, executing scripts, hosting language
servers and running code through the [runners](/docs/runners/).

Because the terminal runs a complete Ubuntu root filesystem, everything works like on a normal Linux
machine: `apt`, `pip`, `npm`, compilers, Git, and so on.

::: warning
The terminal provides direct access to your filesystem and the ability to execute arbitrary
commands. Improper use of commands can permanently delete files or compromise the device. You are
responsible for understanding the commands you execute and their potential consequences.
:::

## How It Works

The terminal is not a toy shell that just emulates a few commands. It is a real Linux rootfs container
running on your Android device. To understand how that is possible, it helps to look at the layered
architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    Terminal UI (Compose)                │
│   TerminalView + VirtualKeysView + session drawer       │
├─────────────────────────────────────────────────────────┤
│                   Session management                    │
│   SessionService (foreground) + TerminalBackEnd         │
├─────────────────────────────────────────────────────────┤
│                    Terminal emulator                    │
│   TerminalSession / TerminalEmulator (upstream Termux)  │
├─────────────────────────────────────────────────────────┤
│                        Ubuntu shell                     │
│   bash --rcfile init  (the interactive shell)           │
├─────────────────────────────────────────────────────────┤
│                     PRoot sandbox                       │
│   libproot.so + libloader.so (user-space, no root)      │
├─────────────────────────────────────────────────────────┤
│                   Android / Linux kernel                │
└─────────────────────────────────────────────────────────┘
```

1. **Terminal UI** renders the screen buffer, captures touch input and shows the virtual key row.
2. **Sessions** are managed by a foreground [`SessionService`](#session-service) so they keep
   running even when the terminal screen is closed.
3. The **emulator** (upstream Termux code) turns the raw bytes from the shell into a character grid
   with colors, cursor position, scrollback, etc.
4. The **Ubuntu shell** (`bash`) reads input and writes output.
5. **PRoot** lets that Ubuntu userspace run on the Android kernel without root privileges.
6. The **Android kernel** actually executes everything. PRoot transparently rewrites filesystem and
   process operations so Ubuntu binaries believe they are running on a normal Linux machine.

## First Launch & Setup

The first time you open the terminal, Xed-Editor downloads and installs the Ubuntu root filesystem.
This only happens once.

### Download

Depending on your device's CPU architecture, one of these rootfs archives is downloaded:

| Architecture         | Download                                                            |
|----------------------|---------------------------------------------------------------------|
| `arm64-v8a` (64-bit) | `ubuntu-base-24.04.3-base-arm64.tar.gz`                             |
| `armeabi-v7a` (32-bit)| `ubuntu-base-24.04.3-base-armhf.tar.gz`                            |
| `x86_64`             | `ubuntu-base-24.04.3-base-amd64.tar.gz`                             |

The file is streamed to `cache/tempFiles/sandbox.tar.gz`. A progress screen with a live percentage
is shown while downloading. If the download is interrupted, it simply restarts from scratch the
next time.

### Extraction

When the download completes, the terminal starts in **extraction mode**. Instead of an interactive
shell, a special [`setup.sh`](#setup-script) script runs inside PRoot and:

1. Extracts `sandbox.tar.gz` into the sandbox directory using `tar`.
2. Writes a default `/etc/resolv.conf` (Google's `8.8.8.8` / `8.8.4.4`) and `/etc/hosts`.
3. Writes the hostname `Xed-Editor`.
4. Adds Android group entries (`inet`, `everybody`, `android_*`, ...) to `/etc/group` so app /
   storage permissions are recognized inside the container.
5. Installs an `apt` post-install hook that wraps Node.js with `jemalloc` (to reduce memory
   pressure when running Node inside the container).
6. Removes the downloaded archive and creates a marker file so the setup is not repeated.
7. Launches the normal sandbox shell.

On Samsung devices, running system binaries under PRoot can fail. The setup script detects this and
falls back to a direct extraction using a `liblink2symlink.so` preload library.

### The "Installed" Marker

Installation is tracked by a marker file:

```
<private>/local/.terminal_setup_ok_DO_NOT_REMOVE
```

`isTerminalInstalled()` returns `true` only when this marker exists **and** the rootfs directory is
non-empty. Deleting it will trigger a full reinstall on next launch.

## The Ubuntu Sandbox

The Ubuntu root filesystem lives inside the app's private storage:

| Path                    | Purpose                              |
|-------------------------|--------------------------------------|
| `<private>/local/sandbox` | The Ubuntu root filesystem (`/`)    |
| `<private>/local/home`    | The user's home directory (`$HOME`) |
| `<private>/local/bin`     | Helper scripts and tools             |
| `<private>/local/lib`     | Native libraries                     |
| `<private>/local/stat`    | Generated CPU stats (see below)      |
| `<private>/local/vmstat`  | Generated memory stats (see below)   |

### What is PRoot?

[PRoot](https://proot-me.github.io/) is a user-space implementation of `chroot`, `mount --bind` and
`sudo`. It uses the Linux `ptrace` mechanism to intercept the system calls made by the traced
process and transparently:

- **Translates paths** so `/usr`, `/etc`, ... resolve inside `<private>/local/sandbox` instead of
  the real Android filesystem.
- **Binds host directories** into the guest namespace, e.g. `/sdcard` appears inside the Ubuntu
  filesystem.
- **Fakes root** so `apt`, `dpkg`, useradd, etc. work even though the app runs as a normal
  (unprivileged) Android app.
- **Emulates some Linux features** that Android lacks (e.g. System V IPC, seccomp quirks).

No root access is needed. PRoot works entirely in user space by tracing syscalls.

### How Xed-Editor Invokes PRoot

Xed-Editor builds PRoot from source (the `proot` Gradle module) into three native binaries shipped
with the app:

| Binary                | Role                                                          |
|-----------------------|---------------------------------------------------------------|
| `libproot.so`         | The PRoot tracer (an executable renamed to `.so` for Android) |
| `libloader.so`        | 64-bit static loader used to bootstrap programs               |
| `libloader32.so`      | 32-bit static loader (when the device supports 32-bit ABIs)   |

A typical invocation looks like:

```sh
/system/bin/linker64 <nativeLibDir>/libproot.so \
    --kill-on-exit \
    -w / \
    -b /apex -b /odm -b /product -b /system ... \
    -b /sdcard -b /storage -b /dev -b /proc ... \
    -b $EXT_HOME:/home \
    -r <private>/local/sandbox \
    -0 --link2symlink --sysvipc -L \
    /bin/bash --rcfile <private>/local/bin/init -i
```

Key PRoot options used:

| Option            | Meaning                                                                   |
|-------------------|---------------------------------------------------------------------------|
| `-b host[:guest]` | Bind a host path into the guest filesystem (like `mount --bind`)          |
| `-r <path>`       | The guest root directory (`/`)                                            |
| `-0`              | Fake the root user (like `sudo`), so `apt`/`dpkg` work                    |
| `--link2symlink`  | Convert hard links into symbolic links (Android filesystems don't support them well) |
| `--sysvipc`       | Emulate System V IPC (shared memory, semaphores, message queues)          |
| `-L`              | Follow symlinks for `$PATH`-lookup                                          |
| `--kill-on-exit`  | Kill all traced processes when the parent exits                            |
| `-w <dir>`        | Working directory inside the guest                                        |

### Default Bindings

The following host paths are bound into the Ubuntu filesystem:

| Host path                                        | Guest path      | Why                                              |
|--------------------------------------------------|-----------------|--------------------------------------------------|
| `<private>/local/home`                           | `/home`         | User home directory                              |
| `<private>/local/home`                           | `/root`         | Root user's home (in `sandbox.sh`)               |
| `/sdcard`, `/storage`                            | (same)          | Shared/external storage                          |
| `/data`                                          | (same)          | App data                                         |
| `/dev`, `/proc`, `/sys`                          | (same)          | Device & kernel interfaces                       |
| `/dev/urandom`                                   | `/dev/random`   | Randomness                                       |
| `/system`, `/system_ext`, `/product`, `/odm`, `/apex`, `/vendor` | (same) | Android system partitions                |
| `/linkerconfig/ld.config.txt` and `/linkerconfig/com.android.art/ld.config.txt` | (same) | Android linker config      |
| `/plat_property_contexts`                        | `/property_contexts` | SELinux property contexts                 |
| temp dir (random)                                | `/dev/shm`      | Shared memory                                  |
| `<private>/local/stat`                           | `/proc/stat`    | Fake CPU stats (see [below](#proc-virtualization)) |
| `<private>/local/vmstat`                         | `/proc/vmstat`  | Fake memory stats (see [below](#proc-virtualization)) |

::: tip
Individual mounts can be excluded on demand. The runner API exposes an `excludeMounts` parameter,
and extension code can call `ubuntuProcess(excludeMounts = [...])` to run commands without certain
bindings.
:::

### Seccomp

Some devices (especially recent Snapdragon/MediaTek chips) return `Function not implemented`
errors when running certain syscalls inside PRoot. Xed-Editor lets you choose how PRoot handles
seccomp (the kernel's system call filter) in **Settings → Terminal → SECCOMP**:

| Value         | Effect                                                             |
|---------------|--------------------------------------------------------------------|
| `Unspecified` | Let PRoot decide (default)                                         |
| `Yes`         | Use PRoot's seccomp acceleration (`SECCOMP=1`)                     |
| `No`          | Disable seccomp (`PROOT_NO_SECCOMP=1`), use when syscalls fail          |

This setting is applied to every session and to every `ubuntuProcess` invocation.

## Shell Startup

Every interactive session launches `bash` with a custom rc-file:

```sh
$PROOT ... /bin/bash --rcfile $LOCAL/bin/init -i
```

The `init` script (installed from app assets into `<private>/local/bin/init`) is what makes the
shell feel like a real Ubuntu environment:

- Exports `PATH` to include the Ubuntu binaries and `$LOCAL/bin`.
- Sets a colorful `PS1` prompt (`user@host:/path $`).
- Sources helper utilities (`info`, `warn`, `error`, `ask`, ...).
- Creates the `xed` CLI symlink (see [below](#the-xed-command)).
- Configures the timezone (UTC) and sets `/etc/localtime`.
- Sources the user's `~/.bashrc` if present.
- Installs a small set of essential packages on first run (`command-not-found`, `sudo`,
  `xkb-data`, `libjemalloc-dev`) via `apt`, then removes the install hook.
- Installs a `command_not_found_handle` so unknown commands suggest packages to install.
- Adds useful aliases: `ls --color=auto`, `grep --color=auto`, `pkg='apt'`.
- Sources `/initrc` if present, then `cd`s to the working directory (`$WKDIR`).

### Where the Shell Starts (Working Directory)

The starting directory is determined in order:

1. If a command was launched with an explicit working directory (e.g. the universal runner passes
   the file's parent folder), that directory is used.
2. If the terminal was opened from a file/folder ("Open in terminal"), that path is used.
3. If **Settings → Terminal → Use project as working directory** is enabled and an editor tab is
   open, the current file's parent directory is used.
4. Otherwise it falls back to `/home` (sandboxed) or the sandbox home directory.

The working directory is exported as `WKDIR` and also used by the `init` script.

## Sessions

A **session** is a single running shell process connected to the terminal screen. You can have
multiple sessions open at once, each with its own shell, working directory and scrollback.

### Session Service

All sessions are owned by a foreground **`SessionService`** (an Android foreground service). This is
what lets the terminal keep running, and keep running *commands*, even when you leave the screen
or switch to another app. The service shows a persistent notification showing how many sessions are
running, with two actions:

- **Exit** kills all sessions and stops the service.
- **Wake lock** (acquire/release) toggles a partial wake lock so long-running commands aren't
  paused when the screen turns off.

The session service also hosts the [`xed` socket server](#the-xed-command) and the
[/proc virtualizer](#proc-virtualization).

### Managing Sessions

Open the navigation drawer in the terminal (tap the menu icon) to see all sessions. From there you
can:

- **Add a session** creates a new one named `main #1`, `main #2`, etc.
- **Switch sessions** tap a session to switch to it.
- **Rename sessions** tap the edit icon next to a session.
- **Delete sessions** tap the delete icon; if it was the current session, the terminal switches to
  a neighboring session first. Deleting the last session closes the terminal and stops the service.
- **Exit** when a session's process has finished, pressing Enter in that session terminates it
  and returns to the previous session (or finishes the activity).

### Session Environment

Each session is created with a rich environment. The most important variables:

| Variable             | Meaning                                                          |
|----------------------|------------------------------------------------------------------|
| `PROOT`              | Path to `libproot.so`                                            |
| `PROOT_LOADER`       | Path to `libloader.so`                                           |
| `PROOT_LOADER_32`    | Path to `libloader32.so` (32-bit devices)                        |
| `PROOT_TMP_DIR`      | Scratch dir for PRoot                                            |
| `WKDIR`              | The session's working directory                                  |
| `HOME`               | `/home` inside the sandbox (or the sandbox home on host)         |
| `EXT_HOME`           | Host path of the user's home                                     |
| `LOCAL`              | Host path of `<private>/local`                                   |
| `PRIVATE_DIR`        | Host path of the app's private dir                               |
| `NATIVE_LIB_DIR`     | Host path of the app's native libraries                          |
| `LD_LIBRARY_PATH`    | Where to find shared libraries                                   |
| `PATH`               | Ubuntu `PATH` plus `<private>/local/bin`                         |
| `TERM`               | `xterm-256color`                                                 |
| `COLORTERM`          | `truecolor`                                                      |
| `LANG`               | `C.UTF-8`                                                        |
| `TZ`                 | `UTC`                                                            |
| `TMPDIR` / `TMP_DIR` | The app's cache temp dir                                         |
| `SANDBOX`            | `true`/`false` (whether sandboxing is active)                    |
| `DISPLAY`            | `:0` (used by Termux:X11 for GUI apps)                           |
| `TERMUX_X11_SOURCE_DIR` | Path to the Termux:X11 APK, if installed                     |
| `SOURCE_DIR`         | Path of the Xed-Editor APK                                       |
| `SECCOMP` / `PROOT_NO_SECCOMP` | Set based on the seccomp setting                        |
| `DEBUG`              | Whether debug mode is enabled                                    |

It also forwards Android's own environment (`ANDROID_DATA`, `ANDROID_ROOT`, `BOOTCLASSPATH`, ...)
so Android binaries can run inside the container when needed.

### Failsafe Mode

In debug builds, **Settings → Terminal → Failsafe mode** starts the terminal *without* the Ubuntu
sandbox. It runs `/system/bin/sh` directly with a minimal set of bindings and environment. This is
useful for recovering a broken installation (e.g. when the rootfs fails to boot).

## Running Commands from the App

Besides the interactive shell, Xed-Editor frequently launches one-shot commands inside the sandbox.
This is handled by `ubuntuProcess()`, which builds the PRoot command line (bindings + root + flags)
and returns a standard `Process` handle.

```kotlin
// From extension/runner code:
val process = ubuntuProcess(
    workingDir = "/home/user/project",
    command = listOf("python3", "main.py"),
)
val exitCode = process.waitFor()
```

Helper extensions are provided for convenience: `readStdout()`, `readStderr()`, `writeInput()`,
`awaitExit()`, `terminate()`, `isRunning()`.

When a command needs to be shown in the terminal UI (rather than captured), the app sets a
**pending command** and opens the `Terminal` activity. The terminal picks the pending command and
creates a session for it. This is how the [universal runner](#runners) and file actions work.

## The `xed` Command

Inside the Ubuntu container, a command called `xed` is available. It lets the terminal tell the
editor to open files:

```sh
xed path/to/file.py path/to/other.txt
```

Implementation-wise, `xed` is a small native binary (`libxed_cli.so`) that:

1. Connects to a **local UNIX domain socket** named `xed_socket` in the abstract namespace.
2. Sends the current working directory, followed by each file argument, NUL-terminated.
3. The app (which hosts a `LocalServerSocket` on that name while the session service is running)
   receives the paths, resolves relative paths against the CWD, and opens each file in a new editor
   tab.

This is how scripts and runners can open files directly in the editor.

## /proc Virtualization

Android restricts real CPU/memory statistics, so the terminal would see empty `/proc/stat` and
`/proc/vmstat` files, breaking tools like `top`, `htop`, `neofetch`, and load reporting.

Xed-Editor solves this with a background **StatUpdater** (started with the session service) that
every second:

- Reads the app's *real* CPU usage from `/proc/<pid>/stat` of its own processes and computes
  per-core deltas.
- Adds a small simulated background load so the numbers look alive.
- Distributes ticks across the actual number of cores.
- Writes a well-formed `/proc/stat` file (with `cpu`, `cpu0..N`, `intr`, `ctxt`, `btime`, ...).
- Reads the *real* memory info via `ActivityManager.MemoryInfo` and writes a realistic
  `/proc/vmstat` file (free pages, anon/file pages, swap, page faults, ...).

These files live at `<private>/local/stat` and `<private>/local/vmstat` and are bound into the
container at `/proc/stat` and `/proc/vmstat` (see [default bindings](#default-bindings)).

### Virtual Keys / Extra Keys

The extra keys row follows the **Termux extra keys** format, a JSON array of rows, where each row
is a list of keys. You can edit it in **Settings → Terminal → Change extra keys**.

Each key can be:

- A simple string: `"ESC"`, `"TAB"`, `"HOME"`, `"UP"`, `"PGDN"`, ...
- An object with a `key` and optional `popup` for swipe-up alternatives:
  `{"key": "-", "popup": "|"}`.
- A `macro` for key combinations: `{"macro": "CTRL C", "display": "copy"}`.

Aliases are supported (e.g. `ESCAPE` → `ESC`, `RETURN` → `ENTER`, `PAGE_UP` → `PGUP`). The default
layout is:

```json
[
  ["ESC", {"key": "/", "popup": "\\"}, {"key": "-", "popup": "|"}, "HOME", "UP", "END", "PGUP"],
  ["TAB", "CTRL", "ALT", "LEFT", "DOWN", "RIGHT", "PGDN"]
]
```

CTRL / ALT / SHIFT / FN are toggles, tap them once to apply the modifier to the next key.

### Colors & Fonts

The terminal respects the active theme:

- Colors come from the theme's `terminalColors` palette plus the theme's `onSurface` (foreground)
  and `surface` (background).
- Font size can be adjusted with **Settings → Terminal → Text size** (10–20) or by pinch-zooming
  directly on the screen (11–45 range).
- The font can be changed in **Settings → Terminal → Manage terminal fonts**.

::: warning
If the sandbox contains a font at `etc/font.ttf`, it overrides the custom font setting. Delete that
file inside the terminal to use the configured font instead.
:::

### Cursor Style

Choose the cursor shape in **Settings → Terminal → Cursor style**: block, bar or underline. The
cursor also blinks while a session is running.

## Settings Reference

All terminal settings live under **Settings → Terminal**:

| Setting                      | Description                                                                  |
|------------------------------|------------------------------------------------------------------------------|
| Text size                    | Font size in the terminal (10–20)                                            |
| Manage terminal fonts        | Choose a custom font file                                                    |
| Cursor style                 | Block, bar or underline cursor                                               |
| SECCOMP                      | Seccomp handling for PRoot (see above)                                       |
| Terminal health              | Runs diagnostics (see below)                                                 |
| Change extra keys            | Edit the virtual keys row (Termux format)                                    |
| Clipboard keybindings        | Enable Ctrl+C/Ctrl+V style clipboard shortcuts                                |
| Scrollback buffer size       | Lines of history kept in memory (100–50,000; default 5,000), requires a restart |
| Terminate all sessions       | Kill all sessions when the app is closed                                     |
| Use project as working directory | Start the shell in the current project/editor folder                     |
| Expose home directory        | Make the terminal home accessible to external apps via the system file picker (SAF) |
| Failsafe mode (debug only)   | Run `/system/bin/sh` directly without the Ubuntu sandbox                     |
| Backup                       | Create a `terminal-backup.tar.gz` of the sandbox                             |
| Restore                      | Restore the sandbox from a backup archive                                    |
| Uninstall terminal           | Permanently remove the Ubuntu rootfs, helpers and marker file                |

### Backup & Restore

Backups are full `tar.gz` archives of the sandbox rootfs, excluding volatile/system directories
(`dev`, `sys`, `proc`, `system`, `apex`, `vendor`, `data`, `home`, `root`, caches, ...).

- **Backup** lets you pick a location via the system file picker and writes the archive there.
- **Restore** reads an archive, wipes the sandbox and extracts it, then re-creates the installed
  marker.

### Uninstalling

"Uninstall terminal" deletes `<private>/local/bin`, `<private>/local/lib`, the sandbox rootfs and
the installed marker. The next time the terminal is opened, a fresh Ubuntu is downloaded and
installed.
