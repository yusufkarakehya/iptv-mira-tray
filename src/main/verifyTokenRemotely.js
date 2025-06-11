const https = require('https');
const config = require('../config/config');

function verifyTokenRemotely(token) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ token });

        const options = {
            hostname: new URL(config.apiHost).hostname,
            path: config.apiPath,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = https.request(options, (res) => {
            let responseBody = '';

            res.on('data', (chunk) => {
                responseBody += chunk;
            });

            res.on('end', () => {
                try {
                    const json = JSON.parse(responseBody);
                    resolve(json);
                } catch (err) {
                    if (config.devMode) console.error('[JSON Parse Error]', err);
                    reject(err);
                }
            });
        });

        req.on('error', (error) => {
            if (config.devMode) console.error('[Request Error]', error);
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

module.exports = {
    verifyTokenRemotely
};
