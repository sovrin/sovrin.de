// The last year of GitHub contributions for the configured user, read from the
// public calendar the profile page embeds (the GraphQL API needs a token, which
// is optional here) and cached like the projects.

export interface Activity {
    total: number
    // One 0–4 level a day, oldest first; the calendar starts on a Sunday.
    levels: number[]
}

export default defineCachedEventHandler(
    async (): Promise<Activity> => {
        const {public: {githubUser}} = useRuntimeConfig()

        const html = await $fetch<string>(`https://github.com/users/${githubUser}/contributions`, {
            headers: {'user-agent': githubUser},
            responseType: 'text',
        })

        // shortcut: reads GitHub's markup, which can change; move to GraphQL contributionsCollection if it breaks.
        const levels = [...html.matchAll(/data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"/g)]
            .sort((a, b) => a[1]!.localeCompare(b[1]!))
            .map((m) => Number(m[2]))
        const total = Number(html.match(/([\d,]+)\s+contributions?\s+in the last year/)?.[1]?.replaceAll(',', '') ?? 0)
        // A half-read page throws instead of returning, so the cache keeps the last good year
        // (or, with none, the chart stays hidden) rather than storing a wrong one.
        if (levels.length < 360 || !total) {
            throw createError({statusCode: 502, statusMessage: 'GitHub contribution calendar unreadable'})
        }

        return {total, levels}
    },
    {
        name: 'github-activity',
        getKey: () => 'activity',
        maxAge: 60 * 60,
        staleMaxAge: 60 * 60 * 24,
        swr: true,
    },
)
