const { dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

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

module.exports = {
    initAutoUpdater,
    checkManually
};
