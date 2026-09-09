<script setup lang="ts">
// The `$ command` eyebrow of the machine layer. The sigil glows in the
// avatar-sampled colour; the command is whatever the caller slots in.
</script>

<template>
  <div class="prompt">
    <span class="sigil" aria-hidden="true">$</span>
    <slot/>
  </div>
</template>

<style scoped>
.prompt {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  color: rgba(245, 245, 245, 0.5);
}

.sigil {
  margin-right: 0.4em;
  color: var(--mesh-color, rgba(245, 245, 245, 0.4));
  transition: color 0.8s ease;
}
</style>
