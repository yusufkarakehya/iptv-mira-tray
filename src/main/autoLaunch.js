const AutoLaunch = require('auto-launch');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const config = require('../config/config');

const firstRunFlagPath = path.join(app.getPath('userData'), 'first-run.json');

const miraAutoLauncher = new AutoLaunch({
    name: config.appName,
    path: process.execPath,
    isHidden: true
});

async function initAutoLaunch() {
    if (!fs.existsSync(firstRunFlagPath)) {
        try {
            await miraAutoLauncher.enable();
            fs.writeFileSync(firstRunFlagPath, JSON.stringify({ firstRunCompleted: true }));
            return true;
        } catch (err) {
            if (config.devMode) console.error('[AutoLauncherEnable] Error:', err);
            return false;
        }
    } else {
        try {
            const isEnabled = await miraAutoLauncher.isEnabled();
            return isEnabled;
        } catch (err) {
            if (config.devMode) console.error('[AutoLauncherIsEnabled] Error:', err);
            return false;
        }
    }
}

function enableAutoLaunch() {
    return miraAutoLauncher.enable();
}

function disableAutoLaunch() {
    return miraAutoLauncher.disable();
}

function checkAutoLaunchStatus() {
    return miraAutoLauncher.isEnabled();
}

module.exports = {
    initAutoLaunch,
    enableAutoLaunch,
    disableAutoLaunch,
    checkAutoLaunchStatus
};
