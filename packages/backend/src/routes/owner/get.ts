import {send} from 'micro';

export default (req, res) => {
    return send(res, 200, {foo: 2});
}