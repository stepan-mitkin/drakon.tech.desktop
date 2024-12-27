(function() {
    async function pause(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    var state = "working"
    var name = ""
    var generator = undefined
    var errors = []
    var failed = false


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



    window.build_start = async function() {
        console.log("build_start")
        name = await backend.getProjectName()
        state = "working"
        errors = []
        failed = false

        var root = await backend.getRootHandle()
        var onData = backend.saveGeneratedFile
        generator = generateJavaScript(name, root, backend.getObjectByHandle, onError, onData)

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
            url: "none"
        }
    }
})();


