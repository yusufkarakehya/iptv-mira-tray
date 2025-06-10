const { app, Tray, Menu, dialog, shell, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const AutoLaunch = require('auto-launch');

let tray = null;
let userVLCPath = null;
const userDataPath = app.getPath('userData');
const localeConfigPath = path.join(userDataPath, 'locale.json');
const firstRunFlagPath = path.join(userDataPath, 'first-run.json');
const eulaAcceptedPath = path.join(userDataPath, 'eula.accepted');

function showEULAWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 800,
        modal: true,
        show: false,
        resizable: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true
        }
    });

    win.setMenuBarVisibility(false);
    win.loadFile('eula.html');
    win.once('ready-to-show', () => win.show());

    ipcMain.handleOnce('eula-accepted', () => {
        fs.writeFileSync(eulaAcceptedPath, 'yes');
        win.close();
        initializeApp();
    });

    win.on('closed', () => {
        if (!fs.existsSync(eulaAcceptedPath)) {
            app.quit();
        }
    });
}

let currentLocale = 'en';
try {
    const localeConfig = JSON.parse(fs.readFileSync(localeConfigPath));
    currentLocale = localeConfig.locale || 'en';
} catch { }

const miraAutoLauncher = new AutoLaunch({
    name: 'Mira IPTV Player Bridge',
    path: process.execPath,
    isHidden: true
});

let autoLaunchEnabled = false;

if (!fs.existsSync(firstRunFlagPath)) {
    miraAutoLauncher.enable()
        .then(() => {
            autoLaunchEnabled = true;
            fs.writeFileSync(firstRunFlagPath, JSON.stringify({ firstRunCompleted: true }));
        })
        .catch(err => {
            console.error('[AutoLaunch] First Run Error:', err);
        });
} else {
    miraAutoLauncher.isEnabled()
        .then((isEnabled) => {
            autoLaunchEnabled = isEnabled;
        })
        .catch(err => {
            console.error('[AutoLaunch] Status Check Error:', err);
        });
}

const supportedLocales = fs.readdirSync(path.join(__dirname, 'locales')).map(f => f.replace('.json', ''));
if (!supportedLocales.includes(currentLocale)) currentLocale = 'en';
const i18n = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales', `${currentLocale}.json`), 'utf-8'));
function t(key) {
    return i18n[key] || key;
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

function startServer() {
    const server = express();
    const port = 54321;

    const allowedOrigins = ['https://mira.karakehya.com'];

    function isAllowedOrigin(req) {
        const origin = req.get('origin') || req.get('referer') || '';
        return allowedOrigins.some(allowed => origin.startsWith(allowed));
    }

    server.get('/status', (req, res) => {
        // if (!isAllowedOrigin(req)) return res.status(403).send('Forbidden');
        res.send(t('server.status'));
    });

    server.get('/play', (req, res) => {
        // if (!isAllowedOrigin(req)) return res.status(403).send('Forbidden');

        const videoUrl = req.query.url;
        if (!videoUrl) return res.status(400).send(t('server.missingURL'));

        const vlcPath = userVLCPath || detectVLCPath();
        if (!vlcPath) {
            dialog.showMessageBox({
                type: 'error',
                title: t('dialog.missingVLC.title'),
                message: t('dialog.missingVLC.message'),
                buttons: t('dialog.missingVLC.buttons')
            }).then(result => {
                if (result.response === 0) {
                    dialog.showOpenDialog({ properties: ['openFile'] }).then(selectResult => {
                        if (!selectResult.canceled && selectResult.filePaths.length > 0) {
                            userVLCPath = selectResult.filePaths[0];
                        }
                    });
                } else if (result.response === 1) {
                    shell.openExternal('https://www.videolan.org/vlc/');
                }
            });
            return res.status(500).send(t('server.vlcNotFound'));
        }

        const vlc = spawn(vlcPath, [videoUrl], {
            detached: true,
            stdio: 'ignore'
        });

        vlc.unref();
        return res.send(t('server.launched'));
    });

    server.listen(port, () => {
        console.log(`Local Mira server listening at http://localhost:${port}`);
    });
}

function initializeApp() {
    tray = new Tray(path.join(__dirname, 'icon.png'));

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

    const contextMenu = Menu.buildFromTemplate([
        {
            label: t('tray.selectPath'),
            click: async () => {
                const result = await dialog.showOpenDialog({ properties: ['openFile'] });
                if (!result.canceled && result.filePaths.length > 0) {
                    userVLCPath = result.filePaths[0];
                }
            }
        },
        {
            label: t('tray.language'),
            submenu: languages.map(lang => ({
                label: lang.label + (lang.code === currentLocale ? ' ✔' : ''),
                click: () => {
                    fs.writeFileSync(localeConfigPath, JSON.stringify({ locale: lang.code }));
                    app.relaunch();
                    app.exit();
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
                    click: () => {
                        miraAutoLauncher.enable().then(() => {
                            autoLaunchEnabled = true;
                        }).catch(err => {
                            console.error('[AutoLaunch Enable] Error:', err);
                        });
                    }
                },
                {
                    label: t('tray.autostart.disable'),
                    type: 'radio',
                    checked: !autoLaunchEnabled,
                    click: () => {
                        miraAutoLauncher.disable().then(() => {
                            autoLaunchEnabled = false;
                        }).catch(err => {
                            console.error('[AutoLaunch Disable] Error:', err);
                        });
                    }
                }
            ]
        },
        { type: 'separator' },
        { label: t('tray.exit'), click: () => app.quit() }
    ]);

    tray.setToolTip(t('tray.tooltip'));
    tray.setContextMenu(contextMenu);

    startServer();
}

app.whenReady().then(() => {
    if (!fs.existsSync(eulaAcceptedPath)) {
        showEULAWindow();
    } else {
        initializeApp();
    }
});

app.on('window-all-closed', (e) => {
    e.preventDefault();
});