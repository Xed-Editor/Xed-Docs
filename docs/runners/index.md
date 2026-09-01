---
outline: deep
---

# Runners

Runners let you "run" the file or project you are currently working on, right from the editor.
Instead of manually copying a command into the [terminal](/docs/terminal/), you press a button and
the editor figures out what to do.

A runner is a small piece of logic that answers two questions:

1. **Can I handle this file/project?** (a `matcher`)
2. **What should I do with it?** (a `run` function)

## How Runners Work

### The Run Button

The run button is a global command (default keybind `F5`). When you press it, Xed-Editor collects:

- the **current file** (the file open in the active editor tab), and
- the **project root** (the current editor tab's project, or the file tree tab's root).

It then asks the [`RunnerManager`](#how-runners-are-collected) which runners are available for that
file/project.

- If exactly **one** runner matches, it runs immediately.
- If **multiple** runners match, a bottom sheet lets you **choose** which runner to use.
- If **none** match, an error is shown.

Long-pressing the run button forces the picker to appear even when only one runner matches, so you
can always switch runners.

Before running, the editor **saves the current file** (the `SaveCommand` runs first), so your script
always sees the latest on-disk content.

### Matchers

Every runner declares a **matcher** that decides whether it can handle a given target.

- A **file runner** matches a single file (usually by extension or file name).
- A **project runner** matches a project root (usually by checking for a marker file or directory).

The matcher is called on every run, so a runner can make decisions based on the current state of the
filesystem. Matchers must be **fast**; they run synchronously on the main thread.

## Types of Runners

Xed-Editor supports three kinds of runners, which differ in how they are defined and where they come
from.

| Kind              | Defined by                          | Lives in                          |
|-------------------|-------------------------------------|-----------------------------------|
| Built-in runners  | The app itself (Kotlin code)        | Shipped with the app              |
| Shell runners     | You (a name + a regex + a `.sh` script) | `<private>/local/runners/`    |
| Project runners   | Your project (a `.xed/runner.sh` file) | Inside your project            |
| Extension runners | An extension (Kotlin code)          | Inside the extension              |

### Built-in Runners

These ship with Xed-Editor and are always available (unless disabled in **Settings → Runners**).

- **HTML preview** – Starts a local HTTP server and previews the HTML file (with optional Eruda
  DevTools injected). It matches `*.html`, `*.htm`, `*.xhtml`, `*.xht` and `*.svg`.
- **Markdown preview** – Renders a Markdown file in an in-app viewer. It matches `*.md`,
  `*.markdown`, `*.mdown`, etc.
- **Project runner** – Runs a project's `.xed/runner.sh` script if it exists.
- **Universal runner** – (provided by the [terminal feature](/docs/terminal/)) detects the file
  type and compiles/runs it inside the Ubuntu sandbox (Python, JS, TS, Java, Kotlin, Rust, C/C++,
  ...). It matches a large set of source file extensions.

You can enable/disable any of them in **Settings → Runners**. Each runner is stored in a preference
key `runner_<id>` (default `true`), so you can toggle them individually.

## Creating a Shell Runner

Shell runners are the simplest way to add a custom runner **without writing any Kotlin code**. They
are just a name, a regex, and a Bash script.

### Create It

1. Go to **Settings → Runners**.
2. Tap the **+** (FAB) button.
3. Enter a **name** for the runner (letters, numbers, `_` and `-` only; it must be unique).
4. Enter a **regex pattern** that matches the files this runner should handle, e.g. `.*\.py$`.
5. Tap **Create**.

Xed-Editor creates:

- A new runner entry, saved to `<private>/local/runners.json` (metadata: name + regex).
- A script file at `<private>/local/runners/<name>.sh`, pre-filled with a placeholder:
  ```sh
  echo "This runner has no implementation. Click the runner and add your own script."
  ```

### Edit the Script

Back in **Settings → Runners**, tap the runner's row. Xed-Editor opens the `<name>.sh` script in the
editor. This script is executed with:

```sh
bash <private>/local/runners/<name>.sh /path/to/the/matched/file
```

So `$1` is always the absolute path of the file that matched. Write whatever you want: compile and
run, echo a message, call `xed` to open files, etc.

Because scripts run via `bash` inside the terminal sandbox, everything available in the
[terminal](/docs/terminal/) is available here (`apt`, `node`, `python`, compilers, ...).

### Toggle / Edit / Delete

- **Toggle** – use the switch to enable/disable the runner without deleting it.
- **Edit** – tap the pencil icon to change the regex (the name is fixed, because the script file is
  named after it).
- **Delete** – tap the trash icon to remove the runner and its script file.

::: tip
The regex is compiled with `Regex(pattern)` and matched against `file.getName()` (the file name, not
the full path). Use `.*\.py$` (with a literal dot) or `.*\.py` for Python files. Invalid regexes are
rejected when you type them.
:::

## Creating a Project Runner

Project runners let a project declare how to run itself. Create a file named `runner.sh` inside a
`.xed` directory at the project root:

```
my-project/
├── .xed/
│   └── runner.sh      ← executable script
└── ...
```

When the project root is open (as an editor tab's project, or as a file tree tab), the **Project
runner** matches and runs:

```sh
bash <project-root>/.xed/runner.sh
```

with the working directory set to the project root. Make sure the script is executable (`chmod +x`).

## Creating an Extension Runner

Extensions can register fully custom runners with the `RunnerManager`. See the
[Runner API](/docs/extensions/general/runners) reference for the complete guide.

In short, you subclass `FileRunner` or `ProjectRunner`, implement `matcher` and `run`, then
register the instance:

```kotlin
override fun onLoad() {
    RunnerManager.registerRunner(MyRunner)
}

override fun onDispose() {
    RunnerManager.unregisterRunner(MyRunner)
}
```

## Why Things Are the Way They Are

Understanding the design explains a lot of the behavior you see.

### Why matchers return a Boolean instead of just trusting the file type?

Because "can you run this?" is context dependent. A Python runner matches `*.py`, but a project
runner matches a folder that *happens* to contain a `package.json`. A boolean matcher is the minimal,
most flexible contract: anything that can decide yes/no for a file or a project can be a runner.
This is also why matchers are called on every run rather than cached. The filesystem may have
changed.

### Why is the file saved before running?

Because the runner reads the file from disk. If the editor buffer were not saved first, your script
would operate on stale content and you'd be confused about why your latest edits "didn't run". The
run command saves the active tab before dispatching to the runner.

### Why are shell runners just Bash scripts with a regex?

This is the lowest-barrier way to add a runner. No compilation, no SDK, no lifecycle: a name, a
pattern and a script. The script is executed with the matched file as `$1`, matching how you'd run
it by hand in the terminal. Keeping the script as an editable file (rather than storing the body in
a preference) means you can version it, edit it with syntax highlighting, and share it.

## How Runners Are Collected

All runner registration goes through the [`RunnerManager`](/docs/extensions/general/runners). Its
`getAvailableRunners(file, projectRoot)` method:

1. Merges the three sources: built-in runners, extension runners, and shell runners.
2. Skips disabled runners (`runner_<id>` preference is `false`).
3. For each remaining runner, calls `matcher` with the file (if it's a `FileRunner`) or the project
   root (if it's a `ProjectRunner`).
4. Returns the list of matching runners.

This single code path is why the built-in HTML runner and a user-created shell runner behave
identically from the UI's point of view.
