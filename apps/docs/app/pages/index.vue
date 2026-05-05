<script setup lang="ts">
definePageMeta({
  colorMode: 'dark',
  layout: false,
})

useHead({
  titleTemplate: '',
})

const { data: page } = await useAsyncData('evlog-docs-home', () => {
  return queryCollection('docs').path('/landing').first()
})

useSeoMeta({
  title:
    page.value?.title
    || `Evlog 中文文档 - 适用于 TypeScript 的结构化日志库`,
  description:
    page.value?.description
    || '一个现代的 TypeScript 日志器，适用于你交付的一切——脚本、库、任务、边缘、请求。一个 API 即可实现简单日志、广泛事件和结构化错误。',
  ogImage: '/og.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterSite: '@hugorcd',
  twitterCreator: '@hugorcd',
})
</script>

<template>
  <div>
    <ContentRenderer v-if="page" :value="page" />
  </div>
</template>
