<script setup lang="ts">
definePageMeta({
  colorMode: 'dark',
  layout: false,
})

useHead({
  titleTemplate: '',
})

const { data: page } = await useAsyncData('landing', () => {
  return queryCollection('docs').path('/landing').first()
})

useSeoMeta({
  title: 'evlog 中文文档 - 适用于 TypeScript 的结构化日志库',
  description: page.value?.description || '适用于 TypeScript 的结构化日志库。简单日志、广泛事件和结构化错误，从快速的一行代码到全面的请求级事件。',
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
