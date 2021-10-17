import cache from '../src/index';
import assert from "assert";
import {equals} from "./utils";
import memory from "../src/io/memory";

describe('cache', () => {
    const config = {
        key: 'json',
        adapter: memory({
            fixture: {
                "timeout": 1605047395399,
                "revision": 1,
                "path": "fixture",
                "hash": "b2f1ac983f36119edd1400ac274462fc",
                "data": [
                    "{\"foo\":2}",
                ],
            },
        }),
    };

    it('should not create anything with no payload', () => {
        const cacher = cache(config);
        const functions = cacher('');

        assert(functions === null);
    });

    it('should create a instance of cache with custom config', () => {
        const cacher = cache(config);

        assert(typeof cacher === "function");
    });

    it('should use custom hash function', () => {
        const hash = () => {
            return 'fixture';
        };

        const cacher = cache({...config, hash});
        const {fetch} = cacher('fixture?json=1');

        const data = fetch();
        assert(equals(data, ["{\"foo\":2}"]));
    });

    it('should use custom converter function', () => {
        const convert = () => {
            return 'fixture';
        };

        const cacher = cache({...config, convert});
        const {fetch} = cacher('fixture?json=1');

        const data = fetch();
        assert(equals(data, ["{\"foo\":2}"]));
    });

    it('should create a instance of cache with default config', () => {
        const cacher = cache();

        assert(typeof cacher === "function");
    });

    it('should throw with malformed cachekey', () => {
        const cacher = cache(config);

        assert.throws(() => {
            cacher('fixture?json=malformed=');
        });
    });

    it('should return cache functions', () => {
        const cacher = cache(config);
        const {verify, fetch, store} = cacher('fixture?json=' + JSON.stringify({}));

        assert(typeof verify === "function");
        assert(typeof fetch === "function");
        assert(typeof store === "function");
    });

    it('should return true on check with known path and verify payload', () => {
        const cacher = cache(config);
        const {verify} = cacher('fixture?json=' + JSON.stringify({revision: 2}));

        assert(verify());
    });

    it('should return null on non-existing entry', () => {
        const cacher = cache(config);
        const {verify} = cacher('testo?json=' + JSON.stringify({revision: 2}));

        assert(!verify());
    });

    it('should return null on missing cache key', () => {
        const cacher = cache(config);
        const functions = cacher(`fixture`);

        assert(!functions);
    });

    it('should wrap sender function, finalize and fetch data', () => {
        const cacher = cache(config);
        const route = '/api/' + ~~(Math.random() * 1000);
        const payload = {
            timeout: 2,
            revision: 1,
        };
        const {fetch, spy} = cacher(`${route}?json=` + JSON.stringify(payload));

        let send = null;

        const tester = {
            send: (data) => {
                send = data;
            },
        };

        spy(tester, 'send');
        const data = {foo: Math.random()};

        assert(!equals(data, fetch()));
        tester.send(data);
        assert(equals(data, send));
        assert(equals(data, fetch()));
    });
});