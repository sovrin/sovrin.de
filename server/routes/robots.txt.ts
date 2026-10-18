// A route, not a static file: the sitemap link carries the serving domain.
export default defineEventHandler((event) => {
    setHeader(event, 'content-type', 'text/plain; charset=utf-8')
    return `User-Agent: *\nDisallow:\n\nSitemap: ${getRequestURL(event, {xForwardedHost: true}).origin}/sitemap.xml\n`
})
