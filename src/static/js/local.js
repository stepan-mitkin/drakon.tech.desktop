(function() {
    var gFolder = ""
    var gSpaceId = ""
    var gFolderName = ""

    function objFor(obj, callback, target) {
        for (var key in obj) {
            var value = obj[key]
            callback(key, value, target)
        }
    }
    
    
    function forEach(array, callback, target) {
        var length = array.length
        for (var i = 0; i < length; i++) {
            var value = array[i]
            callback(value, target, i)
        }
    }

    async function getRecent() {
        var recentStr = localStorage.getItem("recent") || "[]"
        return JSON.parse(recentStr)
    }

    async function setRecent(recent) {
        var recentStr = JSON.stringify(recent)
        localStorage.setItem("recent", recentStr)
    }

    function getSettingsCore() {
        var settingStr = localStorage.getItem("settings") || "{}"
        return JSON.parse(settingStr)
    }
    async function getSettings() {        
        var settings = getSettingsCore()
        if (!settings.language) {
            settings.language = "en"
        }
        return settings
    }

    async function updateSettings(key, value) {
        var settings = getSettingsCore()
        settings[key] = value
        var settingsStr = JSON.stringify(settings)
        localStorage.setItem("settings", settingsStr)
    }

    async function chooseFolder() {
        return prompt("Enter full folder path")
    }

    function openUrl(url) {
        window.open(url, '_blank').focus();
    }

    function getProjects() {
        var projectsStr = localStorage.getItem("projects") || "{}"
        return JSON.parse(projectsStr)
    }

    function setProjects(projects) {
        var projectsStr = JSON.stringify(projects)
        localStorage.setItem("projects", projectsStr)
    }

    function getRootFolderId(spaceId) {
        return spaceId + " " + 1
    }

    function randomNumber(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }    

    function generateId(used, prefix) {
        var id = prefix + randomNumber(1000, 9999)
        while (id in used) {
            id = prefix + randomNumber(1000, 9999)
        }
        return id
    }

    function getAllFolders(spaceId) {
        var allFoldersKey = spaceId + "-folders"
        var all = JSON.parse(localStorage.getItem(allFoldersKey) || "{}")
        return all
    }

    function setAllFolders(spaceId, allFolders) {
        var allFoldersKey = spaceId + "-folders"
        localStorage.setItem(allFoldersKey, JSON.stringify(allFolders))
    }

    function createFolderWithId(spaceId, folderId, body) {
        var id = buildId(spaceId, folderId)                
        var all = getAllFolders(spaceId)
        all[id] = true
        setAllFolders(spaceId, all)
        setFolderBody(id, body)        
    }

    function replace(str, from, to) {
        return str.split(from).join(to)
    }

    function getLastStage(path) {
        var normalized = replace(path, "\\", "/")
        var parts = normalized
            .split("/")
            .filter(part => {return part.trim() !== ""})
        return parts[parts.length - 1]
    }    

    async function openFolder(folder) {
        var projects = getProjects()
        var spaceId = projects[folder]
        if (!spaceId) {
            spaceId = generateId(projects, "proj")
            projects[folder] = spaceId
            var body = {type:"folder"}        
            createFolderWithId(spaceId, "1", body)
            setProjects(projects)
        }
        gFolder = folder
        gSpaceId = spaceId
        gFolderName = getLastStage(folder)        
        return spaceId
    }

    function buildId(spaceId, folderId) {
        return spaceId + " " + folderId
    }

    function fixFolderName(folder) {
        if (folder.id === "1") {
            folder.name = gFolderName
        }
    }

    async function pause(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    async function getHistory() {
        console.log("getHistory")
        await pause(10)
        return {
            recent: []
        }
    }

    async function createFolder(spaceId, body) {
        console.log("createFolder", spaceId, body)
        await pause(10)
        body.parent = buildId(spaceId, body.parent)        
        var folderId = createFolderCore(spaceId, body)
        return {folder_id: folderId}
    }

    function createFolderCore(spaceId, body) {
        var all = getAllFolders(spaceId)        
        var folderId = generateId(all, "f")
        createFolderWithId(spaceId, folderId, body)
        return folderId
    }    

    async function updateFolder(spaceId, folderId, body) {
        console.log("updateFolder", spaceId, folderId, body)
        await pause(10)
        var id = buildId(spaceId, folderId)
        var folder = getFolderBody(id)
        Object.assign(folder, body)
        setFolderBody(id, folder)
    }

    async function getFolder(spaceId, folderId) {
        console.log("getFolder", spaceId, folderId)
        await pause(10)
        var folder = getFolderWithChildren(spaceId, folderId)
        folder.path = buildFolderPath(folder.fullId)
        if (folder.parent) {
            var pp = parseId(folder.parent)
            folder.parent = pp.folderId
        }
        folder.access = "write"
        return folder
    }

    function getFolderWithChildren(spaceId, folderId) {
        var id = buildId(spaceId, folderId)
        var all = getAllFolders(spaceId)
        var folder = getFolderBody(id)
        folder.children = []
        folder.fullId = id
        objFor(all, findChildren, folder)
        folder.id = folderId
        folder.space_id = spaceId
        fixFolderName(folder)        
        return folder
    }

    function deleteOneFolder(item) {
        var id = buildId(item.space_id, item.id)
        var all = getAllFolders(item.space_id)
        delete all[id]
        setAllFolders(item.space_id, all)
        localStorage.removeItem(id)
    }

    async function changeMany(body) {
        console.log("changeMany", body)
        await pause(10)        
        if (body.operation === "delete") {
            body.items.forEach(deleteOneFolder)
        } else if (body.operation === "copy") {
            forEach(body.items, copyOneFolder, body.target)
        }

        return "ok"
    }

    function copyOneFolder(item, target) {
        var id = buildId(item.space_id, item.id)
        var folder = getFolderBody(id)
        var targetId = buildId(target.space_id, target.folder_id)
        var targetFolder = getFolderWithChildren(target.space_id, target.folder_id)
        var name = folder.name
        while (!isUnique(targetFolder.children, name)) {
            name += "-x2"
        }        
        copyFolderRecursive(id, name, targetId)
    }

    function isUnique(folders, name) {
        name = name.toLowerCase()
        for (var folder of folders) {
            var fname = folder.name.toLowerCase()
            if (name === fname) {
                return false
            }
        }
        return true
    }

    function copyFolderRecursive(id, name, targetId) {
        var parsed = parseId(id)
        var tparsed = parseId(targetId)
        var folder = getFolderBody(id)
        if (name) {
            folder.name = name
        }
        folder.parent = targetId
        var newFolderId = createFolderCore(tparsed.spaceId, folder)
        var newId = buildId(tparsed.spaceId, newFolderId)
        var existing = getFolderWithChildren(parsed.spaceId, parsed.folderId)
        for (var child of existing.children) {
            var childId = buildId(child.space_id, child.id)
            copyFolderRecursive(childId, undefined, newId)
        }
    }




    function parseId(id) {
        var parts = id.split(" ")
        return {
            spaceId: parts[0],
            folderId: parts[1]
        }
    }

    function buildFolderPath(id) {
        var path = []
        while (id) {
            var parsed = parseId(id)
            var folder = getFolderBody(id)
            var step = {
                id: parsed.folderId,
                space_id: parsed.spaceId,
                name: folder.name
            }
            fixFolderName(step)
            path.push(step)
            id = folder.parent
        }
        path.reverse()
        return path
    }

    function getFolderBody(id) {
        return JSON.parse(localStorage.getItem(id))        
    }

    function setFolderBody(id, body) {
        localStorage.setItem(id, JSON.stringify(body))        
    }

    function findChildren(id, _, output) {
        var folder = getFolderBody(id)
        var parsed = parseId(id)
        if (folder.parent === output.fullId) {
            var stage = {
                id: parsed.folderId,
                space_id: parsed.spaceId,
                name: folder.name,
                type: folder.type
            }
            fixFolderName(stage)
            output.children.push(stage)
        }
    }

    window.backend = {
        getRecent: getRecent,
        setRecent: setRecent,
        openUrl: openUrl,
        getSettings: getSettings,
        updateSettings: updateSettings,
        chooseFolder: chooseFolder,
        openFolder: openFolder,
        getFolder: getFolder,
        getHistory: getHistory,
        createFolder: createFolder,
        updateFolder: updateFolder,
        changeMany: changeMany
    }
    
})();