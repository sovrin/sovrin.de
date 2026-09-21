// One rendered note, or 404 — the page turns that into the error screen.
export default defineEventHandler(async (event) => {
    const note = await getNote(getRouterParam(event, 'slug') ?? '')
    if (!note) throw createError({status: 404, statusText: 'no such note'})
    return note
})
