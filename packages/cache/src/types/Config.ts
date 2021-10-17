import {IO} from "./IO";

export type Config = {
    key?: string,
    convert?(input: string): any,
    hash?(input: string): string,
    adapter?: IO
}