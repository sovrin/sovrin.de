// Latest public repos for the configured GitHub user, fetched at request time
// (never baked into the client bundle) and cached in Nitro so the GitHub API is
// hit at most once per `maxAge` window across all visitors.

interface GitHubRepo {
    name: string
    description: string | null
    html_url: string
    homepage: string | null
    language: string | null
    stargazers_count: number
    pushed_at: string
    fork: boolean
    archived: boolean
    private: boolean
}

export interface Project {
    name: string
    description: string | null
    url: string
    homepage: string | null
    language: string | null
    stars: number
    pushedAt: string
}

export default defineCachedEventHandler(
    async (): Promise<Project[]> => {
        const {githubToken, public: {githubUser}} = useRuntimeConfig()

        const headers: Record<string, string> = {
            accept: 'application/vnd.github+json',
            'user-agent': 'sovrin.de',
            'x-github-api-version': '2022-11-28',
        }
        // Optional: raises the unauthenticated 60/h rate limit if NUXT_GITHUB_TOKEN is set.
        if (githubToken) headers.authorization = `Bearer ${githubToken}`

        const repos = await $fetch<GitHubRepo[]>(
            `https://api.github.com/users/${githubUser}/repos`,
            {query: {sort: 'pushed', per_page: 100, type: 'owner'}, headers},
        )

        return repos
            .filter((r) => !r.fork && !r.archived && !r.private)
            .sort((a, b) => Date.parse(b.pushed_at) - Date.parse(a.pushed_at))
            .slice(0, 5)
            .map((r) => ({
                name: r.name,
                description: r.description,
                url: r.html_url,
                homepage: r.homepage || null,
                language: r.language,
                stars: r.stargazers_count,
                pushedAt: r.pushed_at,
            }))
    },
    {
        name: 'github-projects',
        getKey: () => 'projects',
        maxAge: 60 * 60,            // fresh for 1 hour
        staleMaxAge: 60 * 60 * 24,  // serve stale up to a day while revalidating (swr)
        swr: true,
    },
)
