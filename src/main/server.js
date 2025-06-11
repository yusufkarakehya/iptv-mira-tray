const express = require('express');
const { dialog } = require('electron');
const { spawn } = require('child_process');
const { verifyTokenRemotely } = require('./verifyTokenRemotely');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const config = require('../config/config');

let userVLCPath = null;

const allowedOrigins = config.allowedOrigins || [];

function isAllowedOrigin(req) {
    const origin = req.get('origin') || req.get('referer') || '';
    return allowedOrigins.some(allowed => origin.startsWith(allowed));
}

function setVLCPath(p) {
    userVLCPath = p;
}

function getVLCPath() {
    return userVLCPath;
}

function startServer(port = 64722) {
    const server = express();
    server.use(express.json());

    server.use((req, res, next) => {
        const origin = req.headers.origin;
        if (allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Access-Control-Allow-Headers', 'X-MIRA-TOKEN');
        
        if (req.method === 'OPTIONS') {
            return res.sendStatus(200);
        }

        next();
    });

    server.get('/status', (req, res) => {
        if (!isAllowedOrigin(req)) return res.json({ success: false, message: 'Forbidden' });

        return res.json({ success: true, message: 'Mira Bridge is running' });
    });

    server.post('/play', async (req, res) => {
        if (!isAllowedOrigin(req)) return res.json({ success: false, message: 'Forbidden' });

        const {
            url: videoUrl = '',
            name: videoName = '',
            logo: videoLogo = '',
            group: videoGroup = ''
        } = req.body || {};

        if (!videoUrl) return res.json({ success: false, message: 'Missing URL' });
        if (!videoName) return res.json({ success: false, message: 'Missing Name' });

        const token = req.headers['x-mira-token'];
        const verifyResponse = await verifyTokenRemotely(token);

        if (!verifyResponse || !verifyResponse.success) {
            return res.json({ success: false, message: verifyResponse.error || 'Token verification failed' });
        }

        const vlcPath = userVLCPath;
        if (!vlcPath) return res.json({ success: false, message: 'VLC not found' });

        const m3uContent = `#EXTM3U
#EXTINF:-1 tvg-logo="${videoLogo}" group-title="${videoGroup}",${videoName}
${videoUrl}`;

        const tempDir = os.tmpdir();

        fs.readdirSync(tempDir)
            .filter(f => f.startsWith('mira-') && f.endsWith('.m3u'))
            .forEach(f => {
                try {
                    fs.unlinkSync(path.join(tempDir, f));
                } catch { }
            });

        const fileName = `mira-${crypto.randomBytes(4).toString('hex')}.m3u`;
        const m3uPath = path.join(tempDir, fileName);

        try {
            fs.writeFileSync(m3uPath, m3uContent);

            if (process.platform === 'darwin' && vlcPath.includes('.app')) {
                spawn('open', ['-a', 'VLC', m3uPath], {
                    detached: true,
                    stdio: 'ignore'
                }).unref();
            } else {
                spawn(vlcPath, [m3uPath], {
                    detached: true,
                    stdio: 'ignore'
                }).unref();
            }

            return res.json({ success: true, message: 'Launched in VLC' });
        } catch (err) {
            if (config.devMode) console.error('[VLC Launch Error]:', err);
            return res.json({ success: false, message: 'Failed to launch player' });
        }
    });

    server.listen(port, () => {
        if (config.devMode) console.log(`Mira Server running at http://localhost:${port}`);
    }).on('error', (err) => {
        if (config.devMode) console.error('[Server] Error:', err);
        dialog.showErrorBox('Server Error', `Port ${port} is busy or inaccessible.`);
    });
}

module.exports = {
    startServer,
    setVLCPath,
    getVLCPath
};
