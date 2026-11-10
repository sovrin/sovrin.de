// Put notes in the shared score, bend them, move them or take them out:
// {edits: [{i, alt}]}, alt null to remove. Everyone hears it from the next
// step on. Every answer says, in x-edits-busy, how many ms until each of this
// visitor's used edits frees up, so the page can show what's left.
export default defineEventHandler(async (event) => {
    // A batch is at most a bar of small edits; anything bigger isn't one.
    if (Number(getRequestHeader(event, 'content-length') ?? 0) > 4096) throw createError({statusCode: 413, statusMessage: 'Too big'})
    const body = await readBody<{edits?: unknown}>(event)
    const who = visitor(event)
    const result = setNotes(body?.edits, who)
    setResponseHeader(event, 'x-edits-busy', quota(who).map(Math.ceil).join(','))
    if (result === 'invalid') throw createError({statusCode: 400, statusMessage: 'No such edit'})
    if (result === 'limited') throw createError({statusCode: 429, statusMessage: 'Not so fast'})
    return scoreState()
})
