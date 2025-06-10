const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('eulaAPI', {
    accept: () => ipcRenderer.invoke('eula-accepted')
});
