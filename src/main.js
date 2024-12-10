const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron')
const path = require('path')
const fs = require('fs').promises;
const config = {
    exe: "drakontech"
}

var logg = undefined

var globals = {
    recent: [],
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

async function ensureFolderExists(folderpath) {
    var stats = await fs.stat(folderpath)
    if (!stats.isDirectory()) {
        throw new Error(folderpath + " is not a directory")
    }
}

function buildShadowName(folderpath) {
    var shadow = "." + config.exe
    return path.join(folderpath, shadow)
}

async function createShadowFolder(folderpath) {
    var shadowPath = buildShadowName(folderpath)
    var stats = undefined
    try {
        stats = await fs.stat(shadowPath)
    } catch (ex) {

    }
    if (stats) {
        if (stats.isDirectory()) {
            return
        } else {
            await fs.rm(shadowPath)
        }
    }
    fs.mkdir(shadowPath)
}

async function writeAccessFile(folderpath) {
    var shadowFolder = buildShadowName(folderpath)
    var accessFilePath = path.join(shadowFolder, "opened.txt")
    var now = (new Date()).toISOString()
    await fs.writeFile(accessFilePath, now, "utf8")
}
  
async function openFolderObject(winInfo) {
    try {
        await ensureFolderExists(winInfo.path)
    } catch (ex) {
        return false
    }

    var access
    try {
        await createShadowFolder(winInfo.path)
        await writeAccessFile(winInfo.path)
        access = "write"
    } catch (ex) {
        access = "read"        
    }

    winInfo.access = access
    return true
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
    win.setMenu(null)

    var id = win.webContents.id.toString()
    var winInfo = {
        id: id,
        path: folderpath
    }
    globals.windows[id] = winInfo
    winInfo.window = win

    if (folderpath) {
        var opened = await openFolderObject(winInfo)
        if (opened) {
            await addToRecent(winInfo.path)
        } else {
            winInfo.path = undefined
        }
    }

    win.webContents.on('context-menu', (evt, props) => handleContextMenu(winInfo, evt, props))

    win.loadFile('index.html')
    
    if (process.argv.indexOf("--dev") !== -1) {
        win.webContents.openDevTools()
    }

    win.on("closed", () => {
        onClose(winInfo)
    })
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