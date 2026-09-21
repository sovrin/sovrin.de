<script setup lang="ts">
// A sigil glyph + label link. Internal hrefs navigate through the router (the
// scene stays mounted); external ones open in a new tab.
const props = defineProps<{
  label: string
  sigil: string
  href: string
  external?: boolean
}>()
</script>

<template>
  <NuxtLink
      :to="props.href"
      :target="props.external ? '_blank' : undefined"
      :rel="props.external ? 'noreferrer' : undefined"
      class="pill"
  >
    <span class="sigil" aria-hidden="true">{{ props.sigil }}</span>{{ props.label }}
    <span v-if="props.external" class="sr-only"> (opens in a new tab)</span>
  </NuxtLink>
</template>

<style scoped>
/* Plain text link in the machine face; brightens on hover with an accent underline. */
.pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--space-3xs);
  font-family: var(--font-mono);
  font-size: var(--fs-pill);
  letter-spacing: 0.02em;
  color: rgba(245, 245, 245, 0.62);
  transition: color 0.2s ease;
}

/* Underline on a pseudo-element so it wipes in without shifting the text. */
.pill::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.35em;
  height: 1px;
  background: var(--mesh-color, rgba(245, 245, 245, 0.7));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.24s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.pill:hover,
.pill:focus-visible {
  color: #f5f5f5;
  outline: none;
}

.pill:hover::after,
.pill:focus-visible::after {
  transform: scaleX(1);
}

/* Discrete focus ring — the underline alone reads as hover, not focus. */
.pill:focus-visible {
  outline: 2px solid rgba(245, 245, 245, 0.5);
  outline-offset: 3px;
  border-radius: 2px;
}

.sigil {
  color: rgba(245, 245, 245, 0.34);
  transition: color 0.2s ease;
}

.pill:hover .sigil,
.pill:focus-visible .sigil {
  color: var(--mesh-color, rgba(245, 245, 245, 0.55));
}

@media (prefers-reduced-motion: reduce) {
  .pill::after {
    transition: none;
  }
}
</style>
