import factory from '~/services/request';

/**
 *
 * @param type
 * @returns {function(*): function(*=): function(): void}
 */
const useRequest = (type) => (options) => {
    const {
        url,
        parameters = {},
        headers = {},
        fallback = [],
        setData,
        setLoading,
        setStatus,
        setError,
    } = options;

    /**
     *
     * @param data
     * @param status
     */
    const onSuccess = ([data, status]) => {
        setStatus && setStatus(status);
        setData && setData(data || fallback);
        setLoading && setLoading(false);
    };

    /**
     *
     * @param e
     */
    const onError = (e) => {
        setLoading(false);
        setError(e);
        console.error(e);
    };

    /**
     *
     */
    return (overload = {}) => {
        setLoading && setLoading(true);

        const fn = ({
            get: factory(headers).get,
            post: factory(headers).post,
            del: factory(headers).rem,
        })[type];

        const process = fn(url, {
            ...overload,
            ...parameters
        });

        process.then(onSuccess)
            .catch(onError)
        ;

        return () => {
            process.abort();
        };
    };
};

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 09.11.2020
 * Time: 23:20
 */
export default useRequest;