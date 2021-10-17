module.exports = {
    async rewrites () {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:3100/:path*',
            },
        ];
    },
    publicRuntimeConfig: {
        content: {
            host: process.env.CONTENT_HOST,
            key: process.env.CONTENT_KEY,
        },
    }
};