import assert from 'assert';
import {encode, decode} from "../src";
import {readFileSync} from 'fs';

/**
 *
 * @param a
 * @param b
 */
const equals = (a, b) => {
    if (Array.isArray(a)) {
        a = a.sort();
    }

    if (Array.isArray(b)) {
        b = b.sort();
    }

    return JSON.stringify(a) === JSON.stringify(b);
};

describe('decode', () => {
    const key = 'key';
    const payload = {foo: 'bar'};
    const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJzaGEyNTYifQ.eyJmb28iOiJiYXIifQ.VpqhmNoRgnbjhN7iv36NXmGJv_JENoF-0csx8astfno";

    it('decode token', () => {
        const actual = decode(token, key);

        assert(equals(actual, payload));
    });

    it('should throw an error when no token is provided', () => {
        assert.throws(() => decode(null, null), {
            name: 'Error',
            message: 'Token can\'t be empty',
        });
    });

    it('should throw an error when the token is not correctly formatted', () => {
        assert.throws(() => decode('foo.bar', null), {
            name: 'Error',
            message: 'Token doesn\'t consist of three segments',
        });
    });

    it('should throw an error when the specified algorithm is not supported', () => {
        const token = "eyJhbGciOiJ5ZWV0IiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.emP08u28tDrfxdyKmL_IyKHhpbxb8ghu8UEOyhdRWdw"

        assert.throws(() => decode(token, key, null), {
            name: 'Error',
            message: 'Algorithm not supported',
        });
    });

    it('should throw an error when the signature verification fails', () => {
        assert.throws(() => decode(token, 'invalid_key'), {
            name: 'Error',
            message: 'Signature verification failed',
        });
    });

    it('should throw an error when the token is not yet active (optional nbf claim)', () => {
        const nbf = (Date.now() + 1000) / 1000;
        const token = encode({foo: 'bar', nbf}, key);

        assert.throws(() => decode(token, key), {
            name: 'Error',
            message: 'Token not yet active',
        });
    });

    it('should throw an error when the token has expired (optional exp claim)', () => {
        const exp = (Date.now() - 1000) / 1000;
        const token = encode({foo: 'bar', exp}, key);

        assert.throws(() => decode(token, key), {
            name: 'Error',
            message: 'Token expired',
        });
    });

    it('should not throw any error when verification is disabled', () => {
        const token = encode(payload, key);

        assert.throws(() => decode(token, 'invalid_key1'), {
            name: 'Error',
            message: 'Signature verification failed',
        });

        assert(equals(decode(token, 'invalid_key2', 'sha256', false), payload));
    });

    it('should decode token given algorithm via key', () => {
        const key = "BEGIN PUBLIC KEY"
        const token = encode(payload, key);
        const actual = decode(token, key);

        assert(equals(actual, payload));
    });

    it('should decode token given algorithm via header', () => {
        const key = "BEGIN PUBLIC KEY";
        const token = encode(payload, key, 'sha512');
        const actual = decode(token, key, null, false);

        assert(equals(actual, payload));
    });
});