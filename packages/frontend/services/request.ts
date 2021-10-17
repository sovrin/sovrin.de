const HEADER = {
    'Content-Type': 'application/json',
};

/**
 *
 * @returns {*}
 */
const factory = (headers) => {

    /**
     *
     * @param url
     * @param options
     */
    const execute = async (url, options) => {
        const response = await fetch(url, options);
        const {status} = response;

        const json = await response.json();

        return [json, status];
    };

    /**
     *
     * @param endpoint
     * @param options
     * @returns {Promise<[*, number]>}
     */
    const build = (endpoint, options = null) => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fn = () => execute(endpoint, {...options, signal});
        fn.abort = () => controller.abort();

        return fn();
    };

    /**
     *
     * @param obj
     * @returns {string}
     */
    const serialize = (obj) => {
        const pairs = [];

        for (const prop in obj) {
            if (!obj.hasOwnProperty(prop)) {
                continue;
            }

            if (typeof obj[prop] === 'object') {
                pairs.push(serialize(obj[prop]));

                continue;
            }

            pairs.push(prop + '=' + obj[prop]);
        }

        return pairs.join('&');
    };

    /**
     *
     * @param url
     * @param param
     * @returns {Promise<(*|number)[]>}
     */
    const get = (url, param = null) => {
        if (param && Object.keys(param).length) {
            url += `?` + serialize(param);
        }

        return build(url, {
            method: 'GET',
        });
    };

    /**
     *
     * @param url
     * @param data
     * @returns {Promise<(*|number)[]>}
     */
    const put = (url, data) => {
        const request = {
            method: 'PUT',
            body: JSON.stringify(data),
            headers: new Headers(HEADER),
        };

        return build(url, request);
    };

    /**
     *
     * @param url
     * @param data
     * @returns {Promise<(*|number)[]>}
     */
    const post = (url, data) => {
        const request = {
            method: 'POST',
            body: JSON.stringify(data),
            headers: new Headers(HEADER),
        };

        return build(url, request);
    };

    /**
     *
     * @param url
     * @param data
     * @returns {Promise<(*|number)[]>}
     */
    const rem = (url, data) => {
        const request = {
            method: 'DELETE',
            body: JSON.stringify(data),
            headers: new Headers(HEADER),
        };

        return build(url, request);
    };

    return {
        get,
        rem,
        put,
        post,
    };
}

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 09.11.2020
 * Time: 23:19
 */
export default factory;