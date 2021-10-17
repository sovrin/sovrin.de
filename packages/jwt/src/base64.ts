/**
 *
 * @param string
 */
export const decode = (string: string): string => (
    Buffer.from(unescape(string), 'base64').toString()
);

/**
 *
 * @param string
 */
export const unescape = (string: string): string => {
    string += new Array(5 - string.length % 4).join('=');

    return string.replace(/-/g, '+').replace(/_/g, '/');
}

/**
 *
 * @param string
 */
export const encode = (string: string): string => (
    escape(Buffer.from(string).toString('base64'))
);

/**
 *
 * @param string
 */
export const escape = (string: string): string => (
    string.replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
)