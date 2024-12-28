const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

process.once('loaded', () => {
    contextBridge.exposeInMainWorld('api', {
        selectFiles: async (type) => await ipcRenderer.invoke('select-files', type),
        createArchive: async (data) => await ipcRenderer.invoke('create-archive', data),
        getBasename: (filepath) => path.basename(filepath),
        check7ZipInstallation: async () => await ipcRenderer.invoke('check-7zip-installation')
    });
});