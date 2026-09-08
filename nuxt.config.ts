export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: {enabled: true},
    css: ['~/assets/css/main.css'],
    runtimeConfig: {
        // Optional PAT to lift GitHub's 60/h unauthenticated rate limit. Set via NUXT_GITHUB_TOKEN.
        githubToken: '',
        public: {
            // GitHub account whose latest repos are listed. Override via NUXT_PUBLIC_GITHUB_USER.
            githubUser: 'sovrin',
        },
    },
    app: {
        head: {
            // Self-hosted Liberation Mono — preload both weights so the terminal
            // text paints without a fallback flash. No third-party font requests.
            link: [
                {rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/LiberationMono-Regular.woff2', crossorigin: ''},
                {rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/LiberationMono-Bold.woff2', crossorigin: ''},
            ],
        },
    },
})
