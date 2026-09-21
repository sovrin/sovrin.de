// Published notes, newest first. Not cached: the content dir is live and the
// reader already memoises on file signatures.
export default defineEventHandler(() => getNotes())
