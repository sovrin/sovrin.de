// Every change to the Score, pushed to each open page as it happens: edits at
// once, each bar's generation a moment before it plays, and the server's time
// with each, so pages keep their clocks on the server's (server-sent events;
// the browser reconnects on its own if the line drops).
export default defineEventHandler(async (event) => {
    if (listenersFull()) throw createError({statusCode: 503, statusMessage: 'Too many listening'})
    const stream = createEventStream(event)
    const off = onScore((state) => {
        void stream.push(JSON.stringify(state))
    })
    void stream.push(JSON.stringify(scoreState()))
    stream.onClosed(async () => {
        off()
        await stream.close()
    })
    return stream.send()
})
