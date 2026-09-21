// Markdown content read live from disk — a mounted volume in production — so a
// post is published by saving a file, not by rebuilding. Reads are memoised on
// an mtime+size signature: a stat per request, a re-parse only when something
// changed. Frontmatter parsing happens only here.
import matter from 'gray-matter'
import {readdir, readFile, stat} from 'node:fs/promises'
import {join} from 'node:path'

export interface Entry {
    slug: string
    data: Record<string, unknown>
}

export interface Doc {
    data: Record<string, unknown>
    body: string
}

// NUXT_CONTENT_DIR overrides; the default is where docker-compose mounts it.
const contentDir = () => useRuntimeConfig().contentDir || join(process.cwd(), 'content')

const MISSING = '∅'

type Signature = (key: string) => Promise<string>
type Loader<V> = (key: string) => Promise<V>

// Re-runs the loader only when the key's signature changed since the last call.
// Misses are never stored: the key can be a visitor-supplied slug, and a bot
// walking random URLs must not grow the map.
const memoize = (signature: Signature) => <V>(load: Loader<V>): Loader<V> => {
    const store = new Map<string, {sig: string; value: V}>()

    return async (key) => {
        const sig = await signature(key)
        const hit = store.get(key)
        if (hit?.sig === sig) return hit.value

        const value = await load(key)
        if (sig !== MISSING) store.set(key, {sig, value})
        return value
    }
}

// `_`-prefixed files are unlisted: readable by path, absent from the listing.
const markdownFiles = async (dir: string) =>
    (await readdir(dir)).filter((f) => f.endsWith('.md') && !f.startsWith('_')).sort()

const dirSignature = async (sub: string) => {
    const dir = join(contentDir(), sub)
    try {
        const files = await markdownFiles(dir)
        const stats = await Promise.all(files.map((f) => stat(join(dir, f))))
        return files.map((f, i) => `${f}:${stats[i].mtimeMs}:${stats[i].size}`).join('|')
    } catch {
        return MISSING
    }
}

const loadEntries = async (sub: string): Promise<Entry[]> => {
    const dir = join(contentDir(), sub)
    let files: string[]
    try {
        files = await markdownFiles(dir)
    } catch {
        return []
    }

    return Promise.all(files.map(async (f) => ({
        slug: f.slice(0, -3),
        data: matter(await readFile(join(dir, f), 'utf8')).data,
    })))
}

export const readEntries = memoize(dirSignature)(loadEntries)

const fileSignature = async (rel: string) => {
    try {
        const s = await stat(join(contentDir(), rel))
        return `${s.mtimeMs}:${s.size}`
    } catch {
        return MISSING
    }
}

const loadEntry = async (rel: string): Promise<Doc | null> => {
    try {
        const {data, content} = matter(await readFile(join(contentDir(), rel), 'utf8'))
        return {data, body: content}
    } catch {
        return null
    }
}

export const readEntry = memoize(fileSignature)(loadEntry)
