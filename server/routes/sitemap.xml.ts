// Replaces the hand-written public/sitemap.xml: notes are live files, so the
// list of URLs has to be too.
const entry = (loc: string, lastmod?: string) =>
    `  <url>\n    <loc>${loc}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}  </url>`

export default defineEventHandler(async (event) => {
    const {url} = useSite()
    const notes = await getNotes()
    const urls = [
        entry(`${url}/`),
        entry(`${url}/notes`, notes[0]?.date),
        ...notes.map((n) => entry(`${url}/notes/${n.slug}`, n.date)),
    ]

    setHeader(event, 'content-type', 'application/xml; charset=utf-8')
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
})
