(function() {
    var gFolder = ""
    var gSpaceId = ""
    var gFolderName = ""
    var gFolders = {}
    var gSearch = undefined

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
        if (recent.length === 0) {
            var projects = getProjects()
            for (var path in projects) {
                var spaceId = projects[path]
                var all = getAllFolders(spaceId)
                for (var id in all) {
                    localStorage.removeItem(id)
                }
                localStorage.removeItem(spaceId + "-folders")
                localStorage.removeItem(spaceId + "-history")                
            }            
            localStorage.removeItem("projects")
            localStorage.removeItem("recent")
        } else {
            var recentStr = JSON.stringify(recent)
            localStorage.setItem("recent", recentStr)
        }
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

    async function updateSettings(update) {
        var settings = getSettingsCore()
        Object.assign(settings, update)
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
        var history = getHistoryItems()
        return {
            recent: history.map(getHistoryItem)
        }
    }

    function getUtc() {
        return Math.floor(Date.now() / 1000)
    }

    function getHistoryItems() {
        var historyStr = localStorage.getItem(gSpaceId + "-history") || "[]"
        return JSON.parse(historyStr)        
    }

    function saveHistoryItems(history) {
        var historyStr = JSON.stringify(history)
        localStorage.setItem(gSpaceId + "-history", historyStr)
    }

    function addToHistory(id) {        
        var histItem = {
            whenOpened: getUtc(),
            id: id
        }
        var history = getHistoryItems()
        deleteFromHistoryCore(history, [id])        
        history.unshift(histItem)
        while (history.length > 30) {
            history.pop()
        }
        saveHistoryItems(history)
    }

    function deleteFromArray(array, predicate) {
        for (let i = array.length - 1; i >= 0; i--) {
            if (predicate(array[i], i, array)) {
                array.splice(i, 1);
            }
        }
    }    

    function deleteFromHistory(ids) {
        var history = getHistoryItems()
        deleteFromHistoryCore(history, ids)
        saveHistoryItems(history)
    }

    function deleteFromHistoryCore(history, ids) {
        for (var id of ids) {
            deleteFromArray(history, element => element.id === id)
        }        
    }

    function getHistoryItem(histItem) {
        var id = histItem.id
        var parsed = parseId(id)
        var folder = getFolderBody(id)
        return {
            folder_id: parsed.folderId,
            space_id: parsed.spaceId,
            name: folder.name,
            type: folder.type,
            whenOpened: histItem.whenOpened
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
        var folderId = generateFolderId(spaceId)
        createFolderWithId(spaceId, folderId, body)
        return folderId
    }    

    function generateFolderId(spaceId) {
        var all = getAllFolders(spaceId)        
        var folderId = generateId(all, "f")
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
        var id = buildId(spaceId, folderId)
        gFolders[id] = getFolderBody(id)
        if (folder.type !== "folder") {
            addToHistory(id)
        }
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

    function deleteOneFolder(item, deleted) {
        var folder = getFolderWithChildren(item.space_id, item.id)
        forEach(folder.children, deleteOneFolder, deleted)
        var id = buildId(item.space_id, item.id)
        deleted.push(id)
        var all = getAllFolders(item.space_id)
        delete all[id]
        setAllFolders(item.space_id, all)
        localStorage.removeItem(id)
    }

    async function changeMany(body) {
        console.log("changeMany", body)
        await pause(10)        
        var deleted = []
        try {
            if (body.operation === "delete") {
                forEach(body.items, deleteOneFolder, deleted)
            } else if (body.operation === "copy") {
                forEach(body.items, copyOneFolder, body.target)
            } else if (body.operation === "move") {
                if (moveAcrossProjects(body)) {
                    forEach(body.items, copyOneFolder, body.target)
                } else {
                    forEach(body.items, moveOneFolder, body.target)
                }
            }
        } catch (ex) {
            return {ok:false, error:ex.message}
        }

        deleteFromHistory(deleted)
        return {ok:true, deleted: deleted}
    }

    function moveAcrossProjects(body) {
        return body.target.space_id !== body.items[0].space_id
    }

    async function edit(spaceId, folderId, change) {
        console.log("edit", spaceId, folderId, change)
        await pause(10)
        var id = buildId(spaceId, folderId)
        var folder = gFolders[id]
        setProperty(folder, change, "name")
        setProperty(folder, change, "params")
        setProperty(folder, change, "keywords")
        if (change.removed) {
            forEach(change.removed, removeItem, folder)
        }
        if (change.updated) {
            forEach(change.updated, updateItem, folder)
        }
        if (change.added) {
            forEach(change.added, addItem, folder)
        }        
        setFolderBody(id, folder)        
    }

    function setProperty(target, source, name) {
        if (name in source) {
            target[name] = source[name]
        }
    }

    function removeItem(id, folder) {
        delete folder.items[id]
    }

    function addItem(change, folder) {
        var copy = {}
        Object.assign(copy, change)
        delete copy["id"]
        if (!folder.items) {
            folder.items = {}
        }
        fixContentField(copy)
        folder.items[change.id] = copy
    }  
    
    function updateItem(change, folder) {
        var existing = folder.items[change.id]
        var copy = {}
        Object.assign(copy, existing)
        Object.assign(copy, change)
        delete copy["id"]
        fixContentField(copy)
        folder.items[change.id] = copy
    }      

    function fixContentField(copy) {
        if ("text" in copy) {
            copy.content = copy.text
            delete copy["text"]
        }
    }

    function checkForCycles(id, targetId) {
        var targetPath = buildFolderPath(targetId)
        var parsed = parseId(id)
        for (var step of targetPath) {
            if (step.space_id === parsed.spaceId && step.id === parsed.folderId) {
                throw new Error("ERR_CYCLE")
            }
        }
    }

    function copyOneFolder(item, target) {
        var id = buildId(item.space_id, item.id)
        var folder = getFolderBody(id)
        var targetId = buildId(target.space_id, target.folder_id)
        checkForCycles(id, targetId)
        var targetFolder = getFolderWithChildren(target.space_id, target.folder_id)
        var name = folder.name
        while (!isUnique(targetFolder.children, name)) {
            name += "-x2"
        }        
        copyFolderRecursive(id, name, targetId)
    }

    function moveOneFolder(item, target) {
        var id = buildId(item.space_id, item.id)
        var folder = getFolderBody(id)        
        var targetId = buildId(target.space_id, target.folder_id)
        checkForCycles(id, targetId)        
        var targetFolder = getFolderWithChildren(target.space_id, target.folder_id)
        var name = folder.name
        while (!isUnique(targetFolder.children, name)) {
            name += "-x2"
        }        
        folder.parent = targetId
        setFolderBody(id, folder)        
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
        var newFolderId = generateFolderId(tparsed.spaceId)
        var newId = buildId(tparsed.spaceId, newFolderId)
        var existing = getFolderWithChildren(parsed.spaceId, parsed.folderId)
        for (var child of existing.children) {
            var childId = buildId(child.space_id, child.id)
            copyFolderRecursive(childId, undefined, newId)
        }
        createFolderWithId(tparsed.spaceId, newFolderId, folder)        
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

    async function searchFolders(body) {
        console.log("searchFolders", body)
        await pause(10)  
        var spaceId = body.spaces[0]
        return searchFolderCore(spaceId, [body.needle], 10)
    }

    async function searchDefinitions(body) {
        console.log("searchDefinitions", body)
        await pause(10)  
        var spaceId = body.space_id
        return searchFolderCore(spaceId, body.tokens, 1)
    }    

    function getMatchRank(name, needles) {
        var rank = 10000
        for (var needle of needles) {
            var nrank
            if (name === needle) {
                nrank = 1
            } else if (name.indexOf(needle) !== -1) {
                nrank = 10
            } else {
                continue
            }
            rank = Math.min(rank, nrank)
        }
        return rank
    }

    function searchFolderCore(spaceId, needles, maxRank) {
        var all = getAllFolders(spaceId)
        var needlesChecked = prepareNeedles(needles)        

        var results = []
        for (var id in all) {
            var folder = getFolderBody(id)
            if (!folder.name) {continue}
            var name = folder.name.toLowerCase()
            var rank = getMatchRank(name, needlesChecked)
            if (rank <= maxRank) {
                results.push({
                    id: id,
                    name: folder.name,
                    rank: rank,
                    body: folder
                })
            }
        }
        results.sort(sortByRankThenName)
        return {
            folders: results.map(transformSearchResultFolder)
        }        
    }

    function prepareNeedle(text) {
        text = text || ""
        text = text.trim()
        return text.toLowerCase()
    }

    function sortByRankThenName(left, right) {
        if (left.rank < right.rank) {return -1}
        if (left.rank > right.rank) {return 1}
        if (left.name < right.name) {return -1}
        if (left.name > right.name) {return 1}  
        return 0
    }

    function transformSearchResultFolder(item) {
        var parsed = parseId(item.id)
        return {
            folder_id: parsed.folderId,
            space_id: parsed.spaceId,
            name: item.body.name,
            type: item.body.type,
            path: buildPathForSearch(item.id)
        }
    }

    function buildPathForSearch(id) {
        return buildFolderPath(id).map(step => step.name)
    }

    function createItemSearch(all, needles) {
        var found = []
        var completed = false
        async function start() {
            if (completed) {throw new Error("Search has completed")}
            for (var id in all) {
                searchDiagram(id)
                await pause(1)
            }
            completed = true
        }

        function searchDiagram(id) {
            var folder = getFolderBody(id)
            if (folder.type === "folder") { return }
            searchItem(id, "params", folder, folder.params)
            var items = folder.items || {}
            for (var itemId in items) {
                var item = items[itemId]
                searchItem(id, itemId, folder, item.content)
            }
        }

        function searchItem(id, itemId, folder, content) {
            content = content || ""
            var parts = content
                .split("\n")
                .map(part => part.trim())
                .filter(part => !!part)
            for (var part of parts) {
                var low = part.toLowerCase()
                for (var needle of needles) {
                    if (low.indexOf(needle) !== -1) {
                        found.push(createFoundItem(id, itemId, folder, part))
                    }
                }
            }  
        }

        function createFoundItem(id, itemId, folder, text) {
            var parsed = parseId(id)
            return {
                space_id: parsed.spaceId,
                folder_id: parsed.folderId,
                name: folder.name,
                path: buildPathForSearch(id),
                type: folder.type,
                item_id: itemId,
                text: text
            }
        }

        function getResults() {
            var result = {
                completed: completed,
                items: found
            }
            found = []
            return result
        }

        return {
            start: start,
            getResults: getResults
        }
    }

    async function searchItems(body) {
        console.log("searchItems", body)
        await pause(10)  
        var spaceId = body.spaces[0]
        startItemsSearch(spaceId, [body.needle])
        return {}
    }    

    function prepareNeedles(needles) {
        return needles
            .map(prepareNeedle)
            .filter(nee => !!nee)          
    }

    function startItemsSearch(spaceId, needles) {
        var needlesChecked = prepareNeedles(needles)        
        if (gSearch) {
            gSearch.stop()
            gSearch = undefined
        }
        if (needlesChecked.length === 0) {
            return
        }
        var all = getAllFolders(spaceId)
        gSearch = createItemSearch(all, needlesChecked)
        gSearch.start()        
    }

    async function pollSearch() {
        console.log("pollSearch")
        await pause(10)  
        var result = {
            completed: true,
            items: []
        }
        if (!gSearch) {
            return result
        }
        result = gSearch.getResults()
        if (result.completed) {
            gSearch = undefined
        }
        return result
    }

    function setTitle(title) {
        document.title = title
    }

    function restartApp() {
        console.log("restartApp")
        location.reload()
    }

    async function setClipboard(type, content) {
        console.log("setClipboard", type, content)
        await pause(10)
        localStorage.setItem("clipboard-type", type)
        localStorage.setItem("clipboard-content", content)
    }

    window.onstorage = function(evt) {
        if (evt.key === "clipboard-content") {
            var type = localStorage.getItem("clipboard-type")
            var content = localStorage.getItem("clipboard-content")
            setLocalClipboard(type, content)
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
        changeMany: changeMany,
        edit: edit,
        searchFolders: searchFolders,
        searchItems: searchItems,
        pollSearch: pollSearch,
        searchDefinitions: searchDefinitions,
        setTitle: setTitle,
        restartApp: restartApp,
        setClipboard: setClipboard
    }
    
})();