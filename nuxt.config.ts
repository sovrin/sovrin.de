import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

// aequitas is consumed from its built dist/ in the sibling checkout (run `pnpm build` there
// first); the Docker build copies the same directory to /aequitas/dist and points AEQUITAS_DIST at it.
const root = dirname(fileURLToPath(import.meta.url))
const aequitas = resolve(root, process.env.AEQUITAS_DIST ?? '../aequitas/dist')

export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: {enabled: true},
    css: [`${aequitas}/aequitas.css`, '~/assets/css/main.css'],
    // For its asset URLs, such as the fonts Site.vue preloads.
    alias: {aequitas},
    runtimeConfig: {
        // Optional PAT to lift GitHub's 60/h unauthenticated rate limit. Set via NUXT_GITHUB_TOKEN.
        githubToken: '',
        // Directory holding the markdown notes (content/notes). Set via NUXT_CONTENT_DIR;
        // empty means <cwd>/content, which is where docker-compose mounts it.
        contentDir: '',
        public: {
            // GitHub account whose latest repos are listed. Override via NUXT_PUBLIC_GITHUB_USER.
            githubUser: 'sovrin',
        },
    },
    app: {
        head: {
            // Dark only. data-type="humanist" is aequitas' Geist preset.
            htmlAttrs: {'lang': 'en', 'data-theme': 'dark', 'data-type': 'humanist'},
            meta: [{name: 'theme-color', content: '#0f0e0c'}],
            link: [
                {rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg'},
                {rel: 'icon', type: 'image/x-icon', href: '/favicon.ico'},
                {rel: 'apple-touch-icon', href: '/apple-touch-icon.png'},
                {rel: 'alternate', type: 'application/rss+xml', title: 'notes', href: '/rss.xml'},
            ],
        },
    },
    vite: {server: {fs: {allow: [root, resolve(aequitas, '..')]}}},
})
