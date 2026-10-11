<script setup lang="ts">
const {portfolio} = useAppConfig()
const {name, user, about, role, url, github, linkedin, stack} = portfolio

const ogImage = `${url}/og.png`

useHead({
  title: name,
  link: [{rel: 'canonical', href: url}],
  meta: [
    {name: 'description', content: about},
    {property: 'og:type', content: 'website'},
    {property: 'og:site_name', content: user},
    {property: 'og:title', content: name},
    {property: 'og:description', content: about},
    {property: 'og:url', content: url},
    {property: 'og:image', content: ogImage},
    {property: 'og:image:width', content: '1200'},
    {property: 'og:image:height', content: '630'},
    {property: 'og:image:alt', content: name},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: name},
    {name: 'twitter:description', content: about},
    {name: 'twitter:image', content: ogImage},
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name,
        alternateName: user,
        jobTitle: role,
        description: about,
        url,
        sameAs: [github, linkedin],
      }),
    },
  ],
})
</script>

<template>
  <div class="sections">
    <Projects class="rise" style="--i: 3"/>
    <NoteList class="rise" style="--i: 4" :limit="3"/>
    <section aria-labelledby="stack">
      <div class="sheet-head">
        <h2 id="stack">Stack</h2>
      </div>
      <dl class="stack-list">
        <template v-for="[label, value] in stack" :key="label">
          <dt>{{ label }}</dt>
          <dd>{{ value }}</dd>
        </template>
      </dl>
    </section>
  </div>
</template>

<style scoped>
.stack-list {
  margin-block-start: var(--ae-space-4);
  font-family: var(--ae-font-mono);
  font-size: var(--ae-text-s);
}
</style>
