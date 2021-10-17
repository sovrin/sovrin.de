import {parse} from 'url';
import file from './io/file'
import memory from './io/memory'
import comparator from "./comparator";
import plain from "./converter/plain";
import none from "./hasher/none";
import {Record, Config, Cache} from "./types";

/**
 *
 * @param config
 */
const factory = (config?: Config) => {
    const {
        key = 'c',
        hash = none,
        convert = plain,
        adapter = memory()
    } = config || {};

    const {read, write} = adapter;
    const compare = comparator();
    let observer = {
        context: undefined,
        fn: undefined,
    };

    /**
     *
     * @param req
     * @param res
     */
    return (url): Cache => {
        let {query: {[key]: value, force, skip}, pathname} = parse(url, true) as any;

        if (!pathname || !value || skip !== undefined) {
            return null;
        }

        const converted = convert(value);

        if (!converted) {
            return null;
        }

        const {
            r: revision,
            t: timeout,
        } = converted || {};

        const payload = {
            revision: revision && revision,
            timeout: timeout && timeout,
            path: pathname,
            hash: hash(pathname),
        };

        /**
         *
         * @param data
         */
        const store = (data: object): void => {
            const {path} = payload;

            const entry = {
                ...payload,
                data
            }

            const key = hash(path);

            write(key, entry);
        }

        /**
         *
         */
        const fetch = (): object => {
            const {path} = payload;
            const key = hash(path);
            const target = read<Record>(key);

            if (!target) {
                return null;
            }

            const {data} = target;

            return data;
        }

        /**
         *
         */
        const verify = (): boolean => {
            const {path} = payload;
            const key = hash(path);
            const entry = read<Record>(key);

            if (!entry || force !== undefined) {
                return false;
            }

            return compare(entry, payload);
        }

        /**
         *
         */
        const end = () => {
            const value = fetch();

            observer.fn.apply(observer.fn, [value]);
        }

        /**
         *
         * @param target
         * @param method
         */
        const spy = (target, method: string) => {
            observer.fn = target[method];
            observer.context = target;

            target[method] = function () {
                const arg = arguments[0];
                store(arg);

                return observer.fn.apply(observer.context, arguments);
            };
        }

        return {
            verify,
            fetch,
            store,
            spy,
            end,
        };
    }
}

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 10.11.2020
 * Time: 20:09
 */
export {
    file,
    memory,
};
export default factory;