const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const PATH = {
    ':remove-addr':    ['req', 'socket', 'remoteAddress'],
    ':method':         ['req', 'method'],
    ':url':            ['req', 'url'],
    ':http-version':   ['req', 'httpVersion'],
    ':status':         ['res', 'statusCode'],
    ':date':           ['date'],
    ':content-length': ['contentLength'],
    ':duration':       ['duration'],
};

const PATTERN = /(:\w+[(\-\w+)]+)/g;

export const FORMAT = {
    default: ':remove-addr - [:date] ":method :url HTTP/:http-version" :status :content-length - :duration ms',
    tiny: ':method :url :status :content-length - :duration ms',
};

/**
 *
 */
const factory = (format: string = 'default') => {

    /**
     *
     * @param path
     * @param context
     */
    const getter = (path: Array<string>, context: object): any => (
        path.slice(0)
            .reduce((acc, step, i, a) => {
                if (acc[step] === undefined) {
                    // eject
                    a.splice(1);
                }

                return acc[step];
            }, context)
    );

    /**
     *
     * @param format
     * @param context
     */
    const compile = (format: string, context: object): string => {
        const parts = format.match(PATTERN);

        for (const pattern of parts) {
            const path = PATH[pattern];
            let value = getter(path, context);

            if (value === undefined) {
                value = '';
            }

            format = format.replace(pattern, value);
        }

        return format;
    };

    /**
     *
     * @param num
     */
    const pad = (num) => {
        const str = String(num);

        return (str.length === 1 ? '0' : '') + str;
    };

    /**
     *
     */
    const date = () => {
        const dateTime = new Date();

        const date = dateTime.getUTCDate();
        const hour = dateTime.getUTCHours();
        const mins = dateTime.getUTCMinutes();
        const secs = dateTime.getUTCSeconds();
        const year = dateTime.getUTCFullYear();
        const month = MONTHS[dateTime.getUTCMonth()];

        return `${pad(date)}/${month}/${year}:${pad(hour)}:${pad(mins)}:${pad(secs)} +0000`;
    };

    /**
     *
     * @param res
     */
    const contentLength = (res) => {
        const headers = res.getHeaders();
        const {['content-length']: length} = headers;

        return length;
    };

    /**
     *
     */
    return (req, res, next) => {
        const start = process.hrtime();

        /**
         *
         */
        const onClose = () => {
            offAll();
            log(req, res);
        };

        /**
         *
         */
        const onError = () => {
            offAll();
            log(req, res);
        };

        /**
         *
         */
        const onFinish = () => {
            offAll();
            log(req, res);
        };

        /**
         *
         */
        const offAll = () => {
            res.off("close", onClose);
            res.off("error", onError);
            res.off("finish", onFinish);
        };

        /**
         *
         * @param req
         * @param res
         */
        const log = (req, res) => {
            const elapsed = process.hrtime(start);

            const context = {
                req,
                res,
                date: date(),
                contentLength: contentLength(res),
                duration: (elapsed[0] * 1e3) + (elapsed[1] * 1e-6).toFixed(3),
            };

            const line = compile(FORMAT[format], context);

            console.log(line);
        };

        res.on("close", onClose);
        res.on("error", onError);
        res.on("finish", onFinish);

        next();
    };
};

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 20.12.2020
 * Time: 18:01
 */
export default factory;