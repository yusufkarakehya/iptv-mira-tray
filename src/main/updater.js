const { app, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const path = require('path');
const log = require('electron-log');

const stateFilePath = path.join(app.getPath('userData'), 'update-state.json');
const firstRunFlagPath = path.join(app.getPath('userData'), 'first-run.json');

function initAutoUpdater({ translator }) {
    const t = translator || (key => key);

    autoUpdater.on('error', (err) => {
        log.error('AutoUpdate error:', err);
    });

    autoUpdater.on('update-downloaded', () => {
        dialog.showMessageBox({
            type: 'info',
            buttons: [t('updater.restartNow'), t('updater.later')],
            title: t('updater.title'),
            message: t('updater.message')
        }).then(result => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });

    autoUpdater.checkForUpdatesAndNotify();
}

function checkManually() {
    autoUpdater.checkForUpdates();
}

function getCurrentAppVersion() {
    return app.getVersion();
}

function readUpdateState() {
    try {
        if (!fs.existsSync(stateFilePath)) return {};
        const data = fs.readFileSync(stateFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
}

function writeUpdateState(state) {
    try {
        fs.writeFileSync(stateFilePath, JSON.stringify(state), 'utf-8');
    } catch (err) { }
}

function showUpdateSuccessIfNeeded({ translator }) {
    const t = translator || (key => key);

    const currentVersion = getCurrentAppVersion();
    const state = readUpdateState();

    if (fs.existsSync(firstRunFlagPath)) {
        if (state.lastVersion && state.lastVersion !== currentVersion) {
            dialog.showMessageBox({
                type: 'info',
                buttons: [t('updater.success.ok')],
                title: t('updater.success.title'),
                message: t('updater.success.message')
            });
        }
    }

    writeUpdateState({ lastVersion: currentVersion });
}

module.exports = {
    initAutoUpdater,
    checkManually,
    showUpdateSuccessIfNeeded
};
