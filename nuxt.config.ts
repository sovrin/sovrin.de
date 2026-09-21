export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: {enabled: true},
    css: ['~/assets/css/main.css', '~/assets/css/prose.css'],
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
            htmlAttrs: {lang: 'en'},
            meta: [{name: 'theme-color', content: '#060606'}],
            // Self-hosted Liberation Mono — preload both weights so the terminal
            // text paints without a fallback flash. No third-party font requests.
            link: [
                {rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/LiberationMono-Regular.woff2', crossorigin: ''},
                {rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/LiberationMono-Bold.woff2', crossorigin: ''},
                {rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg'},
                {rel: 'icon', type: 'image/x-icon', href: '/favicon.ico'},
                {rel: 'apple-touch-icon', href: '/apple-touch-icon.png'},
                {rel: 'alternate', type: 'application/rss+xml', title: 'notes', href: '/rss.xml'},
            ],
        },
    },
})
