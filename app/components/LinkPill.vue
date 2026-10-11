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
  transition: color var(--dur-out) ease, transform var(--dur-press) var(--ease-out);
}

/* Underline on a pseudo-element so it wipes in without shifting the text. It
   retracts faster than it draws, from the far end, so it reads as the same
   line being pulled back rather than a reset. */
.pill::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.35em;
  height: 1px;
  background: var(--mesh-color, rgba(245, 245, 245, 0.7));
  transform: scaleX(0);
  transform-origin: right;
  transition: transform var(--dur-out) var(--ease-out);
}

.sigil {
  color: rgba(245, 245, 245, 0.34);
  transition: color var(--dur-out) ease;
}

/* Hover only where there's a real pointer — on touch, a tap would leave the
   underline stuck on after navigating back. */
@media (hover: hover) and (pointer: fine) {
  .pill:hover {
    color: #f5f5f5;
    transition-duration: var(--dur-in), var(--dur-press);
  }

  .pill:hover::after {
    transform: scaleX(1);
    transform-origin: left;
    transition-duration: var(--dur-in);
  }

  .pill:hover .sigil {
    color: var(--mesh-color, rgba(245, 245, 245, 0.55));
    transition-duration: var(--dur-in);
  }
}

/* Keyboard focus lands instantly: tabbing is repeated, so it never animates. */
.pill:focus-visible {
  color: #f5f5f5;
  outline: 2px solid rgba(245, 245, 245, 0.5);
  outline-offset: 3px;
  border-radius: 2px;
  transition: none;
}

.pill:focus-visible::after {
  transform: scaleX(1);
  transition: none;
}

.pill:focus-visible .sigil {
  color: var(--mesh-color, rgba(245, 245, 245, 0.55));
  transition: none;
}

/* Press feedback: the link gives a little under the finger. */
.pill:active {
  transform: scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .pill {
    transition: color var(--dur-out) ease;
  }

  .pill::after {
    transition: none;
  }

  .pill:active {
    transform: none;
  }
}
</style>
