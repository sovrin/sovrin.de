import {createHash} from "crypto";

const factory = (input: string): string => (
    createHash('md5')
        .update(input)
        .digest('hex')
)

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 09.12.2020
 * Time: 20:13
 */
export default factory;