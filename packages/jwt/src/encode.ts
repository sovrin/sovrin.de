import sign from "./sign";
import {encode} from "./base64";
import {Algorithm, Options, Header, Payload} from "./types";
import {Algorithms} from "./enums";

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 16.12.2020
 * Time: 00:16
 */
export default (payload: Payload, key: string, algorithm: Algorithm = 'sha256', options?: Options): string => {
    if (!key) {
        throw new Error('Key can\'t be empty');
    }

    if (!Algorithms.includes(algorithm)) {
        throw new Error('Algorithm not supported');
    }

    const header: Header = {
        typ: 'JWT',
        alg: algorithm,
    }

    if (options && options.header) {
        Object.assign(header, options.header);
    }

    const segments = [
        encode(JSON.stringify(header)),
        encode(JSON.stringify(payload)),
    ];

    return [
        ...segments,
        sign(segments.join('.'), key, algorithm)
    ].join('.');
}