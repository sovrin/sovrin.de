import {resolve} from "path";
import {readFileSync, writeFileSync} from "fs";
import {Record, IO} from "../types";

/**
 *
 * @param base
 */
const factory = (base: string): IO => {

    /**
     *
     * @param input
     */
    const sanitize = (input: string): string => {
        return input.split('/')
            .filter(Boolean)
            .join('$');
    }

    /**
     *
     * @param cursor
     * @param record
     */
    const write = (cursor: string, record: Record): void => {
        cursor = sanitize(cursor);

        const path = resolve(base, `${cursor}.json`);
        const string = JSON.stringify(record);

        writeFileSync(path, string);
    }

    /**
     *
     * @param cursor
     */
    const read = <T>(cursor: string): T => {
        cursor = sanitize(cursor);

        const path = resolve(base, `${cursor}.json`);

        try {
            const buffer = readFileSync(path);
            const string = buffer.toString();

            return JSON.parse(string);
        } catch (e) {
            return null;
        }
    }

    return {
        write,
        read,
    }
}

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 08.12.2020
 * Time: 23:33
 */
export default factory;