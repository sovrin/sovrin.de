import useSWR from "swr";
import {stringify} from "querystring";

/**
 *
 * @param endpoint
 * @param query
 */
const useFetch = (endpoint: string, query: object) => {
    const key = endpoint + '?' + stringify(query as any);

    return useSWR(key);
};

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 13.01.2021
 * Time: 18:49
 */
export default useFetch;