const fs = require('fs').promises;
const path = require('path');
const config = require("./config")

let globalIdCounter = 2;

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


function addToCache(winInfo, filepath, id, body) {
    winInfo.records[id] = body;
    winInfo.idToPath[id] = filepath;
    winInfo.pathToId[filepath] = id;
}

async function addToHistory(winInfo, folderId) {
    // Remove items with the same folderId
    winInfo.history = winInfo.history.filter(item => item.id !== folderId);

    // Insert the new item at the start
    winInfo.history.unshift({
        id: folderId,
        whenOpened: new Date().toISOString(),
    });

    // Trim the history to a max length of 30
    while (winInfo.history.length > 30) {
        winInfo.history.pop();
    }

    // Rewrite history
    await rewriteHistory(winInfo);
}

function getFolderName(winInfo, id) {
    var filepath = getFilePathById(winInfo, id)
    var parsed = path.parse(filepath)
    return parsed.name
}


async function rewriteHistory(winInfo) {
    const pathList = winInfo.history.map(item => ({
        path: getFilePathById(winInfo, item.id),
        whenOpened: item.whenOpened,
    }));

    const obj = { history: pathList };
    const filename = buildHistoryFilename(winInfo);  // Get the path for the history file
    await writeJson(filename, obj);
}


function applyEdits(body, target) {
    createItems(body, target);
    addedEdits(body, target);
    updatedEdits(body, target);
    removedEdits(body, target);
}

function createItems(body, target) {
    if (!target.items) {
        target.items = {};
    }
}

function addedEdits(body, target) {
    if (body.added) {
        for (const edit of body.added) {
            const item = { ...edit };
            delete item.id;
            target.items[edit.id] = item;
        }
    }
}

function updatedEdits(body, target) {
    if (body.updated) {
        for (const edit of body.updated) {
            const item = { ...edit };
            delete item.id;
            const existing = target.items[edit.id];
            Object.assign(existing, item);
        }
    }
}

function removedEdits(body, target) {
    if (body.removed) {
        for (const id of body.removed) {
            delete target.items[id];
        }
    }
}

function buildHistoryFilename(winInfo) {
    return path.join(getShadowFolderPath(winInfo.path), "history.json");
}

function getFilePathById(winInfo, id) {
    return winInfo.idToPath[id]
}

function getRecordById(winInfo, id) {
    return winInfo.records[id]
}

function buildFolderPath(winInfo, folderId) {
    let folderIdCurrent = folderId;
    const result = [];

    while (folderIdCurrent) {
        const filename = getFilePathById(winInfo, folderIdCurrent);
        const name = path.parse(filename).name;
        const record = getRecordById(winInfo, folderIdCurrent);

        result.push({
            space_id: winInfo.spaceId,
            id: folderIdCurrent,
            name,
        });

        folderIdCurrent = record.parent;
    }

    return result.reverse();
}

function generateUniqueId() {
    const id = globalIdCounter.toString();
    globalIdCounter++;
    return id;
}

async function createFolder(winInfo, spaceId, body) {
    const parentFolder = getFilePathById(winInfo, body.parent);

    let newPath, record, id;
    if (body.type === 'folder') {
        const newFilename = body.name;
        newPath = path.join(parentFolder, newFilename);

        if (await fileOrFolderExists(newPath)) {
            throw new Error('ERR_NAME_NOT_UNIQUE');
        } else {
            record = { type: 'folder', parent: body.parent };
            id = generateUniqueId();
            addToCache(winInfo, newPath, id, record);
            await createFolderOnDisk(newPath);
            return { folder_id: id };
        }
    } else {
        const newFilename = `${body.name}.${body.type}`;
        newPath = path.join(parentFolder, newFilename);

        if (await fileOrFolderExists(newPath)) {
            throw new Error('ERR_NAME_NOT_UNIQUE');
        } else {
            record = {};
            copyDiagramData(body, record);
            applyEdits(body, record);
            await writeJson(newPath, record);
            record.parent = body.parent;
            id = generateUniqueId();
            addToCache(winInfo, newPath, id, record);            
            return { folder_id: id };
        }
    }
}

