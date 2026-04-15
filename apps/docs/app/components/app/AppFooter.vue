<script setup lang="ts">
import type { FooterColumn } from '@nuxt/ui'

const route = useRoute()
const isLanding = computed(() => route.path === '/')
const { public: pub } = useRuntimeConfig()
const justUseEvlogUrl = computed(() =>
  typeof pub.justUseEvlogUrl === 'string' ? pub.justUseEvlogUrl.trim() : '',
)

const columns = computed<FooterColumn[]>(() => [
  {
    label: '资源',
    children: [
      {
        label: '文档',
        to: '/getting-started/introduction'
      },
      ...(justUseEvlogUrl.value
        ? [
          {
            label: '直接用 evlog',
            to: justUseEvlogUrl.value,
            target: '_blank' as const,
          }
        ]
        : []),
      {
        label: '发布版本',
        to: 'https://github.com/hugorcd/evlog/releases',
        target: '_blank'
      },
      {
        label: 'LLMs.txt',
        to: '/llms.txt',
        target: '_blank'
      }
    ]
  },
  {
    label: '社区',
    children: [
      {
        label: 'GitHub',
        to: 'https://github.com/hugorcd/evlog',
        target: '_blank'
      },
      {
        label: '参与贡献',
        to: 'https://github.com/hugorcd/evlog/blob/main/CONTRIBUTING.md',
        target: '_blank'
      }
    ]
  }
])
</script>

<template>
  <UFooter v-if="!isLanding" :ui="{ top: 'border-b border-default', root: 'z-10 border-t border-default' }">
    <template #top>
      <UContainer>
        <UFooterColumns :columns />
      </UContainer>
    </template>

    <template #left>
      <div class="text-xs font-mono tracking-tight">
        <span class="text-muted">&copy; {{ new Date().getFullYear() }} - Made by </span>
        <ULink to="https://hrcd.fr/" target="_blank" class="hover:underline">
          HugoRCD
        </ULink>
        <span class="text-muted"> | </span>
        <a style="text-decoration: none;" target="_blank" href="https://www.zhcndoc.com">简中文档</a>
        <span class="text-muted"> | </span>
        <a style="text-decoration: none;" rel="nofollow" target="_blank" href="https://beian.miit.gov.cn">沪ICP备2024070610号-3</a>
      </div>
    </template>

    <template #right>
      <UButton
        color="neutral"
        variant="ghost"
        to="https://x.com/hugorcd"
        target="_blank"
        icon="i-simple-icons-x"
        size="sm"
        aria-label="X"
      />
      <UButton
        color="neutral"
        variant="ghost"
        to="https://github.com/hugorcd/evlog"
        target="_blank"
        icon="i-simple-icons-github"
        size="sm"
        aria-label="GitHub"
      />
    </template>
  </UFooter>
</template>
