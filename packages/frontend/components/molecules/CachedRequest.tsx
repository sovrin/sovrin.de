import React from 'react';
import PropTypes from 'prop-types';
import useCacheKey, {Timeout} from '~/hooks/useCacheKey';
import Request from '~/components/molecules/Request';

/**
 *
 * @param timeout
 * @param revision
 * @param method
 * @param endpoint
 * @param children
 * @returns {JSX.Element}
 * @constructor
 */
const CachedRequest = ({timeout = Timeout.MONTH, revision = 1, endpoint, children}) => {
    const {setRevision, setTimeout, build} = useCacheKey();

    setTimeout(timeout);
    setRevision(revision);

    const parameters = {
        jwt: build()
    }

    return (
        <Request
            endpoint={endpoint}
            parameters={parameters}
        >
            {children}
        </Request>
    );
};

CachedRequest.propTypes = {
    timeout: PropTypes.number,
    revision: PropTypes.number,
    endpoint: PropTypes.string.isRequired,
    method: PropTypes.string.isRequired,
    parameters: PropTypes.object,
    refresh: PropTypes.number,
    children: PropTypes.func.isRequired,
};

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 10.11.2020
 * Time: 18:01
 */
export default CachedRequest;