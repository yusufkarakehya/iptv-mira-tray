const electron = require("electron");

electron.contextBridge.exposeInMainWorld('eulaAPI', {
    accept: () => electron.ipcRenderer.invoke('eula-accepted')
});

async function getConfig() {
let config = null;
  const ipcRenderer = electron.ipcRenderer || false;
  if (ipcRenderer) {
    ipcRenderer.on("envReply", (event, arg) => {
      config = arg.parsed;
      return config.parsed;
    });
    ipcRenderer.send("invokeEnv");
  }
}

getConfig();