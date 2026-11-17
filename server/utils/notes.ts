// A note is an entry of the `notes` collection in veritas (see veritas.ts):
// title and slug, plus date, description, tags and a markdown body.
// It's rendered here on the server so marked and shiki never reach the client.
// veritas delivers texts raw and marked doesn't sanitise, so the output is only
// as trusted as whoever can edit the project's content — keep that the owner.
import {Marked, type Tokens} from 'marked'
import {bundledLanguages, createHighlighter, type BundledLanguage, type Highlighter} from 'shiki'
import {createJavaScriptRegexEngine} from 'shiki/engine/javascript'
import type {Entry} from './veritas'

export interface NoteMeta {
    slug: string
    title: string
    // YYYY-MM-DD as written; a string so server and client agree with no timezone maths.
    date: string
    description: string | null
    tags: string[]
}

export interface Note extends NoteMeta {
    html: string
}

// veritas' own slug rule, checked before a visitor's slug goes into a CMS URL.
const SLUG = /^[a-z0-9-]{1,128}$/

export const parseSlug = (input: string): string | null => {
    const slug = input.trim().toLowerCase()
    return SLUG.test(slug) ? slug : null
}

export const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// An entry → metadata, or null for one that can't be served: veritas delivers
// an empty Date field as "".
const toMeta = ({slug, ...data}: Entry): NoteMeta | null => {
    if (typeof data.title !== 'string' || typeof data.date !== 'string' || !data.date) return null

    return {
        slug,
        title: data.title,
        date: data.date,
        description: typeof data.description === 'string' && data.description ? data.description : null,
        tags: Array.isArray(data.tags) ? data.tags.filter((t): t is string => typeof t === 'string') : [],
    }
}

const THEME = 'vitesse-dark'
let highlighter: Promise<Highlighter> | undefined

// One highlighter per process, grammars loaded on first use from shiki's full
// bundle (lazy chunks, so any fence language works). The JS regex engine means
// the oniguruma wasm chunk is emitted but never loaded.
const getHighlighter = () => highlighter ??= createHighlighter({
    themes: [THEME],
    langs: [],
    engine: createJavaScriptRegexEngine({forgiving: true}),
})

// null for a language shiki doesn't know; the caller falls back to plain <pre>.
const highlight = async (code: string, lang: string): Promise<string | null> => {
    if (!(lang in bundledLanguages)) return null
    const h = await getHighlighter()
    if (!h.getLoadedLanguages().includes(lang)) await h.loadLanguage(lang as BundledLanguage)
    return h.codeToHtml(code, {lang, theme: THEME})
}

// Fenced code: ```lang title="file.ts" → <figure class="code"> with a bar naming
// the file (or the language) over the highlighted body. Marked's parser can't
// await a renderer, so the work happens in walkTokens and the token is turned
// into an html token, which the renderer emits verbatim.
const md = new Marked({
    async: true,
    walkTokens: async (token) => {
        if (token.type !== 'code') return
        const {text, lang: info = ''} = token as Tokens.Code
        const lang = info.split(/\s+/)[0] || 'text'
        const label = /title="([^"]+)"/.exec(info)?.[1] ?? (lang === 'text' ? null : lang)

        const body = await highlight(text, lang).catch(() => null)
            ?? `<pre><code>${escapeHtml(text)}</code></pre>`
        const bar = label ? `<figcaption class="code-bar">${escapeHtml(label)}</figcaption>` : ''

        Object.assign(token, {type: 'html', block: true, pre: false, text: `<figure class="code">${bar}${body}</figure>`})
    },
})

// Published notes, newest first — what the list, the feed and the sitemap show.
// Cached a minute across visitors (stale served while it refreshes), so saving
// in the CMS shows up within that, and a burst of visits is one CMS request.
export const getNotes = defineCachedFunction(async (): Promise<NoteMeta[]> =>
    (await getEntries('notes', ['title', 'date', 'description', 'tags']))
        .flatMap((entry) => toMeta(entry) ?? [])
        .sort((a, b) => b.date.localeCompare(a.date)),
{name: 'notes', maxAge: 60})

// One rendered note. Only hits are cached: the slug comes from the URL, and a
// bot walking random ones must not grow the cache.
const fetchNote = defineCachedFunction(async (slug: string): Promise<Note | null> => {
    const entry = await getEntry('notes', slug)
    const note = entry && toMeta(entry)
    if (!note) return null

    return {...note, html: await md.parse(String(entry.body ?? ''), {async: true})}
}, {name: 'note', maxAge: 60, getKey: (slug: string) => slug, validate: (entry) => entry.value != null})

export const getNote = async (input: string): Promise<Note | null> => {
    const slug = parseSlug(input)
    return slug ? fetchNote(slug) : null
}
