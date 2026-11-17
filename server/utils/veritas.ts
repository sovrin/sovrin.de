// The site's content service: veritas, the CMS inside nexitas, read through its
// delivery API with the project's token. It only ever delivers published
// entries, and texts as written; rendering and escaping are the caller's job.
export interface Entry extends Record<string, unknown> {
    slug: string
}

const request = <T>(path: string, query?: Record<string, string>) => {
    const {cms: {url, project, token}} = useRuntimeConfig()
    // A hung CMS must fail fast: an empty cache awaits this on the render path.
    return $fetch<T>(`${url}/v1/content/${project}/${path}`, {query, headers: {authorization: `Bearer ${token}`}, timeout: 3000})
}

// A collection's published entries, newest first; `fields` limits what comes back.
export const getEntries = (collection: string, fields?: string[]) =>
    request<Entry[]>(collection, fields && {fields: fields.join(',')})

// One published entry, or null when there's none (a draft is a 404 too). Any
// other failure throws, so an outage is never shown as a missing page.
export const getEntry = (collection: string, slug: string) =>
    request<Entry>(`${collection}/${slug}`).catch((e) => {
        if (e?.statusCode === 404) return null
        throw e
    })
