export default defineNuxtConfig({
  compatibilityDate: 'latest',

  modules: [
    '@nuxt/content',
    '@nuxt/ui',
    '@comark/nuxt',
    '@vercel/analytics',
    '@nuxtjs/sitemap',
  ],

  css: ['~/assets/css/main.css'],

  content: {
    experimental: {
      sqliteConnector: 'native',
    },
  },

  colorMode: {
    preference: 'dark',
    forced: true,
  },

  fonts: {
    families: [
      { name: 'Geist', weights: [400, 600, 700], global: true },
      { name: 'Geist Mono', weights: [400, 600], global: true },
    ],
  },

  site: {
    name: 'Just fucking use evlog',
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://www.justfuckinguseevlog.com',
  },

  runtimeConfig: {
    public: {
      docsUrl: process.env.NUXT_PUBLIC_DOCS_URL || 'https://www.evlog.dev',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || '',
    },
  },

  routeRules: {
    '/': { prerender: true },
  },

  nitro: {
    prerender: {
      crawlLinks: true,
    },
  },

  icon: {
    provider: 'iconify',
    clientBundle: {
      scan: true,
    },
  },

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/evlog.svg' },
        { rel: 'dns-prefetch', href: 'https://ungh.cc' },
        { rel: 'preconnect', href: 'https://ungh.cc', crossorigin: '' },
      ],
    },
  },
})
