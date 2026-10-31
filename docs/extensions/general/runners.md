# The Runner API

The Runner API allows extensions to provide custom ways to "run" files or projects as
described [here](/docs/runners/index.md). These appear in
the run menu and can be used to compile code, launch web previews, or execute scripts.

## Runner Types

A Runner is a class that defines how to execute a specific target. There are two main types of
runners:

- **FileRunner**: Targeted at specific files (e.g., running a Python script).
- **ProjectRunner**: Targeted at a project root (e.g., building a Gradle project).

## Implementing a Runner

### FileRunner

To create a file-based runner, you simply extend `FileRunner`:

```kotlin
class MyCustomRunner : FileRunner() {
    // ...

    // Filter which files this runner can handle
    override fun matcher(fileObject: FileObject): Boolean {
        return fileObject.getExtension() == "myext"
    }

    override suspend fun run(activity: Activity, fileObject: FileObject) {
        // Run your tool here
    }
}
```

### ProjectRunner

To create a project-based runner, you instead extend `ProjectRunner`:

```kotlin
class MyCustomRunner : ProjectRunner() {
    // ...

    // Filter which projects this runner can handle
    override fun matcher(projectRoot: FileObject): Boolean {
        return runBlocking { projectRoot.hasChild("package.json") }
    }

    override suspend fun run(activity: Activity, projectRoot: FileObject) {
        // Run your tool here
    }
}
```

### Basic Properties

Every Runner must also define a unique `id` and a human-readable `label`.

Optionally you can provide a custom icon through `getIcon(...)` or return `null` to use the default
run button icon.

```kotlin
override val id = "com.example.myrunner"
override val label = "Run with MyTool"

override fun getIcon(context: Context): Icon? {
    return null
    // or better:
    return Icon.ExternalResourceIcon(R.drawable.ic_run, context.resources)
}
```

### Stopping Runners

If your runner starts a long-running process, you should implement `isRunning` and `stop`:

```kotlin
override suspend fun isRunning(): Boolean {
    return myProcess?.isAlive == true
}

override suspend fun stop() {
    myProcess?.destroy()
}
```

### Runner Settings

If your runner requires configuration, you can enable settings by overriding `hasSettings` and
`launchSettings`:

```kotlin
override val hasSettings = true

override fun launchSettings(context: Context) {
    settingsNavController.get()?.navigate("my_extension_settings")
}
```

This displays a settings option for your runner. When clicked, `launchSettings` is invoked, allowing
you to open your settings page through [custom screens](/docs/extensions/general/custom-screens.md)
or [settings routes](/docs/extensions/settings.md#global-settings).

## Registering Runners

Use the `RunnerManager` to make your runner available to the user.

```kotlin
override fun onLoad() {
    val myRunner = MyCustomRunner()
    RunnerManager.registerRunner(myRunner)
}
```

The app will automatically show your runner in the UI if the `matcher` returns true for the current
file or project.

## Unregistering

As with all registrations, remember to clean up in `onDispose`.

```kotlin
override fun onDispose() {
    RunnerManager.unregisterRunner(myRunner)
}
```
