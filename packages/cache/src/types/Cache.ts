export type Cache = {
    verify(): boolean,
    fetch(): object,
    store(data: object): void,
    spy(target: object, method: string),
    end(),
}