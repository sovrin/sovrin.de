export enum Timeout {
    MONTH = 1000 * 60 * 24 * 31,
    DAY = 1000 * 60 * 24,
    HOUR = 1000 * 60,
}

/**
 *
 * @returns {{setTimeout: setTimeout, build: (function(): string), setRevision: setRevision}}
 */
const useCacheKey = () => {
    const parameters = {
        t: undefined,
        r: undefined,
    };

    /**
     *
     * @param revision
     */
    const setRevision = (revision: number) => {
        parameters.r = revision;
    };

    /**
     *
     * @param timeout
     */
    const setTimeout = (timeout: Timeout) => {
        const now = (new Date()).getTime();

        parameters.t = now - timeout;
    };

    /**
     *
     * @returns {string}
     */
    const build = () => {
        return 'r:' + parameters.r + '|' + 't:' + parameters.t;

        const string = JSON.stringify(parameters);

        return Buffer.from(string)
            .toString('base64')
        ;
    };

    return {
        setTimeout,
        setRevision,
        build,
    };
};

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 10.11.2020
 * Time: 17:39
 */
export default useCacheKey;