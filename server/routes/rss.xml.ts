// RSS 2.0 for the notes. Hand-built: the feed is a dozen lines, not a dependency.
export default defineEventHandler(async (event) => {
    const {user, url, phrase} = useSite()
    const notes = await getNotes()

    const items = notes.map((n) => {
        const link = `${url}/notes/${n.slug}`
        const description = n.description ? `\n      <description>${escapeHtml(n.description)}</description>` : ''
        return `    <item>
      <title>${escapeHtml(n.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${new Date(n.date).toUTCString()}</pubDate>${description}
    </item>`
    })

    setHeader(event, 'content-type', 'application/xml; charset=utf-8')
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(user)} — notes</title>
    <link>${url}/notes</link>
    <description>${escapeHtml(phrase)}</description>
    <language>en</language>
    <atom:link href="${url}/rss.xml" rel="self" type="application/rss+xml"/>
${items.join('\n')}
  </channel>
</rss>
`
})
