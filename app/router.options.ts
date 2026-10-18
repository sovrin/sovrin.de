import type {RouterConfig} from 'nuxt/schema'

// Nuxt scrolls only once the page transition has ended, so a page left from far
// down crossfades there and then jumps. app.vue scrolls as the transition starts.
export default {
  scrollBehavior: () => false,
} satisfies RouterConfig