async function getFolder(winInfo, spaceId, folderId) {
    if (spaceId !== winInfo.spaceId) throw new Error('Invalid spaceId');
    const existing = getRecordById(winInfo, folderId);
    const filepath = getFilePathById(winInfo, folderId);

    const body = {
        id: folderId,
        space_id: winInfo.spaceId,
        access: winInfo.access,
        parent: existing.parent,
        name: getFolderName(winInfo, folderId),
        path: buildFolderPath(winInfo, folderId),
        items: {},
        children: [],
    };

    if (await isDirectory(filepath)) {
        body.type = 'folder';
        body.children = await readChildren(winInfo, filepath, folderId);
    } else {
        const record = await readJson(filepath);
        copyDiagramData(record, body);
        copyDiagramData(record, existing);
        await addToHistory(winInfo, folderId);
    }

    return body;
}

function createHistoryItem(winInfo, item) {
    // Get the record for the given item ID from winInfo
    const record = getRecordById(winInfo, item.id);
    const name = getFolderName(winInfo, item.id)    
    var result = {
        folder_id: item.id,
        space_id: winInfo.spaceId,
        name: name,  // Get the name of the record by its ID
        type: record.type,
        whenOpened: item.whenOpened,  // The time the folder was opened
    };
    return result
}


async function readChildren(winInfo, folderPath, parent) {
    const files = await fs.readdir(folderPath);
    const children = [];

    for (const filename of files) {
        const fullpath = path.join(folderPath, filename);
        const name = path.parse(fullpath).name;

        if (name.startsWith(".")) { continue }

        if (await isDirectory(fullpath)) {
            let id;
            if (winInfo.pathToId[fullpath]) {
                id = winInfo.pathToId[fullpath];
            } else {
                id = generateUniqueId();
            }

            const record = {
                parent: parent,
                type: 'folder',
            };

            addToCache(winInfo, fullpath, id, record);

            children.push({
                id: id,
                space_id: winInfo.spaceId,
                type: 'folder',
                name: name,
            });
        } else {
            const ext = path.parse(fullpath).ext;

            if (ext === '.drakon') {
                let id;
                if (winInfo.pathToId[fullpath]) {
                    id = winInfo.pathToId[fullpath];
                } else {
                    id = generateUniqueId();
                }

                const fromDisc = await readJson(fullpath);
                const record = {
                    parent: parent,
                };

                copyDiagramData(fromDisc, record);

                addToCache(winInfo, fullpath, id, record);

                children.push({
                    id: id,
                    space_id: winInfo.spaceId,
                    type: 'drakon',
                    name: name,
                });
            }
        }
    }

    return children;
}


async function getHistory(winInfo) {
    return {
        recent: winInfo.history.map(item => createHistoryItem(winInfo, item)),
    };
}

async function loadHistory(winInfo) {
    const filename = buildHistoryFilename(winInfo);
    const obj = await readJson(filename);  // Read history from the shadow folder

    // If there are any issues reading the file or no history exists, return an empty array
    if (!obj.history) {
        return [];
    }

    // Iterate through the history and load the records into memory
    const history = [];
    for (const item of obj.history) {
        const id = await loadRecordFromDiscToCache(winInfo, item.path);  // Load each record by its path
        history.push({
            id: id,
            whenOpened: item.whenOpened,  // Preserve the "whenOpened" field from the file
        });
    }

    // Set the loaded history into winInfo
    winInfo.history = history;
}

function getParentPath(filepath) {
    return path.dirname(filepath);  // Returns the parent directory of the given filepath
}


async function loadRecordFromDiscToCache(winInfo, filepath) {
    // If the file path is already in the cache, return the corresponding ID
    if (winInfo.pathToId[filepath]) {
        return winInfo.pathToId[filepath];
    }

    // Otherwise, we need to load the record from the parent directory
    const parentPath = getParentPath(filepath);
    const parent = await loadRecordFromDiscToCache(winInfo, parentPath);

    let body;
    if (await isDirectory(filepath)) {
        body = { type: 'folder' };  // If it's a directory, create a folder record
    } else {
        body = await readJson(filepath);  // Otherwise, read the file as JSON
    }

    // Set the parent ID for the record
    body.parent = parent;

    // Generate a new unique ID for this record
    const id = generateUniqueId();

    // Add the record to the cache
    addToCache(winInfo, filepath, id, body);

    return id;
}



