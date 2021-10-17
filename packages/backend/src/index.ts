import server from './services/server';
import router from './services/router';
import {logger} from './middlewares';

const {route, register, use} = router();

use(logger());
register();

server(route())
    .listen(~~process.env.PORT || 3100)
;
