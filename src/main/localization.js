const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const config = require('../config/config');

const userDataPath = app.getPath('userData');
const localeConfigPath = path.join(userDataPath, 'locale.json');
const localesDir = path.join(__dirname, '..', '..', 'locales');

let currentLocale = 'en';
let i18n = {};

function getSupportedLocales() {
    return fs.readdirSync(localesDir)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
}

function loadLocale() {
    try {
        if (fs.existsSync(localeConfigPath)) {
            const config = JSON.parse(fs.readFileSync(localeConfigPath, 'utf-8'));
            if (config.locale) currentLocale = config.locale;
        }
    } catch (err) {
        if (config.devMode) console.error('[LocaleConfig] Load Error:', err);
    }

    const supported = getSupportedLocales();
    if (!supported.includes(currentLocale)) currentLocale = 'en';

    try {
        const file = path.join(localesDir, `${currentLocale}.json`);
        i18n = JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch (err) {
        if (config.devMode) console.error('[Locale Load] Error:', err);
        i18n = {};
    }
}

function setLocale(localeCode) {
    currentLocale = localeCode;
    fs.writeFileSync(localeConfigPath, JSON.stringify({ locale: localeCode }));
    loadLocale();
}

function t(key) {
    return i18n[key] || key;
}

function getCurrentLocale() {
    return currentLocale;
}

module.exports = {
    t,
    getCurrentLocale,
    setLocale,
    getSupportedLocales,
    loadLocale
};
