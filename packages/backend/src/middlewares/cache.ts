import cacheFactory, {file} from '@sovrin/cache';
import {decode} from '@sovrin/jwt';

/**
 *
 */
const factory = () => {

    /**
     *
     * @param input
     */
    const convert = (input: string) => {
        return input.split('|')
            .reduce((acc, entry) => {
                const [key, value] = entry.split(':');

                acc[key] = value;
                return acc;
            }, {});

        try {
            return decode(input, 'yeet', 'sha256');
        } catch (e) {
            return null;
        }
    };

    const bind = cacheFactory({
        adapter: file("C:\\dev\\projects\\sovrin.de\\packages\\backend\\.cache"),
        key: 'jwt',
        convert,
    });

    /**
     *
     */
    return (req, res, next) => {
        const {url} = req;
        const cached = bind(url);

        if (!cached) {
            return next();
        }

        const {verify, spy, fetch} = cached;

        if (verify()) {
            return fetch();
        }

        spy(res, 'end');

        return next();
    };
};

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 10.11.2020
 * Time: 20:12
 */
export default factory;