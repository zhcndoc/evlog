<script setup lang="ts">
definePageMeta({
  colorMode: 'dark',
  layout: false,
})

// The product, the publisher and the site identity come from `seo.schema` in
// `app.config.ts`; `useSeo` emits them as one linked graph, plus the canonical
// and the OG tags. Only what that shape cannot carry is added here.
const identityFacts = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  // Same `@id` as the node `useSeo` emits, so this merges into it rather than
  // declaring a second product. Coupled to Docus's `#identity` convention.
  '@id': 'https://www.evlog.dev/#identity',
  license: 'https://github.com/evloghq/evlog/blob/main/LICENSE',
  author: { '@type': 'Person', name: 'HugoRCD', url: 'https://hugorcd.com/' },
}

useHead({
  titleTemplate: '',
  link: [
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

// The FAQ is read back from the accordion the page renders, so an answer edited
// in `0.landing.md` never disagrees with the one search engines are given. Both
// shapes go in one call, after the page resolves: the landing's content does not
// change at runtime, so there is nothing here for a getter to react to.
const faq = faqSchema(page.value?.body)

useHead({
  script: [identityFacts, ...(faq ? [faq] : [])]
    .map(schema => ({ type: 'application/ld+json', innerHTML: JSON.stringify(schema) })),
})

useSeo({
  title:
    page.value?.title
    || `Evlog 中文文档 - 适用于 TypeScript 的结构化日志库`,
  description:
    page.value?.description
    || '一个现代的 TypeScript 日志器，适用于你交付的一切——脚本、库、任务、边缘、请求。一个 API 即可实现简单日志、广泛事件和结构化错误。',
  type: 'website',
  ogImage: '/og.png',
})

useSeoMeta({
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterSite: '@hugorcd',
  twitterCreator: '@hugorcd',
})
</script>

<template>
  <main v-if="page">
    <ContentRenderer :value="page" />
  </main>
</template>
