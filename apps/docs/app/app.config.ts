export default defineAppConfig({
  navigation: {
    sub: 'header',
  },
  github: {
    rootDir: 'apps/docs',
  },
  seo: {
    titleTemplate: '%s - Evlog 中文文档',
    title: 'Evlog 中文文档',
    description: '适用于 TypeScript 的结构化日志库。简单日志、广泛事件和结构化错误，从快速的一行代码到全面的请求级事件。',
  },
  assistant: {
    icons: {
      trigger: 'i-custom:ai'
    },
    faqQuestions: [
      {
        category: '开始使用',
        items: [
          'evlog 是什么？',
          '如何安装 evlog？',
          '如何使用 useLogger？',
        ],
      },
      {
        category: '核心功能',
        items: [
          '什么是广泛事件？',
          '如何创建结构化错误？',
          '如何使用 parseError？',
        ],
      },
      {
        category: '生产环境',
        items: [
          '如何配置采样？',
          '如何将日志发送到 Axiom？',
          '如何将日志发送到 PostHog？',
        ],
      },
    ],
  },
  ui: {
    colors: {
      primary: 'blue',
      neutral: 'zinc',
    },
    prose: {
      codeIcon: {
        'nuxt': 'i-vscode-icons-file-type-nuxt',
        'nuxt / nitro': 'i-vscode-icons-file-type-nuxt',
        'next.js': 'i-simple-icons-nextdotjs',
        'express': 'i-simple-icons-express',
        'hono': 'i-simple-icons-hono',
        'fastify': 'i-simple-icons-fastify',
        'elysia': 'i-custom:elysia',
        'nestjs': 'i-simple-icons-nestjs',
        'standalone': 'i-lucide-box',
        'nitro': 'i-custom:nitro',
      },
    },
    button: {
      slots: {
        base: 'active:translate-y-px transition-transform duration-300',
      },
    },
    contentToc: {
      defaultVariants: {
        highlightVariant: 'circuit'
      }
    },
    contentSurround: {
      variants: {
        direction: {
          left: {
            linkLeadingIcon: ['group-active:translate-x-0',],
          },
          right: {
            linkLeadingIcon: ['group-active:translate-x-0',],
          },
        },
      },
    }
  },
  toc: {
    title: '本页目录',
  },
})
