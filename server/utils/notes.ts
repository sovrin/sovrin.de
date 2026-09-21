// A note is one markdown file in content/notes with YAML frontmatter, rendered
// here on the server so marked and shiki never reach the client. The owner
// writes the files, so the output is trusted and unsanitised — never point
// NUXT_CONTENT_DIR at a directory visitors can write to.
import {Marked, type Tokens} from 'marked'
import {bundledLanguages, createHighlighter, type BundledLanguage, type Highlighter} from 'shiki'
import {createJavaScriptRegexEngine} from 'shiki/engine/javascript'
import type {Doc} from './content'

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

// Slugs are file names, so keep them boring: no leading dot, no separators.
const SLUG = /^[a-z0-9][a-z0-9._-]{0,63}$/

export const parseSlug = (input: string): string | null => {
    const slug = input.trim().toLowerCase()
    return SLUG.test(slug) ? slug : null
}

export const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const toDate = (value: unknown): Date | null => {
    const d = value instanceof Date ? value : new Date(String(value))
    return Number.isNaN(d.getTime()) ? null : d
}

// Frontmatter → metadata, or null for anything that shouldn't be served: a
// missing title or date, or `draft: true`.
const toMeta = (slug: string, data: Record<string, unknown>): NoteMeta | null => {
    const date = toDate(data.date)
    if (typeof data.title !== 'string' || !date || data.draft === true) return null

    return {
        slug,
        title: data.title,
        date: date.toISOString().slice(0, 10),
        description: typeof data.description === 'string' ? data.description : null,
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

// Rendered once per file version: readEntry returns the same Doc object until
// the file changes, so this cache empties itself. A failed render is dropped so
// the next request retries instead of replaying the error.
const rendered = new WeakMap<Doc, Promise<string>>()
const render = (doc: Doc) => {
    let html = rendered.get(doc)
    if (!html) {
        html = md.parse(doc.body, {async: true})
        rendered.set(doc, html)
        html.catch(() => rendered.delete(doc))
    }
    return html
}

export const getNotes = async (): Promise<NoteMeta[]> =>
    (await readEntries('notes'))
        .flatMap(({slug, data}) => toMeta(slug, data) ?? [])
        .sort((a, b) => b.date.localeCompare(a.date))

export const getNote = async (input: string): Promise<Note | null> => {
    const slug = parseSlug(input)
    if (!slug) return null

    const doc = await readEntry(`notes/${slug}.md`)
    const note = doc && toMeta(slug, doc.data)
    if (!doc || !note) return null

    return {...note, html: await render(doc)}
}
