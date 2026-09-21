<script setup lang="ts">
const year = new Date().getFullYear()
const {portfolio} = useAppConfig()
const {user, phrase, role, url, github, linkedin} = portfolio

const ogImage = `${url}/og.png`

useHead({
  title: user,
  link: [{rel: 'canonical', href: url}],
  meta: [
    {name: 'description', content: phrase},
    {property: 'og:type', content: 'website'},
    {property: 'og:site_name', content: user},
    {property: 'og:title', content: user},
    {property: 'og:description', content: phrase},
    {property: 'og:url', content: url},
    {property: 'og:image', content: ogImage},
    {property: 'og:image:width', content: '1200'},
    {property: 'og:image:height', content: '630'},
    {property: 'og:image:alt', content: `${user} — ${phrase}`},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: user},
    {name: 'twitter:description', content: phrase},
    {name: 'twitter:image', content: ogImage},
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: user,
        jobTitle: role,
        description: phrase,
        url,
        sameAs: [github, linkedin],
      }),
    },
  ],
})
</script>

<template>
  <div>
    <div class="who rise" style="--d: 0s">
      <Avatar :user="user" :size="40"/>
      <Prompt class="status">
        <TypeWriter text="whoami"/>
      </Prompt>
    </div>

    <h1 class="heading rise" style="--d: 0.08s">{{ user }}</h1>

    <p class="bio rise" style="--d: 0.14s">
      {{ phrase }}
    </p>

    <Projects class="rise" style="--d: 0.2s"/>

    <NoteList class="rise" style="--d: 0.26s" prompt="ls ~/notes" :limit="3"/>

    <section class="contact rise" style="--d: 0.32s" aria-label="Contact and social links">
      <Prompt class="contact-head">cat ~/contact</Prompt>
      <div class="meta">
        <SocialLinks/>
        <span class="sep" aria-hidden="true"/>
        <span class="year">{{ year }}</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Caret glows in the avatar-sampled colour. */
.status {
  --color-cursor: var(--mesh-color, rgba(245, 245, 245, 0.7));
}

.contact {
  margin-top: var(--space-md);
}

.contact-head {
  margin-bottom: var(--space-2xs);
}
</style>
