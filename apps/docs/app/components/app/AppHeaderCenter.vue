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
        label: '为什么从 evlog 开始',
        icon: 'i-lucide-rocket',
        description: '从项目第一天就采用 evlog 的理由',
        to: '/start/why-evlog'
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
        label: '智能体技能',
        icon: 'i-lucide-bot',
        description: '在 AI 编程代理中使用 evlog',
        to: '/reference/agent-skills'
      },
      {
        label: '配置',
        icon: 'i-lucide-settings',
        description: '每个选项、环境变量和默认值',
        to: '/reference/configuration'
      },
      {
        label: '最佳实践',
        icon: 'i-lucide-shield-check',
        description: '该记录什么，以及哪些内容绝对不要记录',
        to: '/reference/best-practices'
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
        description: '一次发送的结构化日志',
        to: '/learn/simple-logging'
      },
      {
        label: '宽事件',
        icon: 'i-lucide-rows-3',
        description: '先持续累积上下文，最后一次性发出',
        to: '/learn/wide-events'
      },
      {
        label: '结构化错误',
        icon: 'i-lucide-shield-alert',
        description: '能够说明原因并给出修复建议的错误',
        to: '/learn/structured-errors'
      },
      {
        label: '目录',
        icon: 'i-lucide-book-marked',
        description: '可安全重构的类型化错误和审计目录',
        to: '/learn/catalogs'
      },
      {
        label: '生命周期',
        icon: 'i-lucide-arrow-right-left',
        description: '从 emit() 到 drain 的完整生命周期',
        to: '/learn/lifecycle'
      },
      {
        label: '采样',
        icon: 'i-lucide-filter',
        description: '保留所有错误，过滤健康请求噪音',
        to: '/learn/sampling'
      },
      {
        label: '自动脱敏',
        icon: 'i-lucide-eye-off',
        description: '在数据离开进程前去除敏感信息',
        to: '/learn/redaction'
      },
      {
        label: '类型化字段',
        icon: 'i-simple-icons-typescript',
        description: '让你自己的 log.set 字段也能自动补全',
        to: '/learn/typed-fields'
      }
    ]
  },
  {
    label: '命令行',
    to: '/cli/overview',
    children: [
      {
        label: '概述',
        icon: 'i-lucide-terminal',
        description: '命令、参数和退出码',
        to: '/cli/overview'
      },
      {
        label: 'evlog 评分图',
        icon: 'i-lucide-radar',
        description: '为应用中的每个入口点打分',
        to: '/cli/map'
      },
      {
        label: '规则',
        icon: 'i-lucide-list-checks',
        description: '每一项检查，以及如何满足它',
        to: '/cli/rules'
      },
      {
        label: '计分',
        icon: 'i-lucide-gauge',
        description: '权重、等级和灵敏度',
        to: '/cli/scoring'
      },
      {
        label: 'CI 门禁',
        icon: 'i-lucide-git-pull-request',
        description: '根据分数为拉取请求设置门禁',
        to: '/cli/ci'
      },
      {
        label: 'evlog 诊断',
        icon: 'i-lucide-stethoscope',
        description: '诊断你的 evlog 安装是否正常',
        to: '/cli/doctor'
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
        description: '通过 handle hook 接入',
        to: '/integrate/frameworks/sveltekit'
      },
      {
        label: 'Nitro',
        icon: 'i-custom-nitro',
        description: 'Nitro v2 和 v3 插件',
        to: '/integrate/frameworks/nitro'
      },
      {
        label: 'TanStack Start',
        icon: 'i-custom-tanstack',
        description: '支持异步上下文的 Nitro v3 模块',
        to: '/integrate/frameworks/tanstack-start'
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
        label: 'NestJS',
        icon: 'i-simple-icons-nestjs',
        description: '带全局中间件的模块',
        to: '/integrate/frameworks/nestjs'
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
        description: '适用于脚本、任务、库等任意场景',
        to: '/integrate/frameworks/standalone'
      },
      {
        label: '自定义框架',
        icon: 'i-lucide-puzzle',
        description: '为 evlog 还没有现成模块的框架完成接入',
        to: '/extend/custom-framework'
      },
      {
        label: '所有框架',
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
        description: '通过 OTLP 协议导出日志',
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
        description: '将 NDJSON 日志写入本地文件系统',
        to: '/integrate/adapters/self-hosted/fs'
      },
      {
        label: 'NuxtHub',
        icon: 'i-simple-icons-nuxtdotjs',
        description: '将日志持久化到 NuxtHub D1 数据库',
        to: '/integrate/adapters/self-hosted/nuxthub'
      },
      {
        label: 'Drain 管线',
        icon: 'i-lucide-workflow',
        description: '批处理、重试，以及向多个 sink 扇出',
        to: '/extend/drain-pipeline'
      },
      {
        label: '自定义 drain',
        icon: 'i-lucide-share-2',
        description: '使用 toolkit 将事件发送到任意位置',
        to: '/extend/custom-drains'
      },
      {
        label: '所有适配器',
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
        description: '支持 token 跟踪的 AI 可观测性',
        to: '/use-cases/ai-sdk/overview'
      },
      {
        label: 'Better Auth',
        icon: 'i-simple-icons-betterauth',
        description: '在每次请求中自动识别用户',
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
        description: '浏览器侧日志采集与传输',
        to: '/use-cases/client-logging'
      },
      {
        label: '丰富器',
        icon: 'i-lucide-sparkles',
        description: '自动补充 User-Agent、地理位置和 trace 上下文',
        to: '/use-cases/enrichers'
      },
      {
        label: '遥测',
        icon: 'i-lucide-gauge',
        description: '为你自己的 CLI 提供每次运行一条事件的遥测',
        to: '/use-cases/telemetry/overview'
      },
      {
        label: 'eve',
        icon: 'i-custom-eve',
        description: '为 eve 代理提供可观测性',
        to: '/use-cases/eve'
      },
      {
        label: '所有使用场景',
        icon: 'i-lucide-layers',
        description: '查看 evlog 的所有使用场景',
        to: '/use-cases/overview'
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
