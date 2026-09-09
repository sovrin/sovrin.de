<script setup lang="ts">
// Error page (404 and friends), in the same language as the home page: the mesh
// crystal + a terminal voice — you `cat` a path that isn't there.
const props = defineProps<{error: {statusCode?: number; statusMessage?: string; url?: string}}>()
const {portfolio} = useAppConfig()
const {user} = portfolio
const year = new Date().getFullYear()

const route = useRoute()
const code = computed(() => props.error?.statusCode || 404)
// Vue's {{ }} already HTML-escapes this (no XSS), but restrict it to a URL-ish
// charset and cap the length so a crafted path can't render arbitrary text
// (content-spoofing) or blow out the layout.
const path = computed(() => {
  const raw = route.fullPath || props.error?.url || '/'
  return raw.replace(/[^\w\-./~%]/g, '').slice(0, 42) || '/'
})

useHead({
  title: `${code.value} · ${user}`,
  htmlAttrs: {lang: 'en'},
  meta: [{name: 'theme-color', content: '#060606'}],
  link: [
    {rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg'},
    {rel: 'icon', type: 'image/x-icon', href: '/favicon.ico'},
    {rel: 'apple-touch-icon', href: '/apple-touch-icon.png'},
  ],
})
</script>

<template>
  <Scene>
    <div class="who rise" style="--d: 0s">
      <Avatar :user="user" :size="40"/>
      <Prompt class="status">cat {{ path }}</Prompt>
    </div>

    <h1 class="heading rise" style="--d: 0.08s">{{ code }}</h1>

    <p class="bio rise" style="--d: 0.14s">
      no such file or directory
    </p>

    <div class="meta rise" style="--d: 0.2s">
      <LinkPill label="back home" sigil="←" href="/"/>
      <span class="sep" aria-hidden="true"/>
      <span class="year">{{ year }}</span>
    </div>
  </Scene>
</template>

<style scoped>
/* The echoed path may be one long unbroken token. */
.status {
  word-break: break-all;
}

.meta {
  margin-top: var(--space-md);
}
</style>
