<template>
  <UButton
    v-if="$route.path === '/'"
    label="开始使用"
    to="/start/introduction"
    size="sm"
    variant="solid"
    trailing-icon="i-lucide-arrow-right"
    class="hidden text-white sm:inline-flex"
  />
</template>
