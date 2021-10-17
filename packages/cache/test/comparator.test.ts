import assert from "assert";
import {Record} from "../src/types";
import comparator from '../src/comparator';

describe('cache', () => {
    describe('comparator', () => {
        it('should return true on empty records', async () => {
            const compare = comparator();
            const a: Record = {};
            const b: Record = {};

            assert(compare(a, b));
        });

        it('should return false on incomplete records', async () => {
            const compare = comparator();
            const a: Record = {timeout: 1};
            const b: Record = {revision: 1};

            assert(!compare(a, b));
        });

        it('should return true on identical records', async () => {
            const compare = comparator();
            const a: Record = {timeout: 1};
            const b: Record = {timeout: 1};

            assert(compare(a, b));
        });

        it('should return true on higher timeout left record', async () => {
            const compare = comparator();
            const a: Record = {timeout: 2};
            const b: Record = {timeout: 1};

            assert(compare(a, b));
        });

        it('should return false on lower timeout left record', async () => {
            const compare = comparator();
            const a: Record = {timeout: 1};
            const b: Record = {timeout: 2};

            assert(!compare(a, b));
        });

        it('should return true on higher revision left record', async () => {
            const compare = comparator();
            const a: Record = {revision: 2};
            const b: Record = {revision: 1};

            assert(compare(a, b));
        });

        it('should return false on lower revision left record', async () => {
            const compare = comparator();
            const a: Record = {revision: 1};
            const b: Record = {revision: 2};

            assert(!compare(a, b));
        });
    });
});