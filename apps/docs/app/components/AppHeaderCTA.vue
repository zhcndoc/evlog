<template>
  <UButton
    v-if="$route.path === '/'"
    label="开始使用"
    to="/getting-started/introduction"
    size="sm"
    variant="solid"
    trailing-icon="i-lucide-arrow-right"
    class="text-white"
  />
</template>
