import {useContext} from 'react';
import {Context as Config} from '~/contexts/Config';
import {Config as Type} from '~/types/contexts'

/**
 *
 * @returns {boolean}
 */
const useConfig = () => {
    return useContext(Config) as Type;
};

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 09.11.2020
 * Time: 23:24
 */
export default useConfig;