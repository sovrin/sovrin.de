import sign from "./sign";
import {Algorithm} from "./types";

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 16.12.2020
 * Time: 00:11
 */
export default (input: string, key: string, algorithm: Algorithm, signature: string) => (
    signature === sign(input, key, algorithm)
);