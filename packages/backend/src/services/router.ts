import {resolve} from "path";
import fsbr from 'fsbr';

/**
 *
 * @param handler
 */
const factory = () => {
    const router = fsbr({
        ext: '.ts'
    });

    const context = () => ({
        route,
        register,
        use,
    });

    /**
     *
     */
    const route = () => {
        return router.route;
    }

    /**
     *
     */
    const register = () => {
        const folder = resolve(__dirname, '..', 'routes');
        router.register(folder);

        return context();
    }

    /**
     *
     * @param middleware
     */
    const use = (middleware) => {
        router.use(middleware);

        return context();
    }

    return context();
};

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 10.11.2020
 * Time: 17:37
 */
export default factory;