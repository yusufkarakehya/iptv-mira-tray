const { Tray, Menu, dialog, shell, app } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const config = require('../config/config');

let tray = null;
let trayIconPath = path.join(__dirname, '..', 'assets', 'iconTemplate.png');

let getCurrentLocale = () => 'en';
let setAppLocale = () => { };
let getAutoLaunchStatus = async () => false;
let setAutoLaunchEnabled = async () => { };
let getVLCPath = () => null;
let setVLCPath = () => { };
let translator = key => key;

function setDependencies({
    translator: tFn,
    getCurrentLocale: getLocaleFn,
    setCurrentLocale,
    autoLauncher,
    getVLCPathFn,
    setVLCPathFn,
    trayIcon = null
}) {
    translator = tFn;
    getCurrentLocale = getLocaleFn;
    setAppLocale = setCurrentLocale;
    getAutoLaunchStatus = autoLauncher?.isEnabled ?? (async () => false);
    setAutoLaunchEnabled = async (enabled) => {
        if (enabled) await autoLauncher.enable?.();
        else await autoLauncher.disable?.();
    };
    getVLCPath = getVLCPathFn;
    setVLCPath = setVLCPathFn;
    if (trayIcon) trayIconPath = trayIcon;
}

async function buildTrayMenuAsync() {
    const t = translator;
    const autoLaunchEnabled = await getAutoLaunchStatus();
    const currentLocale = getCurrentLocale();

    const languages = [
        { code: 'en', label: 'English' },
        { code: 'tr-TR', label: 'Türkçe' },
        { code: 'fr-FR', label: 'Français' },
        { code: 'de-DE', label: 'Deutsch' },
        { code: 'es-ES', label: 'Español' },
        { code: 'fa-IR', label: 'فارسی' },
        { code: 'it', label: 'Italiano' },
        { code: 'ja', label: '日本語' },
        { code: 'pt-BR', label: 'Português (BR)' },
        { code: 'pt-PT', label: 'Português (PT)' },
        { code: 'ru-RU', label: 'Русский' },
        { code: 'uk-UA', label: 'Українська' },
        { code: 'vi', label: 'Tiếng Việt' },
        { code: 'zh-CN', label: '简体中文' }
    ];

    return Menu.buildFromTemplate([
        { label: `${t('tray.version')}: v${app.getVersion()}`, enabled: false },
        { type: 'separator' },
        {
            label: t('tray.checkForUpdates'),
            click: () => autoUpdater.checkForUpdates()
        },
        {
            label: t('tray.selectPath'),
            click: async () => {
                const result = await dialog.showOpenDialog({ properties: ['openFile'] });
                if (!result.canceled && result.filePaths.length > 0) {
                    setVLCPath(result.filePaths[0]);
                }
            }
        },
        { type: 'separator' },
        {
            label: t('tray.language'),
            submenu: languages.map(lang => ({
                label: lang.label + (lang.code === currentLocale ? ' ✔' : ''),
                click: () => {
                    setAppLocale(lang.code);
                }
            }))
        },
        {
            label: t('tray.autostart.label'),
            submenu: [
                {
                    label: t('tray.autostart.enable'),
                    type: 'radio',
                    checked: autoLaunchEnabled,
                    click: async () => {
                        await setAutoLaunchEnabled(true);
                        rebuildTrayMenu();
                    }
                },
                {
                    label: t('tray.autostart.disable'),
                    type: 'radio',
                    checked: !autoLaunchEnabled,
                    click: async () => {
                        await setAutoLaunchEnabled(false);
                        rebuildTrayMenu();
                    }
                }
            ]
        },
        { type: 'separator' },
        {
            label: t('tray.about'),
            click: () => shell.openExternal(config.projectUrl)
        },
        {
            label: t('tray.exit'),
            click: () => app.quit()
        }
    ]);
}

async function rebuildTrayMenu() {
    if (!tray) return;
    const menu = await buildTrayMenuAsync();
    tray.setContextMenu(menu);
}

function createTray() {
    if (!fs.existsSync(trayIconPath)) {
        if (config.devMode) console.error('[TrayIcon] Not found:', trayIconPath);
        return;
    }

    tray = new Tray(trayIconPath);
    tray.setToolTip(translator('tray.tooltip'));
    rebuildTrayMenu();
}

module.exports = {
    createTray,
    rebuildTrayMenu,
    setDependencies
};
