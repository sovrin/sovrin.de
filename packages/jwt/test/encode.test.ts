import {encode} from "../src";
import assert from "assert";

describe('encode', function () {
    it('encode token', function () {
        const token = encode({foo: 'bar'}, 'key');

        assert(typeof token === "string");
        assert(token.split('.').length === 3);
    });

    it('should thrown an error if keys is missing', function () {
        assert.throws(() => encode({foo: 'bar'}, null), {
            name: 'Error',
            message: 'Key can\'t be empty',
        });
    });

    it('should thrown an error when algorithm is not supported', function () {
        assert.throws(() => encode({foo: 'bar'}, 'some_key', 'FooBar256' as any), {
            name: 'Error',
            message: 'Algorithm not supported',
        });
    });

    it('should set the optional headers', () => {
        const options = {
            header: {
                foo: 'bar'
            },
        };
        const token = encode({foo: 'bar'}, 'key', 'sha256', options);

        assert(typeof token === "string");
        assert(token.split('.').length === 3);    })
});