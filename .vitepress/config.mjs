import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/Xed-Docs/',
  title: "Xed-Docs",
  description: "Documentation of Xed-Editor",
  ignoreDeadLinks: [
    /^https?:\/\/localhost/,
  ],
  themeConfig: {
    search: {
      provider: 'local'
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
    ],
    sidebar: {
      "/docs/extensions/":[
        {
          text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/docs/extensions/' },
          { text: 'Enviroment Setup', link: '/docs/extensions/build-setup' },
          { text: "Manifest File", link: '/docs/extensions/manifestFile' },
          { text: 'Main.kt', link: '/docs/extensions/mainKt' },
          
          { text: 'Publishing Extension', link: '/docs/extensions/publishing' },
        ]
        }
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Xed-Editor/Xed-Editor' },
      { icon: 'discord', link: 'https://discord.gg/6bKzcQRuef' },
      { icon: 'telegram', link: 'https://t.me/XedEditor' },
    ]
  }
})
