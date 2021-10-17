import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import useFetch from '~/hooks/useFetch';

/**
 *
 * @param endpoint
 * @param method
 * @param refresh
 * @param parameters
 * @param children
 * @returns {*}
 * @constructor
 */
const Request = ({endpoint, refresh, parameters, children}) => {
    Request.propTypes = {
        endpoint: PropTypes.string.isRequired,
        parameters: PropTypes.object,
        refresh: PropTypes.number,
        children: PropTypes.func.isRequired,
    };

    const {data, error, isValidating} = useFetch(endpoint, parameters);

    const props = {
        ...data,
        error,
        loading: isValidating,
    };

    return children(props);
};

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 09.11.2020
 * Time: 23:21
 */
export default Request;
