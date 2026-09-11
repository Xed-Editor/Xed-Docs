# Terminal for Advanced Users

This section documents the internal details of Xed-Editor's terminal for developers and advanced
users who need to understand or customize how the Ubuntu environment is integrated with Android.

It covers the root filesystem setup, PRoot configuration, filesystem bindings, shell initialization,
session environment, and the `xed` command. Most users do not need to change or interact with these
components.

## Terminal Extraction
The special `setup.sh` script runs inside PRoot when opening the Terminal for the first time and:

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

## Default Bindings

The following host paths are bound into the Ubuntu filesystem:

| Host path                                                                       | Guest path           | Why                                                           |
|---------------------------------------------------------------------------------|----------------------|---------------------------------------------------------------|
| `<private>/local/home`                                                          | `/home`              | User home directory                                           |
| `<private>/local/home`                                                          | `/root`              | Root user's home (in `sandbox.sh`)                            |
| `/sdcard`, `/storage`                                                           | (same)               | Shared/external storage                                       |
| `/data`                                                                         | (same)               | App data                                                      |
| `/dev`, `/proc`, `/sys`                                                         | (same)               | Device & kernel interfaces                                    |
| `/dev/urandom`                                                                  | `/dev/random`        | Randomness                                                    |
| `/system`, `/system_ext`, `/product`, `/odm`, `/apex`, `/vendor`                | (same)               | Android system partitions                                     |
| `/linkerconfig/ld.config.txt` and `/linkerconfig/com.android.art/ld.config.txt` | (same)               | Android linker config                                         |
| `/plat_property_contexts`                                                       | `/property_contexts` | SELinux property contexts                                     |
| temp dir (random)                                                               | `/dev/shm`           | Shared memory                                                 |
| `<private>/local/stat`                                                          | `/proc/stat`         | Fake CPU stats (see [below](index.md#proc-virtualization))    |
| `<private>/local/vmstat`                                                        | `/proc/vmstat`       | Fake memory stats (see [below](index.md#proc-virtualization)) |

::: tip
Individual mounts can be excluded on demand. The extension code can call
`ubuntuProcess(excludeMounts = [...])` to run commands without certain
bindings.
:::

## How Xed-Editor Invokes PRoot

Xed-Editor builds PRoot from source (the `proot` Gradle module) into three native binaries shipped
with the app:

| Binary           | Role                                                          |
|------------------|---------------------------------------------------------------|
| `libproot.so`    | The PRoot tracer (an executable renamed to `.so` for Android) |
| `libloader.so`   | 64-bit static loader used to bootstrap programs               |
| `libloader32.so` | 32-bit static loader (when the device supports 32-bit ABIs)   |

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

| Option            | Meaning                                                                              |
|-------------------|--------------------------------------------------------------------------------------|
| `-b host[:guest]` | Bind a host path into the guest filesystem (like `mount --bind`)                     |
| `-r <path>`       | The guest root directory (`/`)                                                       |
| `-0`              | Fake the root user (like `sudo`), so `apt`/`dpkg` work                               |
| `--link2symlink`  | Convert hard links into symbolic links (Android filesystems don't support them well) |
| `--sysvipc`       | Emulate System V IPC (shared memory, semaphores, message queues)                     |
| `-L`              | Follow symlinks for `$PATH`-lookup                                                   |
| `--kill-on-exit`  | Kill all traced processes when the parent exits                                      |
| `-w <dir>`        | Working directory inside the guest                                                   |


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

## Session Environment

Each session is created with a rich environment. The most important variables:

| Variable                       | Meaning                                                  |
|--------------------------------|----------------------------------------------------------|
| `PROOT`                        | Path to `libproot.so`                                    |
| `PROOT_LOADER`                 | Path to `libloader.so`                                   |
| `PROOT_LOADER_32`              | Path to `libloader32.so` (32-bit devices)                |
| `PROOT_TMP_DIR`                | Scratch dir for PRoot                                    |
| `WKDIR`                        | The session's working directory                          |
| `HOME`                         | `/home` inside the sandbox (or the sandbox home on host) |
| `EXT_HOME`                     | Host path of the user's home                             |
| `LOCAL`                        | Host path of `<private>/local`                           |
| `PRIVATE_DIR`                  | Host path of the app's private dir                       |
| `NATIVE_LIB_DIR`               | Host path of the app's native libraries                  |
| `LD_LIBRARY_PATH`              | Where to find shared libraries                           |
| `PATH`                         | Ubuntu `PATH` plus `<private>/local/bin`                 |
| `TERM`                         | `xterm-256color`                                         |
| `COLORTERM`                    | `truecolor`                                              |
| `LANG`                         | `C.UTF-8`                                                |
| `TZ`                           | `UTC`                                                    |
| `TMPDIR` / `TMP_DIR`           | The app's cache temp dir                                 |
| `SANDBOX`                      | `true`/`false` (whether sandboxing is active)            |
| `DISPLAY`                      | `:0` (used by Termux:X11 for GUI apps)                   |
| `TERMUX_X11_SOURCE_DIR`        | Path to the Termux:X11 APK, if installed                 |
| `SOURCE_DIR`                   | Path of the Xed-Editor APK                               |
| `SECCOMP` / `PROOT_NO_SECCOMP` | Set based on the seccomp setting                         |
| `DEBUG`                        | Whether debug mode is enabled                            |

It also forwards Android's own environment (`ANDROID_DATA`, `ANDROID_ROOT`, `BOOTCLASSPATH`, ...)
so Android binaries can run inside the container when needed.

## The `xed` Command
Implementation-wise, `xed` is a small native binary (`libxed_cli.so`) that:

1. Connects to a **local UNIX domain socket** named `xed_socket` in the abstract namespace.
2. Sends the current working directory, followed by each file argument, NUL-terminated.
3. The app (which hosts a `LocalServerSocket` on that name while the session service is running)
   receives the paths, resolves relative paths against the CWD, and opens each file in a new editor
   tab.