<script setup lang="ts">
// Error page (404 and friends). It replaces app.vue, so it mounts its own Site.
const props = defineProps<{error: {status?: number; statusText?: string}}>()
const {portfolio} = useAppConfig()
const code = computed(() => props.error?.status || 404)
const message = computed(() => code.value === 404 ? 'This page doesn’t exist.' : 'Something went wrong.')

useHead({title: `${code.value} · ${portfolio.name}`})
</script>

<template>
  <Site>
    <section class="stack gap-5 rise" style="--i: 3">
      <div class="sheet-head">
        <h1>{{ code }}</h1>
      </div>
      <p class="lead">{{ message }}</p>
      <p>
        <NuxtLink class="btn" to="/">Back home</NuxtLink>
      </p>
    </section>
  </Site>
</template>
