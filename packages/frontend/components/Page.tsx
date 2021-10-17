import React from 'react';
import Config from '~/contexts/Config';

/**
 *
 * @param children
 * @returns {JSX.Element}
 * @constructor
 */
const Page = ({children}) => (
    <div className="page">
        <Config>
            {children}
        </Config>
    </div>
);

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 18.10.2020
 * Time: 16:17
 */
export default Page;