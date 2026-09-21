<script setup lang="ts">
// The notes index: the dock in fill mode, listing every published note with the
// footer pinned to the bottom of the column.
definePageMeta({dock: 'fill'})

const year = new Date().getFullYear()
const {portfolio} = useAppConfig()
const {user, url} = portfolio

const title = `notes · ${user}`
const description = `notes by ${user}`
const canonical = `${url}/notes`

useHead({
  title,
  link: [{rel: 'canonical', href: canonical}],
  meta: [
    {name: 'description', content: description},
    {property: 'og:type', content: 'website'},
    {property: 'og:site_name', content: user},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:url', content: canonical},
    {property: 'og:image', content: `${url}/og.png`},
    {name: 'twitter:card', content: 'summary_large_image'},
  ],
})
</script>

<template>
  <div class="page">
    <div class="who rise" style="--d: 0s">
      <Avatar :user="user" :size="40"/>
      <Prompt class="status">
        <TypeWriter text="ls ~/notes"/>
      </Prompt>
    </div>

    <h1 class="heading rise" style="--d: 0.08s">notes</h1>

    <NoteList class="rise" style="--d: 0.14s"/>

    <div class="meta rise" style="--d: 0.2s">
      <LinkPill label="back home" sigil="←" href="/"/>
      <span class="sep" aria-hidden="true"/>
      <span class="year">{{ year }}</span>
    </div>
  </div>
</template>

<style scoped>
.status {
  --color-cursor: var(--mesh-color, rgba(245, 245, 245, 0.7));
}

.page {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
}

.meta {
  margin-top: auto;
  padding-top: var(--space-md);
}
</style>
