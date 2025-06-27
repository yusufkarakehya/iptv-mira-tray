const { app } = require('electron');
const log = require('electron-log');
const { createTray, rebuildTrayMenu, setDependencies } = require('./trayMenu');
const { setLocale, getCurrentLocale, loadLocale } = require('./localization');
const {
    initAutoLaunch,
    enableAutoLaunch,
    disableAutoLaunch,
    checkAutoLaunchStatus
} = require('./autoLaunch');
const { resolveVLCPath, saveVLCPath } = require('./vlcPath');
const { startServer, setVLCPath } = require('./server');
const { initAutoUpdater, showUpdateSuccessIfNeeded } = require('./updater');
const config = require('../config/config');
require('dotenv').config();

log.transports.file.level = 'debug';

let userVLCPath = null;

async function initializeApp() {
    loadLocale();

    userVLCPath = await resolveVLCPath();
    setVLCPath(userVLCPath);

    await initAutoLaunch();

    setDependencies({
        getCurrentLocale: getCurrentLocale,
        setCurrentLocale: (localeCode) => {
            setLocale(localeCode);
            rebuildTrayMenu();
        },
        autoLauncher: {
            enable: enableAutoLaunch,
            disable: disableAutoLaunch,
            isEnabled: checkAutoLaunchStatus
        },
        getVLCPathFn: () => userVLCPath,
        setVLCPathFn: (p) => {
            userVLCPath = p;
            saveVLCPath(p);
            setVLCPath(p);
            rebuildTrayMenu();
        }
    });

    createTray();
    startServer(config.serverPort);
}

if (process.platform === 'win32') {
    app.setName('Mira IPTV Player Bridge');
    app.setAppUserModelId('Mira IPTV Player Bridge');
}

app.whenReady().then(() => {
    showUpdateSuccessIfNeeded();

    if (process.platform === 'darwin') {
        app.dock.hide();
    }

    initAutoUpdater();
    initializeApp();
});

app.on('window-all-closed', (e) => {
    e.preventDefault();
});
