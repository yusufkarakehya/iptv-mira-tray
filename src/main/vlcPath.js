const fs = require('fs');
const path = require('path');
const { app, dialog, shell } = require('electron');
const { execSync } = require('child_process');
const config = require('../config/config');

const vlcPathFile = path.join(app.getPath('userData'), 'vlc-path.txt');

function saveVLCPath(p) {
    fs.writeFileSync(vlcPathFile, p);
}

function loadVLCPath() {
    try {
        const p = fs.readFileSync(vlcPathFile, 'utf-8');
        if (fs.existsSync(p)) return p;
    } catch { }
    return null;
}

function detectVLCPath() {
    try {
        const cmd = process.platform === 'win32' ? 'where vlc' : 'which vlc';
        const detected = execSync(cmd).toString().trim().split('\n')[0];
        if (fs.existsSync(detected)) return detected;
    } catch { }

    const fallbackPaths = {
        win32: [
            'C:/Program Files/VideoLAN/VLC/vlc.exe',
            'C:/Program Files (x86)/VideoLAN/VLC/vlc.exe'
        ],
        darwin: [
            '/Applications/VLC.app/Contents/MacOS/VLC'
        ],
        linux: [
            '/usr/bin/vlc',
            '/snap/bin/vlc'
        ]
    }[process.platform] || [];

    for (const p of fallbackPaths) {
        if (fs.existsSync(p)) return p;
    }

    return null;
}

async function promptForVLCPath(t) {
    const result = await dialog.showMessageBox({
        type: 'error',
        title: t('dialog.missingVLC.title'),
        message: t('dialog.missingVLC.message'),
        buttons: t('dialog.missingVLC.buttons')
    });

    if (result.response === 0) {
        const selectResult = await dialog.showOpenDialog({ properties: ['openFile'] });
        if (!selectResult.canceled && selectResult.filePaths.length > 0) {
            const userPath = selectResult.filePaths[0];
            saveVLCPath(userPath);
            return userPath;
        }
    } else if (result.response === 1) {
        shell.openExternal(config.vlcUrl);
    }

    return null;
}

async function resolveVLCPath(t) {
    return loadVLCPath() || detectVLCPath() || await promptForVLCPath(t);
}

module.exports = {
    saveVLCPath,
    loadVLCPath,
    detectVLCPath,
    promptForVLCPath,
    resolveVLCPath
};
