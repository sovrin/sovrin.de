import {Record} from "../types/Record";
import {IO} from "../types/IO";

/**
 *
 * @param state
 */
const factory = (state = {}): IO => {

    /**
     *
     * @param cursor
     * @param record
     */
    const write = (cursor: string, record: Record): void => {
        state[cursor] = record;
    }

    /**
     *
     * @param cursor
     */
    const read = <T>(cursor: string): T => {
        return state[cursor];
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