async function openFolderCore(winInfo, folderPath) {
    await determineAccess(winInfo, folderPath);
    createMemoryStructures(winInfo, folderPath);
    await loadHistory(winInfo, folderPath);
    return winInfo.spaceId
}

async function determineAccess(winInfo, folderPath) {
    const resolvedPath = path.resolve(folderPath);
    if (!(await isDirectory(resolvedPath))) {
        throw new Error('Invalid folder path');
    }
    const shadowFolderExists = await fileOrFolderExists(getShadowFolderPath(folderPath));
    var access
    try {
        await createShadowFolder(folderPath);
        await writeAccessFile(folderPath);
        access = 'write';
    } catch (ex) {
        console.log("determineAccess", ex)
        access = "read"
    }

    winInfo.path = folderPath;
    winInfo.access = access;
}

async function updateFolder(winInfo, spaceId, folderId, body) {
    // Check that the spaceId matches
    if (spaceId !== winInfo.spaceId) throw new Error('Invalid spaceId');
    
    // Get the existing record for the folder
    const existing = await getRecordById(winInfo, folderId);
    const filepath = await getFilePathById(winInfo, folderId);
    const oldName = path.parse(filepath).name;

    if (await isDirectory(filepath)) {
        // If it's a directory and the name is being updated
        if (body.name && body.name !== oldName) {
            const parentFolder = getParentPath(filepath);
            const newFilename = body.name;
            const newPath = path.join(parentFolder, newFilename);

            if (await fileOrFolderExists(newPath)) {
                throw new Error('ERR_NAME_NOT_UNIQUE');
            } else {
                // Rename the folder
                await renameFolder(filepath, newPath);

                // Replace the file path in the children
                replaceFilePathInChildren(winInfo, newPath, folderId);
                // Rewrite the history after updating the folder
                await rewriteHistory(winInfo);
            }
        }
    } else {
        // If it's a file
        if (!body.name || body.name === oldName) {
            // If the name hasn't changed, apply edits and write to file
            copyDiagramData(body, existing);
            applyEdits(body, existing);
            await saveDiagramToDisc(filepath, existing);
        } else {
            // If the name has changed
            const parentFolder = getParentPath(filepath);
            const newFilename = `${body.name}.${existing.type}`;
            const newPath = path.join(parentFolder, newFilename);

            if (await fileOrFolderExists(newPath)) {
                throw new Error('ERR_NAME_NOT_UNIQUE');
            } else {
                // Delete the old file and rename it
                await deleteFile(filepath);

                copyDiagramData(body, existing);
                applyEdits(body, existing);
                await saveDiagramToDisc(newPath, existing);

                replaceFilePathInChildren(winInfo, newPath, folderId);
                // Rewrite the history after renaming the file
                await rewriteHistory(winInfo);
            }
        }
    }
}

async function saveDiagramToDisc(filepath, obj) {
    var copy = clone(obj)
    delete copy.parent
    await writeJson(filepath, copy);
}

function clone(obj) {
    var copy = {}
    Object.assign(copy, obj)
    return copy
}

async function deleteFile(filepath) {
    try {
        await fs.rm(filepath, { recursive: true, force: true })
    } catch (err) {
        throw new Error(`Failed to delete file: ${filepath} ${err.message}`);
    }
}


function copyDiagramData(source, target) {
    const properties = ['items', 'keywords', 'params', 'description', 'type'];

    for (const property of properties) {
        if (property in source) {
            target[property] = source[property];  // Copy the property if it exists
        }
    }
}

function getChildIds(winInfo, parentId) {
    const result = [];

    // Loop through all records in winInfo.records
    for (const id in winInfo.records) {
        const record = winInfo.records[id];

        // If the record's parent matches the given parentId, add its ID to the result
        if (record.parent === parentId) {
            result.push(id);
        }
    }

    return result;
}


