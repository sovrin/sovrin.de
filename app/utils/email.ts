// The address follows whichever domain serves the site, so one build works on
// all of them; the registrable domain only, dropping any subdomain.
export const useEmail = () => `${useAppConfig().portfolio.mailbox}@${useRequestURL({xForwardedHost: true}).hostname.split('.').slice(-2).join('.')}`
