---
title: manifest.json – Plugin Manifest
navTitle: manifest.json Manifest
---

# Configure Your Plugin Metadata

Before you build, you must update the core metadata within the `manifest.json` file located in the root of the project directory.

### Example `manifest.json`

```json
{
  "id": "com.rk.demo",
  "name": "PluginTemplate",
  "mainClass": "com.rk.demo.Main",
  "version": "1.0.0",
  "description": "A demo plugin template project",
  "authors": ["Rohit"],
  "minAppVersion": 73,
  "targetAppVersion": 73,
  "repository": "https://github.com/Xed-Editor/pluginTemplate"
}
```


## Field Reference

| Field                | Required | Type              | Description                                                                                                                               |
|----------------------|----------|-------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| `id`                 | Yes      | String            | **Unique identifier** for your plugin (like a Java package name).<br>**Must be globally unique across all plugins.**<br>Recommended format: reverse domain (`com.author.pluginname`) |
| `name`               | Yes      | String            | Human-readable name shown in the plugin list inside Xed-Editor.                                                                          |
| `mainClass`          | Yes      | String            | Full class name of your plugin’s entry point.<br>**Must exactly match** the package + class name of the file that extends `ExtensionAPI()`.<br>Example: if your file is `src/com/rk/demo/Main.kt` → `"com.rk.demo.Main"` |
| `version`            | Yes      | String (SemVer)   | Plugin version (e.g. `"1.0.0"`, `"2.3.1"`). Used for updates and display.                                                                  |
| `description`        | Yes      | String            | Short description shown in the plugin manager. Keep it under 150 characters.                                                             |
| `authors`            | Yes      | Array of strings  | List of authors/maintainers. Usually just your name or GitHub username.                                                                   |
| `minAppVersion`      | Yes      | Integer           | Minimum Xed-Editor build number your plugin supports.<br>If the user’s app is older → plugin will be disabled with a clear warning.        |
| `targetAppVersion`   | Yes      | Integer           | The app version you developed and tested against.<br>Helps users know which version is fully supported.                                    |
| `repository`         | No       | String (URL)      | Link to your GitHub/GitLab/etc. repository. Shown as “Source” button in the plugin details screen.                                        |

### Critical Rules You Must Follow

- **`id` must be unique worldwide**  
  If two plugins have the same `id`, only one will load (usually the first one found). Use your domain or GitHub username to avoid collisions.

- **`mainClass` must match exactly**  
  Wrong package or class name → plugin fails to load with “ClassNotFoundException” in logs.

- Use **semantic versioning** for `version`  
  Xed-Editor may offer auto-updates in the future.

### Recommended `id` Patterns

```json
"com.github.yourusername.awesomeplugin"
"dev.username.myfirstplugin"
"io.companyname.xedplugin.feature"
```

Now you know exactly how to fill out `manifest.json` correctly — no more “plugin failed to load” mysteries!