function replaceFilePathInChildren(winInfo, newPath, folderId) {
    var oldPath = getFilePathById(winInfo, folderId)
        // Update the path mappings in memory
    delete winInfo.pathToId[oldPath];  // Remove the old path mapping
    winInfo.pathToId[newPath] = folderId;  // Add the new path mapping
    winInfo.idToPath[folderId] = newPath;  // Update the id-to-path mapping    
    const childIds = getChildIds(winInfo, folderId);  // Get child IDs of the folder

    for (const id of childIds) {
        const record = getRecordById(winInfo, id);
        const oldPath = getFilePathById(winInfo, id);
        const oldName = path.parse(oldPath).base;
        const newPathForChild = path.join(newPath, oldName);  // New path for child based on the new folder path
        replaceFilePathInChildren(winInfo, newPathForChild, id);
    }
}


async function renameFolder(oldPath, newPath) {
    try {
        await fs.rename(oldPath, newPath);  // Rename the folder (or file)
    } catch (err) {
        throw new Error(`Failed to rename folder: ${err.message}`);
    }
}


function createMemoryStructures(winInfo, folderPath) {
    winInfo.spaceId = generateUniqueId();  // Generate a new unique spaceId

    // Initialize the memory cache structures
    winInfo.records = {};   // A map from ID to record content (for files or folders)
    winInfo.idToPath = {};  // A map from ID to full file path
    winInfo.pathToId = {};  // A map from file path to ID
    winInfo.history = [];   // A list to track previously opened files (by ID)

    // Create the root record for the folder (assuming "1" as the root folder ID)
    const rootId = "1";
    addToCache(winInfo, folderPath, rootId, { type: "folder" });
}


async function writeAccessFile(folderPath) {
    const filename = path.join(getShadowFolderPath(folderPath), 'opened.txt');
    const content = new Date().toISOString();
    await fs.writeFile(filename, content, 'utf-8');
}

function getShadowFolderPath(folderPath) {
    return path.join(folderPath, `.${config.exe}`);
}

async function createShadowFolder(folderPath) {
    var fullpath = getShadowFolderPath(folderPath)
    await createFolderOnDisk(fullpath)
}

function collectIdTree(winInfo, folderId, output) {
    output.push(folderId)    
    const childIds = getChildIds(winInfo, folderId);
    for (const id of childIds) {
        collectIdTree(winInfo, id, output);
    }
}

async function deleteOneFolder(winInfo, item, deleted) {
    collectIdTree(winInfo, item.id, deleted)
    var filepath = getFilePathById(winInfo, item.id)
    await deleteFile(filepath)
}

async function deleteFromEverywhere(winInfo, deleted) {
    for (var id of deleted) {
        var filepath = getFilePathById(winInfo, id)
        delete winInfo.idToPath[id]
        delete winInfo.pathToId[filepath]
        delete winInfo.records[id]
    }
    winInfo.history = winInfo.history.filter(item => deleted.indexOf(item.id) === -1)
    await rewriteHistory(winInfo)
}

async function changeMany(winInfo, body) {
    var deleted = []
    try {
        if (body.operation === "delete") {
            for (var item of body.items) {
                await deleteOneFolder(winInfo, item, deleted)
            }            
            await deleteFromEverywhere(winInfo, deleted)
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
    
    return {ok:true, deleted: deleted}
}

// Helper functions for file checks, reading/writing, etc.

async function fileOrFolderExists(filepath) {
    try {
        await fs.access(filepath);
        return true;
    } catch {
        return false;
    }
}

async function isDirectory(filepath) {
    const stats = await fs.stat(filepath);
    return stats.isDirectory();
}

async function createFolderOnDisk(newPath) {
    await fs.mkdir(newPath, { recursive: true });
}

async function readJson(filepath) {    
    try {
        const content = await fs.readFile(filepath, 'utf-8');
        return JSON.parse(content);
    } catch(ex) {
        console.log("Error", filepath, ex)
        return {};
    }
}

async function writeJson(filepath, object) {
    const content = JSON.stringify(object, null, 4);
    await fs.writeFile(filepath, content, 'utf-8');
}

// Exported functions
module.exports = {
    createFolder,
    getFolder,
    updateFolder,
    getHistory,
    openFolderCore,
    changeMany
};
