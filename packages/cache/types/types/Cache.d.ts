export declare type Cache = {
    verify(): boolean;
    fetch(): object;
    store(data: object): void;
    spy(target: object, method: string): any;
    end(): any;
};
