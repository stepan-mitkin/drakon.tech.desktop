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

    function createFolder(spaceId, folderId) {
        var id = buildId(spaceId, folderId)        
        var body = {type:"folder"}        
        var all = getAllFolders(spaceId)
        all[id] = true
        setAllFolders(spaceId, all)
        localStorage.setItem(id, JSON.stringify(body))
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
            createFolder(spaceId, "1")
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
        await pause(10)
        return {
            recent: []
        }
    }

    async function getFolder(spaceId, folderId) {
        await pause(10)
        var id = buildId(spaceId, folderId)
        var all = getAllFolders(spaceId)
        var folder = getFolderBody(id)
        folder.children = []
        folder.fullId = id
        folder.id = folderId
        folder.space_id = spaceId
        fixFolderName(folder)
        objFor(all, findChildren, folder)
        folder.path = buildFolderPath(id)
        if (folder.parent) {
            var pp = parseId(folder.parent)
            folder.parent = pp.folderId
        }
        folder.access = "write"
        return folder
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
        return path
    }

    function getFolderBody(id) {
        return JSON.parse(localStorage.getItem(id))        
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
        getHistory: getHistory
    }
    
})();