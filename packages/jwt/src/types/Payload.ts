export type Payload = {
    [key: string]: any,
    sub?: string | number,
    iss?: string,
    aud?: string,
    nbf?: number,
    exp?: number,
    iat?: number,
}