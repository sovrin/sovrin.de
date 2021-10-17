import {Record} from "./types";

/**
 *
 */
const factory = () => {

    /**
     *
     * @param key
     */
    const comparator = (key: string) => {
        return (a?: Record, b?: Record): number => {
            if (a[key] === b[key]) {
                return 0;
            }

            return (a[key] > b[key])
                ? +1
                : -1
            ;
        }
    }

    /**
     *
     * @param a
     * @param b
     */
    const timeout = comparator('timeout');

    /**
     *
     * @param a
     * @param b
     */
    const revision = comparator('revision');

    /**
     *
     * @param a
     * @param b
     */
    return (a: Record, b: Record = {}): boolean => {
        const comparators = {
            timeout,
            revision
        }

        const values = Object.keys(comparators)
            .filter((key) => b[key] !== undefined)
            .map((key) => comparators[key])
            .reduce((acc, comparator) => {
                acc.push(comparator(a, b));

                return acc;
            }, [])
        ;

        return values.some((value) => value === 1)
            || values.every((value) => value === 0)
        ;
    }
}

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 13.11.2020
 * Time: 00:12
 */
export default factory;