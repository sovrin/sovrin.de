<script setup lang="ts">
const {portfolio} = useAppConfig()
const {name, user, url} = portfolio

const title = `Notes · ${name}`
const description = `Notes by ${name}`
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
  <section class="rise" style="--i: 3">
    <div class="sheet-head">
      <h1>Notes</h1>
      <a href="/rss.xml">RSS</a>
    </div>
    <NoteList/>
  </section>
</template>
