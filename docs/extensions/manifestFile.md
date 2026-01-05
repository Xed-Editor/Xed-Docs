---
title: manifest.json – Extension Manifest
navTitle: manifest.json Manifest
---

# Configure Your Extension Metadata

Before you build, you must update the core metadata within the `manifest.json` file located in the root of the project directory.

### Example `manifest.json`

```json
{
  "id": "com.rk.demo",
  "name": "Extension template",
  "mainClass": "com.rk.demo.Main",
  "version": "1.0.0",
  "description": "A demo extension template project",
  "authors": ["Rohit"],
  "minAppVersion": 80,
  "targetAppVersion": 80,
  "repository": "https://github.com/Xed-Editor/Extension-Template"
}
```


## Field Reference

| Field                | Required | Type              | Description                                                                                                                               |
|----------------------|----------|-------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| `id`                 | Yes      | String            | **Unique identifier** for your extension (like a Java package name).<br>**Must be globally unique across all extensions.**<br>Recommended format: reverse domain (`com.author.extensionname`) |
| `name`               | Yes      | String            | Human-readable name shown in the extension list inside Xed-Editor.                                                                          |
| `mainClass`          | Yes      | String            | Full class name of your extension’s entry point.<br>**Must exactly match** the package + class name of the file that extends `ExtensionAPI()`.<br>Example: if your file is `src/com/rk/demo/Main.kt` → `"com.rk.demo.Main"` |
| `version`            | Yes      | String (SemVer)   | Extension version (e.g. `"1.0.0"`, `"2.3.1"`). Used for updates and display.                                                                  |
| `description`        | Yes      | String            | Short description shown in the extension manager. Keep it under 150 characters.                                                             |
| `authors`            | Yes      | Array of strings  | List of authors/maintainers. Usually just your name or GitHub username.                                                                   |
| `minAppVersion`      | Yes      | Integer           | Minimum Xed-Editor build number your extension supports.<br>If the user’s app is older → extension will be disabled with a clear warning.        |
| `targetAppVersion`   | Yes      | Integer           | The app version you developed and tested against.<br>Helps users know which version is fully supported.                                    |
| `repository`         | No       | String (URL)      | Link to your GitHub/GitLab/etc. repository. Shown as “Source” button in the extension details screen.                                        |

### Critical Rules You Must Follow

- **`id` must be unique worldwide**  
  If two extensions have the same `id`, only one will load (usually the first one found). Use your domain or GitHub username to avoid collisions.

- **`mainClass` must match exactly**  
  Wrong package or class name → extension fails to load with “ClassNotFoundException” in logs.

- Use **semantic versioning** for `version`  
  Xed-Editor may offer auto-updates in the future.

### Recommended `id` Patterns

```json
"com.github.yourusername.awesomeextension"
"dev.username.myfirstextension"
"io.companyname.xedextension.feature"
```

Now you know exactly how to fill out `manifest.json` correctly so your extension loads correctly!