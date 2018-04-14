'use strict';

const USERS = [
    {username: 'docs', password: 'd0cs'},
    {username: 'test', password: 't3st'},
];

const HEADER_REGEX =
    /Basic ((?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?)$/;

const ERROR_RESPONSE = {
    status: '401',
    headers: {
        'www-authenticate': [{
            key: 'WWW-Authenticate',
            value: 'Basic realm="Authentication Required"',
        }],
    },
};

const extractAuthHeader = (headers) => {
    const matchingHeaders = headers['authorization'];

    if (matchingHeaders && matchingHeaders.length === 1) {
        const match = HEADER_REGEX.exec(matchingHeaders[0].value);

        if (match) {
            return match[1];
        }
    }

    return null;
};

const extractUserPassFromHeader = (header) => {
    try {
        const userParts =
            Buffer.from(header, 'base64')
                .toString('utf-8')
                .split(':');

        if (userParts.length === 2) {
            return {
                username: userParts[0],
                password: userParts[1],
            };
        }
    } catch (_err) {
        // Ignore errors parsing out user information
    }

    return null;
};

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    const authHeader = extractAuthHeader(headers);

    if (authHeader) {
        const loginCreds = extractUserPassFromHeader(authHeader);

        if (loginCreds) {
            for (let i = 0; i < USERS.length; i++) {
                if (
                    USERS[i].username === loginCreds.username &&
                    USERS[i].password === loginCreds.password
                ) {
                    callback(null, request);
                    return;
                }
            }
        }
    }

    callback(null, ERROR_RESPONSE);
};

exports.ERROR_RESPONSE = ERROR_RESPONSE;
