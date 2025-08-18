(function () {
    async function getAppVersion() {
        return "v2025.08.17"
    }

    var gLanguage = undefined
    var gFolder = ""
    var gSpaceId = ""
    var gFolderName = ""
    var gFolders = {}
    var gSearch = undefined
    var gGenerated = ""

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

    function sendRequest(method, url, body, headers) {
        return new Promise(resolve => {
            var request = new XMLHttpRequest()
            request.onreadystatechange = function () {
                onDataWhenReady(resolve, request)
            }
            request.open(method, url, true)
            if (headers) {
                for (var header in headers) {
                    var value = headers[header]
                    request.setRequestHeader(header, value)
                }
            }
            request.send(body)
        })
    }

    function onDataWhenReady(onData, request) {
        if (request.readyState === 4) {
            var result = {
                responseText: request.responseText,
                status: request.status
            }
            onData(result)
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
                clearProjectCore(spaceId)
            }
            localStorage.removeItem("projects")
            localStorage.removeItem("recent")
        } else {
            var recentStr = JSON.stringify(recent)
            localStorage.setItem("recent", recentStr)
        }
    }

    async function clearProject(spaceId) {
        console.log("clearProject", spaceId)
        await pause(10)
        clearProjectCore(spaceId)
        createRoot(spaceId)
    }

    function clearProjectCore(spaceId) {
        var all = getAllFolders(spaceId)
        for (var id in all) {
            localStorage.removeItem(id)
        }
        localStorage.removeItem(spaceId + "-folders")
        localStorage.removeItem(spaceId + "-history")
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
        return prompt("Enter a name for the new project")
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
            .filter(part => { return part.trim() !== "" })
        return parts[parts.length - 1]
    }

    function createRoot(spaceId) {
        var body = { type: "folder" }
        createFolderWithId(spaceId, "1", body)
    }

    async function openFolder(folder) {
        var projects = getProjects()
        var spaceId = projects[folder]
        if (!spaceId) {
            spaceId = generateId(projects, "proj")
            projects[folder] = spaceId
            createRoot(spaceId)
            setProjects(projects)
        }
        gLanguage = "JS"
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
            recent: history.map(getHistoryItem).filter(item => !!item)
        }
    }

    function getUtc() {
        return (new Date()).toISOString()
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
        if (!folder) { return undefined }
        return {
            folder_id: parsed.folderId,
            space_id: parsed.spaceId,
            name: folder.name,
            type: folder.type,
            whenOpened: histItem.whenOpened
        }
    }

    function nameIsUnique(parentId, name) {
        var targetFolder = getFolderWithChildren(gSpaceId, parentId)
        while (!isUnique(targetFolder.children, name)) {
            return false
        }
        return true
    }

    async function createFolder(spaceId, body) {
        console.log("createFolder", spaceId, body)
        await pause(10)
        var parentId = body.parent
        body.parent = buildId(spaceId, parentId)
        if (!nameIsUnique(parentId, body.name)) {
            return {error:'ERR_NAME_NOT_UNIQUE'};
        }
        var folderId = createFolderCore(spaceId, body)
        return { folder_id: folderId }
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
        folder.language = gLanguage
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
        deleted.push(item.id)
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
            return { ok: false, error: ex.message }
        }

        deleteFromHistory(deleted)
        return { ok: true, deleted: deleted }
    }

    function moveAcrossProjects(body) {
        return body.target.space_id !== body.items[0].space_id
    }

    async function updateFolder(spaceId, folderId, change) {
        console.log("updateFolder", spaceId, folderId, change)
        await pause(10)
        var id = buildId(spaceId, folderId)
        if (!gFolders[id]) {
            gFolders[id] = getFolderBody(id)
        }
        var folder = gFolders[id]
        if (change.name && change.name !== folder.name) {
            var parsed = parseId(folder.parent)
            if (!nameIsUnique(parsed.folderId, change.name)) {
                return {error:'ERR_NAME_NOT_UNIQUE'};
            }
        }
        setProperty(folder, change, "name")
        setProperty(folder, change, "params")
        setProperty(folder, change, "keywords")
        setProperty(folder, change, "description")
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
            if (!folder.name) { continue }
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
        if (left.rank < right.rank) { return -1 }
        if (left.rank > right.rank) { return 1 }
        if (left.name < right.name) { return -1 }
        if (left.name > right.name) { return 1 }
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
            if (completed) { throw new Error("Search has completed") }
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

    window.onstorage = function (evt) {
        if (evt.key === "clipboard-content") {
            var type = localStorage.getItem("clipboard-type")
            var content = localStorage.getItem("clipboard-content")
            setLocalClipboard(type, content)
        }
    }

    async function saveAsPng(filename, dataurl) {
        const link = document.createElement('a');
        link.href = dataurl;
        link.download = filename;

        // Append the anchor to the body
        document.body.appendChild(link);

        // Programmatically click the anchor to trigger the download
        link.click();

        // Remove the anchor from the document
        document.body.removeChild(link);
    }


    function downloadTextFile(filename, content) {
        // Create a new Blob object using the content and specifying UTF-8 encoding
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });

        // Create a temporary anchor (<a>) element
        const link = document.createElement('a');

        // Generate a URL for the Blob and set it as the href attribute
        link.href = URL.createObjectURL(blob);

        // Set the download attribute with the desired filename
        link.download = filename;

        // Append the link to the document body (required for Firefox)
        document.body.appendChild(link);

        // Programmatically click the link to trigger the download
        link.click();

        // Clean up by removing the link and revoking the object URL
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    function getRootId() {
        return buildId(gSpaceId, "1")
    }

    function getExportFolders() {
        var result = []
        var rootId = getRootId()
        var all = getAllFolders(gSpaceId)
        var context = {
            all: all,
            result: result,
            nextId: 2
        }
        exportFolders(context, rootId, "root")
        return result
    }

    function exportFolders(context, parentId, newParentId) {
        for (var id in context.all) {
            var folder = getFolderBody(id)
            if (folder.parent === parentId) {
                folder.parent = newParentId
                var newId = context.nextId.toString()
                context.nextId++
                folder.id = newId
                var str = JSON.stringify(folder)
                context.result.push(str)
                exportFolders(context, id, newId)
            }
        }
    }

    function exportProject() {
        console.log("exportProject!")
        var folders = getExportFolders()
        var filename = gFolderName + ".jsonl"
        var content = folders.join("\n")
        downloadTextFile(filename, content)
    }

    async function closeFolder() {
        console.log("closeFolder")
        await pause(10)
        gFolder = ""
        gSpaceId = ""
        gFolderName = ""
        gFolders = {}
        gSearch = undefined
    }

    function parseQueryString() {
        var queryString = window.location.search
        // If the query string starts with '?', remove it
        if (queryString.startsWith('?')) {
            queryString = queryString.slice(1);
        }

        // Split the query string into key-value pairs
        const pairs = queryString.split('&');
        const params = {};

        // Iterate through each key-value pair
        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) {
                // Decode key and value to handle URL encoding
                const decodedKey = decodeURIComponent(key);
                const decodedValue = value ? decodeURIComponent(value) : undefined;

                // Handle duplicate keys by storing values in an array
                if (params[decodedKey]) {
                    if (Array.isArray(params[decodedKey])) {
                        params[decodedKey].push(decodedValue);
                    } else {
                        params[decodedKey] = [params[decodedKey], decodedValue];
                    }
                } else {
                    params[decodedKey] = decodedValue;
                }
            }
        });

        return params;
    }


    async function getProjectName() {
        console.log("getProjectName")
        await pause(10)
        return gFolderName
    }

    async function getMyFolder() {
        console.log("getMyFolder")
        await pause(10)
        if (gFolder) {
            return gFolder
        }

        var query = parseQueryString()
        return query.folder
    }

    async function downloadExample(folder) {
        console.log("downloadExample", folder)
        await pause(10)
        try {
            var projects = getProjects()
            var spaceId = projects[folder]
            if (spaceId) {
                console.log("Found existing project in local storage")
                return
            }
            var url = "/drakon.tech.desktop/examples/" + folder + ".jsonl"
            var response = await sendRequest("GET", url)
            if (response.status !== 200) {
                console.log("Response status: " + response.status)
                return
            }
            spaceId = await openFolder(folder)
            var project = dtAppInjector.parseJsonlProject(response.responseText)
            await dtAppInjector.loadProject(spaceId, project)
        } catch (ex) {
            console.error("downloadExample", ex)
        }
    }

    function newWindow() {
        window.open(window.location.href, '_blank');
    }

    async function getRootHandle() {
        console.log("getRootHandle")
        await pause(10)
        return getRootId()
    }

    async function saveGeneratedFile(content) {
        console.log("saveGeneratedFile", content.length)
        await pause(10)
        gGenerated = content
    }


    async function getObjectByHandle(id) {
        console.log("getObjectByHandle", id)
        await pause(10)

        var spaceId = gSpaceId
        var all = getAllFolders(spaceId)
        var folder = getFolderBody(id)
        folder.path = id
        folder.children = []
        for (var objId in all) {
            var obj = getFolderBody(objId)
            if (obj.parent === id) {
                folder.children.push(objId)
            }
        }
        fixFolderName(folder)
        return folder
    }

    async function getFolderInfoByHandle(id) {
        var obj = getFolderBody(id)
        return {
            id: id,
            name: obj.name
        }
    }

    async function showGeneratedFile() {
        console.log("showGeneratedFile", gFolderName)
        const blob = new Blob([gGenerated], { type: 'text/javascript' });

        // Create an object URL from the Blob
        const url = URL.createObjectURL(blob);

        // Open a new tab with the URL
        window.open(url, '_blank');

        // Optionally, release the object URL when you're done
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 10000);
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
        searchFolders: searchFolders,
        searchItems: searchItems,
        pollSearch: pollSearch,
        searchDefinitions: searchDefinitions,
        setTitle: setTitle,
        restartApp: restartApp,
        setClipboard: setClipboard,
        newWindow: newWindow,
        closeFolder: closeFolder,
        exportProject: exportProject,
        clearProject: clearProject,
        downloadTextFile: downloadTextFile,
        saveAsPng: saveAsPng,
        getMyFolder: getMyFolder,
        getAppVersion: getAppVersion,
        getProjectName: getProjectName,
        getRootHandle: getRootHandle,
        getObjectByHandle: getObjectByHandle,
        saveGeneratedFile: saveGeneratedFile,
        getFolderInfoByHandle: getFolderInfoByHandle,
        showGeneratedFile: showGeneratedFile,
        downloadExample: downloadExample
    }


})();