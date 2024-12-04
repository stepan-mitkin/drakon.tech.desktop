(function() {
    function startIde() {
        var userId = "Dar Veter"
        var pagePanic = function(err) {console.error(err)}
        var ide = new Ide3(window, document, translate, userId, pagePanic)
        var logic = new Ide3Logic(userId, ide, translate)
        ide.logic = logic
        
        
        window.onerror = ide.onError
        
        
        window.onpopstate = function (e) {
            if (e.state) {
                ide.onStateChange(e)	
            }
        }
        
        window.onresize = ide.orderResize	
        
        window.onmouseout = function(evt) { evt.preventDefault() }
        
        ide.init()    
    }

    async function getRecent() {
        var recentStr = localStorage.getItem("recent") || "[]"
        return JSON.parse(recentStr)
    }

    async function setRecent(recent) {
        var recentStr = JSON.stringify(recent)
        localStorage.setItem("recent", recentStr)
    }

    function openUrl(url) {
        window.open(url, '_blank').focus();
    }

    window.backend = {
        getRecent: getRecent,
        setRecent: setRecent,
        openUrl: openUrl
    }
    
})();