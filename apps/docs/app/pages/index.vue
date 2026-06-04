<script setup lang="ts">
definePageMeta({
  colorMode: 'dark',
  layout: false,
})

useHead({
  titleTemplate: '',
  link: [
    { rel: 'canonical', href: 'https://www.evlog.dev/' },
    {
      rel: 'preload',
      href: '/fonts/GeistPixel-Line.woff2',
      as: 'font',
      type: 'font/woff2',
      crossorigin: '',
    },
  ],
})

const { data: page } = await useAsyncData('evlog-docs-home', () => {
  return queryCollection('docs').path('/landing').first()
}, {
  getCachedData(key, nuxtApp) {
    return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
  },
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
  ogUrl: 'https://www.evlog.dev/',
  twitterSite: '@hugorcd',
  twitterCreator: '@hugorcd',
})
</script>

<template>
  <main v-if="page">
    <ContentRenderer :value="page" />
  </main>
</template>
