const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('backend', {
    getRecent: () => ipcRenderer.invoide("getRecent"),
    setRecent: (recent) => ipcRenderer.invoide("setRecent", recent),
    openUrl: (url) => ipcRenderer.invoide("openUrl", url),
    getSettings: () => ipcRenderer.invoide("getSettings"),
    updateSettings: (update) => ipcRenderer.invoide("updateSettings", update),
    chooseFolder: () => ipcRenderer.invoide("chooseFolder"),
    openFolder: (folder) => ipcRenderer.invoide("openFolder", folder),
    getFolder: (spaceId, folderId) => ipcRenderer.invoide("getFolder", spaceId, folderId),
    getHistory: () => ipcRenderer.invoide("getHistory"),
    createFolder: (spaceId, body) => ipcRenderer.invoide("createFolder", spaceId, body),
    updateFolder: (spaceId, folderId, body) => ipcRenderer.invoide("updateFolder", spaceId, folderId, body),
    changeMany: (body) => ipcRenderer.invoide("changeMany", body),
    edit: (spaceId, folderId, change) => ipcRenderer.invoide("edit", spaceId, folderId, change),
    searchFolders: (body) => ipcRenderer.invoide("searchFolders", body),
    searchItems: (body) => ipcRenderer.invoide("searchItems", body),
    pollSearch: () => ipcRenderer.invoide("pollSearch"),
    searchDefinitions: (body) => ipcRenderer.invoide("searchDefinitions", body),
    setTitle: (title) => ipcRenderer.invoide("setTitle", title),
    restartApp: () => ipcRenderer.invoide("restartApp"),
    setClipboard: (type, content) => ipcRenderer.invoide("setClipboard", type, content),
    newWindow: () => ipcRenderer.invoide("newWindow"),
    closeFolder: () => ipcRenderer.invoide("closeFolder"),
    exportProject: () => ipcRenderer.invoide("exportProject"),
    clearProject: (spaceId) => ipcRenderer.invoide("clearProject", spaceId),
    downloadTextFile: (filename, content) => ipcRenderer.invoide("downloadTextFile", filename, content),
    downloadFile: (filename, dataurl) => ipcRenderer.invoide("downloadFile", filename, dataurl)
})