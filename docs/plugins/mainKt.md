---
title: Android Activity Lifecycle Hooks
navTitle: Activity Lifecycle
---

# Android Activity Lifecycle Hooks

Xed-Editor plugins can hook into the standard **Android Activity Lifecycle** of the host application. This allows your plugin to react when the app is opened, sent to the background, resumed, or completely closed.


## Available Methods

```kotlin
class Main : ExtensionAPI() {
    override fun onPluginLoaded(extension: Extension) { }
    override fun onUninstalled(extension: Extension) { }

    override fun afterActivityCreated(activity: Activity) { }
    override fun onActivityResumed(activity: Activity) { }
    override fun onActivityPaused(activity: Activity) { }
    override fun onActivityDestroyed(activity: Activity) { }
}
```

## Lifecycle Reference Table

| Method                                    | Called When                                          | Plugin Receives It?       | Recommended Use in Plugins                                      |
|-------------------------------------------|------------------------------------------------------|---------------------------|-----------------------------------------------------------------|
| `onPluginLoaded`                          | Plugin ZIP is first loaded                           | Always (once per session) | **Primary initialization** – register commands, load settings, start services |
| `onUninstalled`                           | User removes the plugin from Xed-Editor              | Yes (if app is running)   | Final cleanup before plugin code is unloaded                    |
| `onActivityCreated`                       | Any Activity is created          | Unknown              | **Do not rely on this** – sometimes plugins load after the Activity exists |
| `onActivityResumed`                       | App is in foreground and interactive                 | Yes                       | **Resume** timers, file watchers, network polling, animations   |
| `onActivityPaused`                        | User leaves the app (Home, another app, etc.)        | Yes                       | **Pause** timers, animations, release camera/mic, save drafts   |
| `onActivityDestroyed`                     | Any Activity is permanently destroyed               | Yes (only on real shutdown) |  cleanup – close DBs, cancel coroutines, unregister receivers |



These hooks give you full control over your plugin’s behavior in harmony with Xed-Editor’s lifecycle.