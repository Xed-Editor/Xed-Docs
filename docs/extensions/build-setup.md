---
lang: en-US
title: Environment Setup
---

# Environment Setup

Xed-Editor extensions are developed similarly to a standard Android application, sharing the same build tools and environment. This guide assumes you are using **Android Studio** on a desktop operating system (Windows, macOS, or Linux).

::: info
While alternative methods exist (e.g., using GitHub Actions or running the Android SDK on ARM devices), this guide focuses on the standard local development setup using Android Studio for simplicity.
:::
-----

### 1. Prerequisites

Ensure your development environment meets these requirements:

  * [Android Studio](https://developer.android.com) (Including JDK and Android SDK).
  * [Git](https://git-scm.com/install/) installed for version control.
  * Basic terminal environment

-----

### 2. Clone the Extension Template

The quickest way to start is by cloning the official template repository.

You can do this either by using the built-in **`File > New > Project from Version Control`** option in Android Studio, or by using the terminal:

```bash
# Clone the template repository
git clone https://github.com/Xed-Editor/Extension-Template

# Navigate into the new project directory
cd Extension-Template
```

### 3. Build the Extension Package

To compile the extension and generate the output file, use the provided shell script.

This command builds the extension in **debug mode** (which is recommended for initial testing and development):

```bash
./compileDebug
```

If the compilation process completes without errors, you have successfully generated your first Xed-Editor extension!

### 4. Locate the Output File

After a successful build, the extension package is a compressed file located in the `output/` directory:

```
output/<id>.xed
```

This `.xed` package contains all necessary code and metadata. You can install it directly in the Xed-Editor application using **`Settings > Store > Install from storage`**.
