import verify from "./verify";
import {decode} from "./base64";
import {Header, Payload, Algorithm} from "./types";
import {Algorithms} from "./enums";

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 16.12.2020
 * Time: 00:18
 */
export default (token: string, key: string, algorithm: Algorithm = null, validate: boolean = true): Payload => {
    if (!token) {
        throw new Error('Token can\'t be empty');
    }

    const segments = token.split('.');
    if (segments.length !== 3) {
        throw new Error('Token doesn\'t consist of three segments');
    }

    let [header, payload, signature] = segments as any;

    header = JSON.parse(decode(header)) as Header;
    payload = JSON.parse(decode(payload)) as Payload;

    if (!validate) {
        return payload;
    }

    if (/BEGIN( RSA)? PUBLIC KEY/.test(key.toString())) {
        algorithm = 'sha256';
    }

    algorithm = algorithm || header.alg;
    if (!Algorithms.includes(algorithm)) {
        throw new Error('Algorithm not supported');
    }

    const signing = segments.slice(0, 2)
        .join('.')
    ;
    if (!verify(signing, key, algorithm, signature)) {
        throw new Error('Signature verification failed');
    }

    if (payload.nbf && Date.now() < payload.nbf*1000) {
        throw new Error('Token not yet active');
    }

    if (payload.exp && Date.now() > payload.exp*1000) {
        throw new Error('Token expired');
    }

    return payload;
}
