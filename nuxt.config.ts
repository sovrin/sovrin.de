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
            link: [
                {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
                {rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: ''},
                {
                    rel: 'stylesheet',
                    href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;700&display=swap',
                },
            ],
        },
    },
})
