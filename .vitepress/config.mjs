import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/Xed-Docs/',
  title: "Xed-Docs",
  description: "Documentation of Xed-Editor",
  themeConfig: {
    search: {
      provider: 'local'
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
    ],
    sidebar: {
      "/docs/plugins/":[
        {
          text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/docs/plugins/' },
          { text: 'Enviroment Setup', link: '/docs/plugins/build-setup' },
          { text: "Manifest File", link: '/docs/plugins/manifestFile' },
          { text: 'Main.kt', link: '/docs/plugins/mainKt' },
          
          { text: 'Publishing Plugin', link: '/docs/plugins/publishing' },
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
