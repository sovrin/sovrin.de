import React, {createContext} from 'react';
import getConfig from 'next/config';

export const Context = createContext(null);
const {Provider} = Context;

/**
 *
 * @param children
 * @param overload
 * @returns {JSX.Element}
 * @constructor
 */
const Config = ({children, ...overload}) => {
    const {publicRuntimeConfig: config} = getConfig();
    const value = {
        ...overload,
        ...config
    };

    return (
        <Provider value={value}>
            {children}
        </Provider>
    );
};

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 09.11.2020
 * Time: 23:25
 */
export default Config;