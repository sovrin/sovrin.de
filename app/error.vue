<script setup lang="ts">
// Error page (404 and friends). It replaces app.vue, so it mounts its own Site.
// The rail already leads home, so the page only offers what the rail doesn't.
const props = defineProps<{error: {status?: number; statusText?: string}}>()
const {portfolio} = useAppConfig()
const code = computed(() => props.error?.status || 404)
const missing = computed(() => code.value === 404)

useHead({title: `${code.value} · ${portfolio.name}`})
</script>

<template>
  <Site>
    <section class="stack gap-4">
      <h1 class="numeral">{{ code }}</h1>
      <p class="lead">{{ missing ? 'This page doesn’t exist.' : 'Something went wrong.' }}</p>
      <p v-if="missing">
        <NuxtLink to="/notes">all notes →</NuxtLink>
      </p>
    </section>
  </Site>
</template>

<style scoped>
/* The wall's yellow and the name's voice: the one loud thing on an empty page. */
.numeral {
  margin: 0;
  font-size: clamp(4rem, 12vw, 6rem);
  font-weight: 700;
  letter-spacing: -0.055em;
  line-height: 0.9;
  color: var(--wall);
}

.lead {
  margin: 0;
}
</style>
