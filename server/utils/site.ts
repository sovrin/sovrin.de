// app.config as Nitro sees it — useAppConfig() returns `any` server-side, so the
// XML routes get a typed view of it here, once.
export interface Site {
    user: string
    url: string
    phrase: string
}

export const useSite = (): Site => (useAppConfig() as {portfolio: Site}).portfolio
