<script setup lang="ts">
const route = useRoute()
const isHome = computed(() => route.path === '/')

const landingItems = [
  {
    label: '文档',
    to: '/start/introduction',
    children: [
      {
        label: '介绍',
        icon: 'i-lucide-book-open',
        description: 'evlog 是什么，以及为什么要使用它',
        to: '/start/introduction'
      },
      {
        label: '安装',
        icon: 'i-lucide-download',
        description: '在你的项目中安装 evlog',
        to: '/start/installation'
      },
      {
        label: '快速开始',
        icon: 'i-lucide-zap',
        description: '几分钟内快速上手',
        to: '/start/quick-start'
      },
      {
        label: '与其他日志库对比',
        icon: 'i-lucide-git-compare-arrows',
        description: 'evlog 与 pino、consola、winston 的对比',
        to: '/reference/vs-other-loggers'
      },
      {
        label: 'Agent 技能',
        icon: 'i-lucide-bot',
        description: '在 AI 编程代理中使用 evlog',
        to: '/reference/agent-skills'
      }
    ]
  },
  {
    label: '概念',
    to: '/learn/overview',
    children: [
      {
        label: '简单日志',
        icon: 'i-lucide-terminal',
        description: '一次性发送的结构化日志',
        to: '/learn/simple-logging'
      },
      {
        label: '宽事件',
        icon: 'i-lucide-rows-3',
        description: '持续累积上下文，最后一次性发出',
        to: '/learn/wide-events'
      },
      {
        label: '结构化错误',
        icon: 'i-lucide-shield-alert',
        description: '能说明原因并给出修复建议的错误',
        to: '/learn/structured-errors'
      },
      {
        label: '目录',
        icon: 'i-lucide-book-marked',
        description: '可安全重构的类型化错误与审计目录',
        to: '/learn/catalogs'
      },
      {
        label: '生命周期',
        icon: 'i-lucide-arrow-right-left',
        description: '从 emit() 到 drain 的完整流程',
        to: '/learn/lifecycle'
      },
      {
        label: '采样',
        icon: 'i-lucide-filter',
        description: '保留所有错误，过滤健康请求噪音',
        to: '/learn/sampling'
      }
    ]
  },
  {
    label: '框架',
    to: '/integrate/frameworks/overview',
    children: [
      {
        label: 'Nuxt',
        icon: 'i-simple-icons-nuxtdotjs',
        description: '带自动导入的 Nuxt 模块',
        to: '/integrate/frameworks/nuxt'
      },
      {
        label: 'Next.js',
        icon: 'i-simple-icons-nextdotjs',
        description: '支持 App Router 和 Pages Router',
        to: '/integrate/frameworks/nextjs'
      },
      {
        label: 'SvelteKit',
        icon: 'i-simple-icons-svelte',
        description: 'handle hook 集成',
        to: '/integrate/frameworks/sveltekit'
      },
      {
        label: 'Nitro',
        icon: 'i-custom-nitro',
        description: 'Nitro v2 和 v3 插件',
        to: '/integrate/frameworks/nitro'
      },
      {
        label: 'Hono',
        icon: 'i-simple-icons-hono',
        description: 'Web 标准中间件',
        to: '/integrate/frameworks/hono'
      },
      {
        label: 'Express',
        icon: 'i-simple-icons-express',
        description: 'Express 中间件',
        to: '/integrate/frameworks/express'
      },
      {
        label: 'Cloudflare Workers',
        icon: 'i-simple-icons-cloudflare',
        description: '边缘运行时支持',
        to: '/integrate/frameworks/cloudflare-workers'
      },
      {
        label: '独立使用',
        icon: 'i-lucide-code',
        description: '脚本、任务、库等任意场景',
        to: '/integrate/frameworks/standalone'
      },
      {
        label: '全部框架',
        icon: 'i-lucide-layers',
        description: '查看全部 16 个框架集成',
        to: '/integrate/frameworks/overview'
      }
    ]
  },
  {
    label: '适配器',
    to: '/integrate/adapters/overview',
    children: [
      {
        label: 'Axiom',
        icon: 'i-custom-axiom',
        description: '将日志发送到 Axiom',
        to: '/integrate/adapters/cloud/axiom'
      },
      {
        label: 'OpenTelemetry',
        icon: 'i-simple-icons-opentelemetry',
        description: '通过 OTLP 协议导出',
        to: '/integrate/adapters/cloud/otlp'
      },
      {
        label: 'HyperDX',
        icon: 'i-custom-hyperdx',
        description: '通过 OTLP 将日志发送到 HyperDX',
        to: '/integrate/adapters/cloud/hyperdx'
      },
      {
        label: 'PostHog',
        icon: 'i-simple-icons-posthog',
        description: '将日志发送到 PostHog',
        to: '/integrate/adapters/cloud/posthog'
      },
      {
        label: 'Sentry',
        icon: 'i-simple-icons-sentry',
        description: '将错误上报到 Sentry',
        to: '/integrate/adapters/cloud/sentry'
      },
      {
        label: 'Better Stack',
        icon: 'i-simple-icons-betterstack',
        description: '将日志流式发送到 Better Stack',
        to: '/integrate/adapters/cloud/better-stack'
      },
      {
        label: 'Datadog',
        icon: 'i-simple-icons-datadog',
        description: '将日志发送到 Datadog',
        to: '/integrate/adapters/cloud/datadog'
      },
      {
        label: '文件系统',
        icon: 'i-lucide-hard-drive',
        description: '将 NDJSON 日志写入本地',
        to: '/integrate/adapters/self-hosted/fs'
      },
      {
        label: 'NuxtHub',
        icon: 'i-simple-icons-nuxtdotjs',
        description: '将日志持久化到 NuxtHub D1',
        to: '/integrate/adapters/self-hosted/nuxthub'
      },
      {
        label: '全部适配器',
        icon: 'i-custom-plug',
        description: '查看所有内置适配器',
        to: '/integrate/adapters/overview'
      }
    ]
  },
  {
    label: '使用场景',
    to: '/use-cases/overview',
    children: [
      {
        label: 'AI SDK',
        icon: 'i-simple-icons-vercel',
        description: '带 token 跟踪的 AI 可观测性',
        to: '/use-cases/ai-sdk/overview'
      },
      {
        label: 'Better Auth',
        icon: 'i-simple-icons-betterauth',
        description: '在每个请求中自动识别用户',
        to: '/use-cases/better-auth/overview'
      },
      {
        label: '审计日志',
        icon: 'i-lucide-shield-check',
        description: '可防篡改的行为追踪记录',
        to: '/use-cases/audit/overview'
      },
      {
        label: '客户端日志',
        icon: 'i-lucide-monitor',
        description: '浏览器侧日志记录与传输',
        to: '/use-cases/client-logging'
      },
      {
        label: '丰富器',
        icon: 'i-lucide-sparkles',
        description: '自动补充 User-Agent、地理位置和 trace 上下文',
        to: '/use-cases/enrichers'
      }
    ]
  }
]

</script>

<template>
  <UNavigationMenu
    v-if="isHome"
    variant="link"
    color="neutral"
    :items="landingItems"
    :ui="{
      linkTrailingIcon: 'hidden',
      childLink: 'hover:bg-elevated/50',
      viewport: 'bg-default backdrop-blur-xl ring ring-offset-6 ring-offset-bg ring-default border border-default',
      viewportWrapper: 'w-[600px] transition-all duration-500 left-1/2 -translate-x-1/2',
    }"
  />
  <UContentSearchButton
    v-else
    :collapsed="false"
    class="w-full"
    variant="soft"
    :ui="{ leadingIcon: 'size-4 mr-1' }"
  />
</template>
