<script setup lang="ts">
const {portfolio} = useAppConfig()
const {name, user, about, role, github, linkedin} = portfolio
const url = useRequestURL({xForwardedHost: true}).origin

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
    <Projects/>
    <NoteList :limit="3"/>
  </div>
</template>
