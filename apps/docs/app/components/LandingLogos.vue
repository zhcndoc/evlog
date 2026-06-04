<script setup lang="ts">
type LogoItem = {
  name: string
  href: string
  icon: string
  wordmarkClass?: string
}

const logos: LogoItem[] = [
  { name: 'Vercel', href: 'https://vercel.com', icon: 'i-custom:vercel', wordmarkClass: 'h-10 w-[10.9rem] shrink-0' },
  { name: 'Nuxt', href: 'https://nuxt.com', icon: 'i-custom:nuxt', wordmarkClass: 'h-10 w-[8.5rem] shrink-0' },
  { name: 'Prisma', href: 'https://www.prisma.io', icon: 'i-custom:prisma', wordmarkClass: 'h-10 w-[7.2rem] shrink-0' },
  { name: 'Adobe', href: 'https://www.adobe.com', icon: 'i-custom:adobe', wordmarkClass: 'h-10 w-[9.75rem] shrink-0' },
  { name: 'INTH', href: 'https://inth.com/', icon: 'i-custom:inth', wordmarkClass: 'h-10 w-[7.8rem] shrink-0' },
  { name: 'Databuddy', href: 'https://www.databuddy.cc', icon: 'i-custom:databuddy', wordmarkClass: 'h-10 w-[10.6rem] shrink-0' },
]
</script>

<template>
  <section
    class="relative -mt-4 pt-4"
    aria-label="Companies using evlog"
  >
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/[0.04] to-transparent"
      aria-hidden="true"
    />

    <p class="relative z-10 mb-10 text-center font-pixel text-[10px] uppercase tracking-[0.24em] text-dimmed">
      Used by
    </p>

    <div
      class="relative z-0 mx-auto grid max-w-4xl grid-cols-3 gap-x-6 gap-y-10 px-6 sm:gap-x-10 sm:px-8 place-items-center"
    >
      <LandingLogoLink
        v-for="logo in logos"
        :key="logo.name"
        v-bind="logo"
      />
    </div>
  </section>
</template>
