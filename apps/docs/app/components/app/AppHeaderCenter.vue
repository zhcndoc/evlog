<script setup lang="ts">
const route = useRoute()
const isHome = computed(() => route.path === '/')

const landingItems = [
  {
    label: '文档',
    to: '/getting-started/introduction',
    children: [
      {
        label: '介绍',
        icon: 'i-lucide-book-open',
        description: 'evlog 是什么，以及为什么要用它',
        to: '/getting-started/introduction'
      },
      {
        label: '安装',
        icon: 'i-lucide-download',
        description: '在你的项目中安装 evlog',
        to: '/getting-started/installation'
      },
      {
        label: '快速开始',
        icon: 'i-lucide-zap',
        description: '几分钟内跑起来',
        to: '/getting-started/quick-start'
      },
      {
        label: 'Agent 技能',
        icon: 'i-lucide-bot',
        description: '让 AI 编程代理更好地使用 evlog',
        to: '/getting-started/agent-skills'
      }
    ]
  },
  {
    label: '日志',
    to: '/logging/overview',
    children: [
      {
        label: '简单日志',
        icon: 'i-lucide-terminal',
        description: '即写即走的结构化日志',
        to: '/logging/simple-logging'
      },
      {
        label: '宽事件',
        icon: 'i-lucide-rows-3',
        description: '先聚合上下文，再一次性发出',
        to: '/logging/wide-events'
      },
      {
        label: '结构化错误',
        icon: 'i-lucide-shield-alert',
        description: '说清原因并给出修复方向的错误',
        to: '/logging/structured-errors'
      },
      {
        label: '客户端日志',
        icon: 'i-lucide-monitor',
        description: '浏览器侧日志与传输',
        to: '/logging/client-logging'
      },
      {
        label: 'AI SDK',
        icon: 'i-simple-icons-vercel',
        description: '带 token 跟踪的 AI 可观测性',
        to: '/logging/ai-sdk'
      }
    ]
  },
  {
    label: '适配器',
    to: '/adapters/overview',
    children: [
      {
        label: 'Axiom',
        icon: 'i-custom-axiom',
        description: '将日志发送到 Axiom',
        to: '/adapters/axiom'
      },
      {
        label: 'OpenTelemetry',
        icon: 'i-simple-icons-opentelemetry',
        description: '通过 OTLP 协议导出',
        to: '/adapters/otlp'
      },
      {
        label: 'HyperDX',
        icon: 'i-custom-hyperdx',
        description: '通过 OTLP 发送日志到 HyperDX',
        to: '/adapters/hyperdx'
      },
      {
        label: 'PostHog',
        icon: 'i-simple-icons-posthog',
        description: '将日志发送到 PostHog',
        to: '/adapters/posthog'
      },
      {
        label: 'Sentry',
        icon: 'i-simple-icons-sentry',
        description: '把错误上报到 Sentry',
        to: '/adapters/sentry'
      },
      {
        label: 'Better Stack',
        icon: 'i-simple-icons-betterstack',
        description: '将日志流式发送到 Better Stack',
        to: '/adapters/better-stack'
      },
      {
        label: 'Datadog',
        icon: 'i-simple-icons-datadog',
        description: '将日志发送到 Datadog',
        to: '/adapters/datadog'
      }
    ]
  },
  {
    label: '发布版本',
    to: 'https://github.com/hugorcd/evlog/releases',
    target: '_blank',
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
