import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
    base: '/Xed-Docs/',
    title: 'Xed-Docs',
    description: 'Documentation of Xed-Editor',
    ignoreDeadLinks: [/^https?:\/\/localhost/],
    themeConfig: {
        search: {
            provider: 'local',
        },
        // https://vitepress.dev/reference/default-theme-config
        sidebar: [
            {
                text: 'Getting Started',
                items: [
                    { text: 'Download', link: '/docs/download' },
                    { text: 'Quick Start', link: '/docs/quick-start' },
                ],
            },
            {
                text: 'User Guide',
                items: [
                    { text: 'Terminal', link: '/docs/terminal/' },
                    { text: 'Terminal (Advanced)', link: '/docs/terminal/advanced' },
                    { text: 'Runners', link: '/docs/runners/' },
                    { text: 'Git Integration', link: '/docs/git/' },
                    {
                        text: 'Language Servers',
                        items: [
                            { text: 'Introduction', link: '/docs/lsp/' },
                            { text: 'Builtin Servers', link: '/docs/lsp/builtin-servers' },
                            { text: 'External Servers', link: '/docs/lsp/external-servers' },
                            { text: 'Report Issues', link: '/docs/lsp/report-issues' },
                        ],
                    },
                ],
            },
            {
                text: 'Developer Guide',
                items: [
                    {
                        text: 'Extension Development',
                        items: [
                            { text: 'Introduction', link: '/docs/extensions/' },
                            { text: 'Environment Setup', link: '/docs/extensions/build-setup' },
                            { text: 'Manifest File', link: '/docs/extensions/manifest-file' },
                            { text: 'Lifecycle Hooks', link: '/docs/extensions/lifecycle-hooks' },
                            { text: 'Entry class & Context', link: '/docs/extensions/entry-context' },
                            { text: 'Resources', link: '/docs/extensions/resources' },
                            { text: 'Assets & Files', link: '/docs/extensions/assets-files' },
                            { text: 'Settings', link: '/docs/extensions/settings' },
                            { text: 'Debugging', link: '/docs/extensions/debugging' },
                            { text: 'Publishing Extension', link: '/docs/extensions/publishing' },
                            {
                                text: 'General APIs',
                                items: [
                                    { text: 'Events', link: '/docs/extensions/general/events' },
                                    { text: 'Activities', link: '/docs/extensions/general/activities' },
                                    { text: 'Tabs', link: '/docs/extensions/general/tabs' },
                                    { text: 'Editor', link: '/docs/extensions/general/editor' },
                                    { text: 'Drawer', link: '/docs/extensions/general/drawer' },
                                    { text: 'Terminal', link: '/docs/extensions/general/terminal' },
                                    { text: 'Filesystem', link: '/docs/extensions/general/filesystem' },
                                    { text: 'Utils', link: '/docs/extensions/general/utils' },
                                    { text: 'Disposable Manager', link: '/docs/extensions/general/disposable-manager' }
                                ]
                            },
                            {
                                text: 'General Components',
                                items: [
                                    { text: 'Commands', link: '/docs/extensions/general/commands' },
                                    { text: 'LSP Server', link: '/docs/extensions/general/lsp-server' },
                                    { text: 'Runners', link: '/docs/extensions/general/runners' },
                                    { text: 'Formatters', link: '/docs/extensions/general/formatters' },
                                    { text: 'FileType', link: '/docs/extensions/general/file-type' },
                                    { text: 'Custom Screens', link: '/docs/extensions/general/custom-screens' }
                                ]
                            },
                            {
                                text: 'UI Components',
                                items: [
                                    { text: 'Material', link: '/docs/extensions/ui-components/material-design' },
                                    { text: 'Settings', link: '/docs/extensions/ui-components/settings' }
                                ]
                            },
                            {
                                text: 'Guides',
                                items: [
                                    { text: 'Syntax Highlighting', link: '/docs/extensions/guides/syntax-highlighting' },
                                    { text: 'Custom Tabs', link: '/docs/extensions/guides/custom-tabs' }
                                ]
                            }
                        ],
                    },
                    { text: 'Themes', link: '/docs/themes/' },
                    { text: 'Icon Packs', link: '/docs/icon-packs/' },
                ],
            },
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/Xed-Editor/Xed-Editor' },
            { icon: 'discord', link: 'https://discord.gg/6bKzcQRuef' },
            { icon: 'telegram', link: 'https://t.me/XedEditor' },
        ],
    },
});
