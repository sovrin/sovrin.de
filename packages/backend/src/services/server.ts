import micro from 'micro';

/**
 *
 * @param router
 */
const factory = (router) => {
    const server = micro(router);

    /**
     *
     */
    const context = () => ({
        listen,
    })

    /**
     *
     * @param port
     */
    const listen = (port: Number) => {
        server.listen(port)

        return context();
    };

    return context();
}

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 10.11.2020
 * Time: 17:32
 */
export default factory;