const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('backend', {
    getRecent: () => ipcRenderer.invoke("getRecent"),
    setRecent: (recent) => ipcRenderer.invoke("setRecent", recent),
    openUrl: (url) => ipcRenderer.invoke("openUrl", url),
    getSettings: () => ipcRenderer.invoke("getSettings"),
    updateSettings: (update) => ipcRenderer.invoke("updateSettings", update),
    chooseFolder: () => ipcRenderer.invoke("chooseFolder"),
    openFolder: (folder) => ipcRenderer.invoke("openFolder", folder),
    getFolder: (spaceId, folderId) => ipcRenderer.invoke("getFolder", spaceId, folderId),
    getHistory: () => ipcRenderer.invoke("getHistory"),
    createFolder: (spaceId, body) => ipcRenderer.invoke("createFolder", spaceId, body),
    updateFolder: (spaceId, folderId, body) => ipcRenderer.invoke("updateFolder", spaceId, folderId, body),
    changeMany: (body) => ipcRenderer.invoke("changeMany", body),
    edit: (spaceId, folderId, change) => ipcRenderer.invoke("edit", spaceId, folderId, change),
    searchFolders: (body) => ipcRenderer.invoke("searchFolders", body),
    searchItems: (body) => ipcRenderer.invoke("searchItems", body),
    pollSearch: () => ipcRenderer.invoke("pollSearch"),
    searchDefinitions: (body) => ipcRenderer.invoke("searchDefinitions", body),
    setTitle: (title) => ipcRenderer.invoke("setTitle", title),
    restartApp: () => ipcRenderer.invoke("restartApp"),
    setClipboard: (type, content) => ipcRenderer.invoke("setClipboard", type, content),
    newWindow: () => ipcRenderer.invoke("newWindow"),
    closeFolder: () => ipcRenderer.invoke("closeFolder"),
    exportProject: () => ipcRenderer.invoke("exportProject"),
    clearProject: (spaceId) => ipcRenderer.invoke("clearProject", spaceId),
    downloadTextFile: (filename, content) => ipcRenderer.invoke("downloadTextFile", filename, content),
    downloadFile: (filename, dataurl) => ipcRenderer.invoke("downloadFile", filename, dataurl),
    getMyFolder: () => ipcRenderer.invoke("getMyFolder"),
    getAppVersion: () => ipcRenderer.invoke("getAppVersion"),
    setLocalClipboard: (callback) => ipcRenderer.on('setLocalClipboard', callback),
})
