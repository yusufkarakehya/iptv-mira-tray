const { app } = require('electron');
const log = require('electron-log');
const { createTray, rebuildTrayMenu, setDependencies } = require('./trayMenu');
const { t, setLocale, getCurrentLocale, loadLocale } = require('./localization');
const {
    initAutoLaunch,
    enableAutoLaunch,
    disableAutoLaunch,
    checkAutoLaunchStatus
} = require('./autoLaunch');
const { resolveVLCPath, saveVLCPath } = require('./vlcPath');
const { startServer, setVLCPath } = require('./server');
const { initAutoUpdater } = require('./updater');
const config = require('../config/config');
require('dotenv').config();

log.transports.file.level = 'debug';

let userVLCPath = null;

async function initializeApp() {
    loadLocale();

    userVLCPath = await resolveVLCPath(t);
    setVLCPath(userVLCPath);

    await initAutoLaunch();

    setDependencies({
        translator: t,
        getCurrentLocale: getCurrentLocale,
        setCurrentLocale: (localeCode) => {
            setLocale(localeCode);
            setTranslator(t);
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

app.whenReady().then(() => {
    initAutoUpdater({ translator: t });
    initializeApp();
});

app.on('window-all-closed', (e) => {
    e.preventDefault();
});
