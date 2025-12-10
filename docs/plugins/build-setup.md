---
lang: en-US
title: Enviroment Setup
---

# ⚙️ Environment Setup

Xed-Editor plugins are developed similarly to a standard Android application, sharing the same build tools and environment. This guide assumes you are using **Android Studio** on a desktop operating system (Windows, macOS, or Linux).

> **Note:** While alternative methods exist (e.g., using GitHub Actions or running the Android SDK on ARM devices), this guide focuses on the standard local development setup using Android Studio for simplicity.

-----

### 1. Prerequisites (What You Need)

Ensure your development environment meets these requirements:

  * **Android Studio** (Latest Stable Version)
  * **Java Development Kit (JDK)** installed and configured.
  * **Android SDK** install and configured.
  * **Git** installed for version control.
  * A basic linux terminal/shell environment (Bash).

-----

### 2. Clone the Plugin Template

The quickest way to start is by cloning the official template repository.

You can do this either by using the built-in **`File > New > Project from Version Control`** option in Android Studio, or by using the terminal:

```bash
# Clone the template repository
git clone https://github.com/Xed-Editor/pluginTemplate

# Navigate into the new project directory
cd pluginTemplate
```

### 3. Build the Plugin Package

To compile the plugin and generate the output file, use the provided shell script.

This command builds the plugin in **debug mode** (which is recommended for initial testing and development):

```bash
sh compileDebug.sh
```

If the compilation process completes without errors, you have successfully generated your first Xed-Editor plugin package!

### 4. Locate the Output File

After a successful build, the final plugin package is a compressed file located in the `output/` directory:

```
output/YourPluginName.zip
```

This `.zip` file is the deliverable: it contains all the necessary code and metadata and is the file you must upload or load directly into the **Xed-Editor** application.