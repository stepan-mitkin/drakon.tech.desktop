const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron')
const { setLanguage, translate } = require("./static/js/strings")
const path = require('path');
const fs = require('fs').promises;
const config = require("./config")

const {
    createFolder,
    getFolder,
    updateFolder,
    getHistory,
    openFolderCore,
    changeManyCore,
    getFilePathById
} = require("./filetree")

var logg = undefined

var globals = {
    windows: {},
    defaultImagePath: app.getPath("pictures")
}

async function log(text) {
    console.log(text)
    if (logg) {
        await logg.writeFile(text || "")
        await logg.writeFile("\n")
    }
}

function getSettingsPath() {
    var folder = app.getPath("home")
    var filename = path.join(folder, config.exe + ".settings.json")
    return filename
}

function getRecentPath() {
    var folder = app.getPath("home")
    var filename = path.join(folder, config.exe + ".recent.json")
    return filename
}

async function setRecent(winInfo, recent) {
    var filename = getRecentPath()
    var obj = {
        recent: recent
    }
    await writeJson(filename, obj)
}

async function getRecent() {
    var filename = getRecentPath()
    var obj = await readJson(filename)
    var result = obj.recent || []
    return result
}

async function openUrl(winInfo, url) {
    shell.openExternal(url)
}

async function getSettings() {
    var filename = getSettingsPath()
    var obj = await readJson(filename)
    if (!obj.language) {
        obj.language = "en"
    }
    setLanguage(obj.language)
    return obj
}

async function updateSettings(winInfo, update) {
    var settings = await getSettings()
    Object.assign(settings, update)
    var filename = getSettingsPath()
    await writeJson(filename, settings)
    if (update.language) {
        setLanguage(update.language)
    }
}

async function chooseFolder(winInfo) {
    var dialogResult = await dialog.showOpenDialog(
        winInfo.window,
        {
            properties: ['openDirectory']
        }
    )

    if (dialogResult.canceled) {
        return undefined
    }

    return dialogResult.filePaths[0]    
}

async function getMyFolder(winInfo) {
    return winInfo.myFolder
}


async function loadHistory(winInfo) {

}


async function readJson(filename) {
    try {
        var content = await readUtf8File(filename)
        return JSON.parse(content || "{}")
    } catch (ex) {
        console.log("readJson", ex.message)
        return {}
    }
}

async function writeJson(filename, obj) {
    var content = JSON.stringify(obj, null, 4)
    await writeUtf8File(filename, content)
}

async function writeUtf8File(filename, content) {
    return await fs.writeFile(filename, content, "utf8")
}

async function readUtf8File(filename) {
    return await fs.readFile(filename, "utf8")
}

async function searchFolders() {
    
}

async function pollSearch() {
    
}

async function searchItems() {
    
}

async function searchDefinitions() {
    return {"items":[]}
}

async function setTitle(winInfo, title) {
    winInfo.window.setTitle(title)
}

async function setClipboard(winInfo, type, content) {
    globals.clipboard = {
        type,
        content
    }
    invokeClipboardUpdated()
}

function invokeClipboardUpdated() {
    for (var winId in globals.windows) {
        var winInfo = globals.windows[winId]
        winInfo.window.webContents.send("setLocalClipboard", globals.clipboard.type, globals.clipboard.content)
    }
}

async function openFolder(winInfo, folderPath) {
    var win = findWindowByPathExact(folderPath)
    if (win) {
        raiseWindow(win)
        return undefined
    } else {
        return await openFolderCore(winInfo, folderPath)
    }
}

async function changeMany(winInfo, body) {
    body.items.forEach(enrichManyItem)
    return await changeManyCore(winInfo, body)
}

function enrichManyItem(item) {
    var winInfo = findWindowBySpaceId(item.space_id)
    item.filepath = getFilePathById(winInfo, item.id)
}

async function newWindow() {
    createWindow(undefined)
}

async function restartApp(winInfo) {
    delete globals.windows[winInfo.id]
    createWindow(undefined)    
    winInfo.window.close()
}

async function closeFolder(winInfo) {
    winInfo.myFolder = undefined
    winInfo.path = undefined
    setTitle(winInfo, config.app)    
}

async function exportProject() {
    
}

async function clearProject() {
    
}

async function downloadTextFile() {
    
}

async function downloadFile() {
    
}


function registerMainCallbacks() {
    registerHandler(getRecent)
    registerHandler(setRecent)
    registerHandler(openUrl)
    registerHandler(getSettings)
    registerHandler(updateSettings)
    registerHandler(chooseFolder)
    registerHandler(getMyFolder)    
    registerHandler(openFolder)
    registerHandler(getFolder)
    registerHandler(getHistory)
    registerHandler(createFolder)
    registerHandler(updateFolder)
    registerHandler(changeMany)

    registerHandler(searchFolders)
    registerHandler(searchItems)
    registerHandler(pollSearch)
    registerHandler(searchDefinitions)
    registerHandler(setTitle)
    registerHandler(restartApp)
    registerHandler(setClipboard)
    registerHandler(newWindow)
    registerHandler(closeFolder)
    registerHandler(exportProject)
    registerHandler(clearProject)
    registerHandler(downloadTextFile)
    registerHandler(downloadFile)
}

