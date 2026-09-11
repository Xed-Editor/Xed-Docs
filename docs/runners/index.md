---
outline: deep
---

# Runners

Runners let you "run" the file or project you are currently working on, right from the editor.
Instead of manually copying a command into the [terminal](/docs/terminal/), you press a button and
the editor figures out what to do.

## The Run Button

The run button is a global command (default keybind `F5`). It is only visible if there is a runner
available for either:

- the **current file** (the file open in the active editor tab), or
- the **project root** (the current editor tab's project).

When you press the run button, and exactly **one** runner matches, it runs immediately. If
**multiple** runners match, a bottom sheet lets you choose which runner to use.

Long-pressing the run button forces the picker to appear even when only one runner matches, so you
can see which runners are available.

Before running, the editor **saves the current file**, so your script
always sees the latest on-disk content.

## Types of Runners

Xed-Editor supports four kinds of runners, which differ in how they are defined and where they come
from.

| Kind                                                     | Defined by                              | Lives in                   |
|----------------------------------------------------------|-----------------------------------------|----------------------------|
| [Built-in runners](#built-in-runners)                    | The app itself (Kotlin code)            | Shipped with the app       |
| [Shell runners](#creating-a-shell-runner)                | You (a name + a regex + a `.sh` script) | `<private>/local/runners/` |
| [Project runners](#creating-a-project-runner)            | Your project (a `.xed/runner.sh` file)  | Inside your project        |
| [Extension runners](/docs/extensions/general/runners.md) | An extension (Kotlin code)              | Inside the extension       |

## Built-in Runners

These ship with Xed-Editor and are always available (unless disabled in **Settings → Runners**).

- **HTML preview** – Starts a local HTTP server and previews the HTML file (with optional Eruda
  DevTools injected). It supports `*.html`, `*.htm`, `*.xhtml`, `*.xht` and `*.svg` files.
- **Markdown preview** – Renders a Markdown file in an in-app viewer. It supports `*.md`,
  `*.markdown`, `*.mdown`, etc.
- **Project runner** – Runs a project's `.xed/runner.sh` script if it exists.
- **Universal runner** – detects the file type and compiles/runs it inside the Ubuntu sandbox
  (Python, JS, TS, Java, Kotlin, Rust, C/C++, ...). It matches a large set of source file extensions.

## Creating a Shell Runner

Shell runners are the simplest way to add a custom runner **without writing any Kotlin code**. They
are just a name, a regex, and a Bash script.

### Create It

1. Go to **Settings → Runners**.
2. Tap the **+** (FAB) button.
3. Enter a **name** for the runner (letters, numbers, `_` and `-` only; it must be unique).
4. Enter a **regex pattern** that matches the files this runner should handle, e.g. `.*\.py`.
5. Tap **Create**.

:::info
The regex is matched against the file name, not the full path. Invalid regexes are rejected when you
type them.
:::

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

## Creating a Project Runner

Project runners let a project declare how to run itself. Create a file named `runner.sh` inside a
`.xed` directory at the project root:

```
my-project/
├── .xed/
│   └── runner.sh      ← executable script
└── ...
```

When the project is selected (as an editor tab's project or as a file tree tab), the **Project
runner** is available and runs:

```sh
bash <project-root>/.xed/runner.sh
```

with the working directory set to the project root. Make sure the script is executable (`chmod +x`).
