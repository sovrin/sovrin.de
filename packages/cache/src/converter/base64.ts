/**
 *
 * @param input
 */
const factory = (input: string) => {
    const buffer = Buffer.from(input, 'base64');
    const string = buffer.toString('ascii');

    return JSON.parse(string);
}

/**
 * User: Oleg Kamlowski <oleg.kamlowski@thomann.de>
 * Date: 09.12.2020
 * Time: 20:14
 */
export default factory;