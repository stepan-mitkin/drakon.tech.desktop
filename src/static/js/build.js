(function() {
    async function pause(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    var state = "working"
    var name = ""
    var generator = undefined
    var errors = []
    var failed = false
    var generatedPseudocode = undefined


    async function convertError(err) {
        var target = undefined;
        var id = undefined;
        var name = undefined;
        var type = "folder";
        if (err.filename) {
            var folderInfo = await backend.getFolderInfoByHandle(err.filename);
            name = folderInfo.name;
            id = folderInfo.id;
        }
        if (id) {
            if (err.nodeId) {
                target = {
                    itemId: err.nodeId,
                    id: id
                };
                type = "item";
            } else {
                target = id;
            }
        }
        var errorInfo = {
            message: err.message,
            name: name,
            type: type,
            target: target
        };
        return errorInfo;
    }

    function onError(err) {
        errors.push(err)
        failed = true
        if (err.stack) {
            console.log(err.message, err.stack)
        } else {
            console.log(err.message)
        }
    }

    async function runBuild() {
        await pause(1)
        await generator.run()
        if (failed) {
            state = "error"
        } else {
            state = "success"
        }
    }

    function onDataHuman(data) {
        generatedPseudocode = data
    }

    function buildHumanGenerator(root, getObjectByHandle, onData) {
        var generatedBlocks = []
        var diagrams = []
        var stopRequested = false
        async function runHumanGenerator() {
            await collectDiagrams(root)
            for (var diagram of diagrams) {                
                generatePseudo(diagram)
                await pause(1)
                if (stopRequested) { return }
            }
            var output = generatedBlocks.join("\n\n")
            onData(output)
        }

        function generatePseudo(diagram) {
            var userLanguage = getLanguage()
            var content
            try {
                content = window.drakongen.toPseudocode(diagram.json, diagram.name, diagram.handle, userLanguage)            
                generatedBlocks.push(content)
            } catch (ex) {                
                onError(ex)
            }
        }

        async function collectDiagrams(handle) {
            var folder = await getObjectByHandle(handle)
            if (!folder) { return }
            if (folder.type === "folder") {
                console.log("Processing folder " + folder.name)
                for (var childPath of folder.children) {
                    await collectDiagrams(childPath)
                    if (stopRequested) { return }
                }
            } else if (folder.type === "drakon") {
                diagrams.push({
                    handle: handle,
                    name: folder.name,
                    json: JSON.stringify(folder)
                })
            }
        }

        function stopHumanGenerator() {
            stopRequested = true
        }
        return {
            run: runHumanGenerator,
            stop: stopHumanGenerator
        }
    }


    window.build_start = async function(folder) {
        console.log("build_start", folder)
        state = "working"
        errors = []
        failed = false
        generatedPseudocode = undefined

        var root, onData
        if (folder.language === "LANG_HUMAN") {
            name = folder.name
            root = await backend.getFilePathById(folder.folderId)
            onData = onDataHuman
            generator = buildHumanGenerator(root, backend.getObjectByHandle, onData)

        } else {
            name = await backend.getProjectName()
            root = await backend.getRootHandle()
            onData = backend.saveGeneratedFile
            generator = drakontechgen.buildGenerator(
                name,
                root,
                backend.getObjectByHandle,
                onError,
                onData,
                folder.language)            
        }

        runBuild()

        return {
            state: state,
            name: name,
            module: name
        }        
    }

    window.build_stop = function() {
        console.log("build_stop")
        generator.stop()
    }

    window.build_check = async function() {
        console.log("build_check")
        var errorsCopy = []
        for (var err of errors) {
            var errorInfo = await convertError(err);
            errorsCopy.push(errorInfo)
        }
        errors = []
        return {
            errors: errorsCopy,
            state: state,
            name: name,
            module: name,
            url: "none",
            generatedPseudocode: generatedPseudocode
        }
    }
})();


