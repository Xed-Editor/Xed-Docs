---
outline: deep
---

# Terminal API

Xed-Editor includes a powerful built-in terminal that allows users and extensions to run shell
commands. It supports two different environments: the standard Android shell and a sandboxed Ubuntu
environment.

## Android Shell vs. Ubuntu Shell

Understanding the difference between these two environments is critical for building extensions that
run external tools.

### Android Shell

The Android shell is the native environment of your device. It has access to Android-specific
binaries but is very restricted. You cannot easily install standard Linux packages (like `gcc`,
`python`, or `git`) here, and you are limited by Android's security sandbox.

### Ubuntu Shell (PRoot)

The Ubuntu shell is a "guest" Linux environment running inside Xed-Editor using **PRoot**. It
behaves like a real Linux distribution. You can use a package manager to install tools, and it
provides a familiar file structure (like `/home`, `/bin`, `/usr`). Most language servers and
compilers run in this environment.

## Visible Terminal Actions

If you want to open a terminal window that the user can see and interact with, use these methods.

### Checking Installation

With this method you can check if the terminal system is already installed:

```kotlin
if (isTerminalInstalled()) {
    // Terminal is already installed
} else {
    // Terminal will install on launch
}
```

### Launching a Terminal

To open the terminal activity and run a specific command, use `launchTerminal`.

```kotlin
val command = TerminalCommand(
    exe = "/bin/bash",
    args = arrayOf("-c", "echo 'Hello from Extension!' && sleep 5"),
    id = "my_extension_session",
    workingDir = "/home"
)

launchTerminal(currentActivity, command)
```

### The TerminalCommand Object

The `TerminalCommand` class defines how the terminal should be started:

- **sandbox**: If `true` (default), the command runs in the Ubuntu environment. If `false`, it runs
  in the native Android shell.
- **exe**: The path to the executable to run (e.g., `/bin/bash`).
- **args**: An array of arguments to pass to the executable.
- **id**: A unique ID for the terminal session. If a session with this ID already exists, Xed-Editor
  will reuse it or terminate it based on the next parameter.
- **terminatePreviousSession**: If `true`, any existing session with the same `id` will be closed
  before starting the new one.
- **workingDir**: The directory where the command should start.
- **env**: An array of extra environment variables (formatted as `KEY=VALUE`).

## Background Shell Execution

Sometimes you need to run a command in the background without showing a terminal window to the
user (e.g., to check a tool's version or run a quick script). Use `ShellUtils` for this.

### ShellUtils.run()

Runs a command in the native **Android shell**.

```kotlin
val result = ShellUtils.run("/system/bin/uname", "-a", timeoutSeconds = 5)

if (!result.timedOut && result.exitCode == 0) {
    context.logInfo("System info: ${result.output}")
}
```

### ShellUtils.runUbuntu()

Runs a command inside the **Ubuntu sandbox**. This is what you should use for most Linux-based
tools.

```kotlin
val result = ShellUtils.runUbuntu(
    workingDir = "/home",
    command = arrayOf("python3", "--version"),
    timeoutSeconds = 10
)

if (!result.timedOut && result.exitCode == 0) {
    context.logInfo("Python version: ${result.output}")
}
```

### Understanding the Result

Both methods return a `Result` object containing:

- **exitCode**: The exit status of the process (usually `0` for success).
- **output**: The standard output (stdout) as a string.
- **error**: The error output (stderr) as a string.
- **timedOut**: A boolean indicating if the process was killed because it took too long.

## The Internal ubuntuProcess

For advanced use cases, you can use the `ubuntuProcess` function directly. It returns a standard
`java.lang.Process` object, giving you full control over streams and lifecycle.

```kotlin
val process = ubuntuProcess(
    workingDir = "/home",
    command = listOf("ls", "-la")
)

// Read output manually
val output = process.readStdout()
val exitCode = process.awaitExit()
```

You can pass `excludeMounts` to the `ubuntuProcess` function to run the command without
certain [default bindings](/docs/terminal/advanced.md#default-bindings).

Beyond that, the process instance offers several helper commands: `readStdout()`, `readStderr()`, `writeInput()`,
`awaitExit()`, `terminate()`, `isRunning()`.

This is useful if you need to feed input to a process dynamically or if you want to stream output in
real-time instead of waiting for the process to finish.
