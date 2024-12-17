(function() {
    async function pause(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    var state = "working"
    var name = ""

    window.build_start = async function() {
        console.log("build_start")
        await pause(10)
        name = await backend.getProjectName()
        state = "working"
        setTimeout(() => {
            state = "error"
        }, 2000)

        return {
            state: state,
            name: name,
            module: name
        }        
    }

    window.build_stop = function() {
        console.log("build_stop")

    }

    window.build_check = async function() {
        console.log("build_check")
        return {
            state: state,
            name: name,
            module: name
        }
    }
})();