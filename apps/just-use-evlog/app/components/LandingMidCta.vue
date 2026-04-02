<script setup lang="ts">
const { public: pub } = useRuntimeConfig()
const docsUrl = computed(() => pub.docsUrl || 'https://www.evlog.dev')
</script>

<template>
  <div class="my-8 flex items-center gap-6">
    <NuxtLink
      :to="`${docsUrl}/getting-started/quick-start`"
      class="text-sm font-semibold text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
      target="_blank"
      rel="noopener noreferrer"
    >
      Get started in 5 minutes
    </NuxtLink>
    <span class="text-muted text-xs">or keep reading</span>
  </div>
</template>
