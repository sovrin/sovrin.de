export type Record = object & {
    revision?: number,
    timeout?: number,
    hash?: string,
    path?: string,
    data?: object,
    hit?: boolean,
    miss?: boolean,
}