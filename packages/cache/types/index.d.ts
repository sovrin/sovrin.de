import file from './io/file';
import memory from './io/memory';
import { Config, Cache } from "./types";
/**
 *
 * @param config
 */
declare const factory: (config?: Config) => (url: any) => Cache;
/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 10.11.2020
 * Time: 20:09
 */
export { file, memory, };
export default factory;
