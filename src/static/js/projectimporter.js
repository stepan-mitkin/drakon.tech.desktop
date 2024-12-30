(function() {
    function addLineToProject(folders, line, lineNo) {
        var obj
        try {
            obj = JSON.parse(line)
        } catch (ex) {
            console.error(ex)
            throw new Error("JSON error at line " + lineNo + ": " + ex.message)
        }
        var id = checkProperty(obj, "id", lineNo)
        var parent = checkProperty(obj, "parent", lineNo)
        checkProperty(obj, "type", lineNo)
        checkProperty(obj, "name", lineNo)
        var parentRecord = folders[parent]
        if (!parentRecord) {
            throw new Error("Missing parent at line " + lineNo + ": " + parent)
        }
        if (folders[id]) {
            throw new Error("Non-unique id or cycle at line " + lineNo + ": " + id)
        }
        if (obj.type === "folder") {
            obj = createFolderRecord(obj.name)
        } else {
            delete obj.id
            delete obj.parent
        }
        folders[id] = obj
        parentRecord.children.push(id)
    }
    
    function checkProperty(obj, property, lineNo) {
        if (!obj[property]) {
            throw new Error("Required property missing in JSON at line " + lineNo + ": " + property)
        }
        return obj[property]
    }
    
    function createFolderRecord(name) {
        var result = {type:"folder", children:[]}
        if (name) {
            result.name = name
        }
        return result
    }
    
    function parseJsonlProject(text) {
        text = text || ""
        var lines = text.split("\n")    
        var folders = {root:createFolderRecord()}
        var i = 1
        for (var line of lines) {
            line = line.trim()
            if (line) {
                addLineToProject(folders, line, i)
            }
            i++
        }
        return folders
    }
    async function loadProject(spaceId, folders) {
        await backend.clearProject(spaceId)
        var root = folders["root"]
        var parentId = "1"
        for (var id of root.children) {
            await importFolder(spaceId, folders, id, parentId)
        }
    }
    
    async function importFolder(spaceId, folders, id, parentId) {
        var folder = folders[id]
        folder.parent = parentId
        var children = folder.children || []
        delete folder.children
        var result = await backend.createFolder(spaceId, folder)
        for (var childId of children) {
            await importFolder(spaceId, folders, childId, result.folder_id)
        }
    }
    
    if (!window.dtAppInjector) {
        window.dtAppInjector = {}
    }
    window.dtAppInjector.parseJsonlProject = parseJsonlProject
    window.dtAppInjector.loadProject = loadProject

    
})();