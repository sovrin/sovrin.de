import {createHmac} from "crypto";
import {escape} from "./base64";
import {Algorithm} from "./types";

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 15.12.2020
 * Time: 23:56
 */
export default (input: string, key: string, algorithm: Algorithm) => {
    const str = createHmac(algorithm, key)
        .update(input)
        .digest('base64')
    ;

    return escape(str);
}