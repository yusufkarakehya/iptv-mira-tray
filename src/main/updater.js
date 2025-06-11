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
            buttons: [t('updater.restartNow') || 'Restart Now', t('updater.later') || 'Later'],
            title: t('updater.title') || 'Update Ready',
            message: t('updater.message') || 'A new version has been downloaded. Restart to apply the update?'
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