function registerHandler(fun) {
    ipcMain.handle(fun.name, function(evt, ...args) {
        return wrapper(evt, fun, ...args)
    })
}

function getWindowFromEvent(evt) {
    var senderId = evt.sender.id
    for (var winId in globals.windows) {
        var winInfo = globals.windows[winId]
        var windowId = winInfo.window.webContents.id
        if (windowId === senderId) {
            return winInfo
        }
    }

    throw new Error("Window not found: " + senderId)
}

function wrapper(evt, fun, ...args) {    
    var winInfo = getWindowFromEvent(evt)
    return fun(winInfo, ...args)
}

function handleSquirrelEvent() {
    if (process.argv.length === 1) {
      return false;
    }
  
    const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
      case '--squirrel-install':
      case '--squirrel-updated':
        return true;  
      case '--squirrel-uninstall':
        return true;  
      case '--squirrel-obsolete':
        return true;
    }

    return false
}

function handleContextMenu(winInfo, event, props) {
    var window = winInfo.window
    var target = window.webContents
    var template = []
    if (props.editFlags.canCut && props.selectionText) {
        template.push({
            label: translate("MES_CUT"),
            click: () => { target.cut() }
        })
    }
    if (props.editFlags.canCopy && props.selectionText) {
        template.push({
            label: translate("MES_COPY"),
            click: () => { target.copy() }
        })
    }
    if (props.editFlags.canPaste) {
        template.push({
            label: translate("MES_PASTE"),
            click: () => { target.paste() }
        })
    }

    if (template.length !== 0) {
        const menu = Menu.buildFromTemplate(template)        
	    menu.popup(window)
    }
}

function findWindowByPathExact(path) {
    for (var winId in globals.windows) {
        var winInfo = globals.windows[winId]
        if (winInfo.path && winInfo.path === path) {
            return winInfo
        }
    }

    return undefined
}

function findWindowBySpaceId(spaceId) {
    for (var winId in globals.windows) {
        var winInfo = globals.windows[winId]
        if (winInfo.spaceId === spaceId) {
            return winInfo
        }
    }

    return undefined  
}

function raiseFirstWindow() {
    var ids = Object.keys(globals.windows)
    if (ids.length === 0) {
        return
    }
    var winInfo = globals.windows[ids[0]]
    raiseWindow(winInfo)
}

function raiseWindow(winInfo) {
    var myWindow = winInfo.window    

    if (myWindow.isMinimized()) {
        myWindow.restore()
    }
    myWindow.show()
}

function onSecondInstance(evt, argv) {
    var foldername = getFilenameFromCommandLine(argv)
    if (foldername) {
        foldername = path.resolve(foldername)
        log("onSecondInstance: got foldername: " + foldername)
        var found = findWindowByPathExact(foldername)
        if (found) {
            log("onSecondInstance: found instance: " + found.id)
            raiseWindow(found)            
        } else {
            log("onSecondInstance: did not find instance")
            createWindow(foldername)
        }
    } else {
            log("onSecondInstance: no foldername, raising first window")
            raiseFirstWindow()
    }    
}

async function onClose(winInfo) {
    delete globals.windows[winInfo.id]
}


const createWindow = async (folderpath) => {
    if (folderpath) {
        folderpath = path.resolve(folderpath)
    }
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'static/js/preload.js')
        }
    })
    //win.setMenu(null)
    win.webContents.openDevTools()

    var id = win.webContents.id.toString()
    var winInfo = {
        id: id
    }
    globals.windows[id] = winInfo
    winInfo.window = win
    winInfo.myFolder = folderpath

    win.webContents.on('context-menu', (evt, props) => handleContextMenu(winInfo, evt, props))

    win.loadFile('index.html')
    
    if (process.argv.indexOf("--dev") !== -1) {
        win.webContents.openDevTools()
    }

    win.on("closed", () => {
        onClose(winInfo)
    })
}

function getFilenameFromCommandLine(argv) {
    for (var i = argv.length - 1; i > 1; i--) {
        var part = argv[i]
        if (part && part.substring(0, 2) !== "--") {
            var result = path.normalize(part)
            log("getFilenameFromCommandLine: " + result)
            return result
        }
    }

    log("getFilenameFromCommandLine: undefined")
    return undefined
}

function createWindowIfNoWindows() {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow(undefined)
    } else {
        raiseFirstWindow()
    }
}

function quitApp() {
    if (process.platform !== 'darwin') {
        app.quit()
    }
}

async function main() {
    if (handleSquirrelEvent()) {
        app.quit()
        return;
    }

    const gotTheLock = app.requestSingleInstanceLock()
    if (!gotTheLock) {
        app.quit()
        return
    }

    //logg = await fs.open(path.join(app.getPath("home"), "log.txt"), "a")

    await log("main: started")

    app.on('second-instance', onSecondInstance)
    app.on('window-all-closed', quitApp)
    app.on('activate', createWindowIfNoWindows)
    await app.whenReady()
    registerMainCallbacks()
    var filename = getFilenameFromCommandLine(process.argv)
    createWindow(filename)
}


main()