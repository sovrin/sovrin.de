<script setup lang="ts">
const {portfolio} = useAppConfig()

const links = [
  {label: 'github', sigil: '▲', href: portfolio.github, external: true},
  {label: 'linkedin', sigil: 'in', href: portfolio.linkedin, external: true},
  {label: 'email', sigil: '@', href: `mailto:${portfolio.email}`, external: false},
  // {label: 'x', sigil: '✕', href: portfolio.x, external: true},
]
</script>

<template>
  <nav class="links" aria-label="Social and contact links">
    <LinkPill
        v-for="link in links"
        :key="link.label"
        :label="link.label"
        :sigil="link.sigil"
        :href="link.href"
        :external="link.external"
    />
  </nav>
</template>

<style scoped>
.links {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs) var(--space-sm);
}
</style>
