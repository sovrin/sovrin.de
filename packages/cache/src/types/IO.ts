import {Record} from "./Record";

export type IO = {
    write(cursor: string, record: Record): void,
    read<T>(cursor: string): T,
}