(function() {
    var appVersion = "v 2024.12.04"
    function loop(begin, end, step, callback) {
        for (var i = begin; i < end; i += step) {
            callback(i)
        }
    }

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
    
    function clear(element) {
        clearViaLastChild(element);
    }
    
    function createStyle(header, body) {
        return {
            header: header,
            body: body
        };
    }
    
    function div() {
        var args;
        args = Array.from(arguments);
        return createElement('div', args);
    }
    
    function get(id) {
        var element;
        element = document.getElementById(id);
        if (element) {
            return element;
        }
        throw new Error('Element not found: ' + id);
    }
    
    function img(src, alt) {
        var element;
        element = document.createElement('img');
        element.draggable = false;
        element.src = src;
        element.alt = alt || '';
        element.style.display = 'inline-block';
        element.style.verticalAlign = 'middle';
        return element;
    }

    function clearViaLastChild(node) {
        while (node.firstChild) {
            node.removeChild(node.lastChild);
        }
    }

    function add(parent, child) {
        parent.appendChild(child);
    }
    
    function addText(element, text) {
        var newNode;
        newNode = document.createTextNode(text);
        element.appendChild(newNode);
    }
        
    function setText(element, text) {
        clear(element);
        addText(element, text);
    }

    function replaceStyleSheet(id, styles) {
        var styleSheet, lines, content;
        removeExisting(id);
        styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        document.head.appendChild(styleSheet);
        lines = [];
        forEach(styles, printStyle, lines);
        content = lines.join('\n');
        addText(styleSheet, content);
    }    

    function appendStyleLine(body, i, lines) {
        var line;
        line = '  ' + body[i] + ': ' + body[i + 1] + ';';
        lines.push(line);
    }
    
    function printStyle(style, lines) {
        lines.push(style.header + ' {');
        loop(0, style.body.length, 2, i => appendStyleLine(style.body, i, lines));
        lines.push('}');
        lines.push('');
    }    

    function applyArgument(arg, element) {
        if (arg) {
            if (typeof arg === 'string') {
                element.className = arg;
                return;
            }
            if (typeof arg === 'object') {
                if (arg.nodeType) {
                    element.appendChild(arg);
                } else {
                    if (Array.isArray(arg)) {
                        arg.forEach(child => element.appendChild(child));
                        return;
                    }
                    objFor(arg, setElementProperty, element);
                    return;
                }
            }
        } else {
            return;
        }
    }
    
    function createElement(tag, args) {
        var element;
        element = document.createElement(tag);
        forEach(args, applyArgument, element);
        return element;
    }
    
    function removeExisting(id) {
        var element;
        element = document.getElementById(id);
        if (element) {
            element.remove();
        }
    }
    
    function setElementProperty(key, value, element) {
        if (key === 'text') {
            if (value) {
                addText(element, value);
                return;
            }
        } else {
            element.style.setProperty(key, value);
        }
    }

    function initStyles() {
        replaceStyleSheet("start-screen", [
            createStyle(".ui2-default-button", [
                "display", "inline-block",
                "cursor", "pointer",
                "text-align", "center",
                "user-select", "none",
                "white-space", "nowrap",                
                "color", "white",
                "background", "linear-gradient(coral, rgb(205, 91, 69))",
                "padding", "10px",
                "border-radius", "8px",
                "text-align", "center",
                "min-width", "250px"
            ]),
        
            createStyle(".ui2-default-button:active", [
                "transform", "translateY(2px)"
            ]),            
            createStyle(".ui2-normal-button", [
                "display", "inline-block",
                "cursor", "pointer",
                "text-align", "center",
                "user-select", "none",
                "white-space", "nowrap",                
                "color", "white",
                "background", "linear-gradient(rgb(117, 138, 148), rgb(69, 90, 100))",
                "padding", "10px",
                "border-radius", "8px",
                "text-align", "center",
                "min-width", "250px"
            ]),
        
            createStyle(".ui2-normal-button:active", [
                "transform", "translateY(2px)"
            ]),
        
            createStyle(".start-subheader", [
                "font-size", "18px",
                "font-weight", "bold",
                "margin", "15px 0",
            ]),
        
            createStyle(".recent-div", [
                "margin-top", "10px",
                "margin-bottom", "10px"
            ]),
        
            createStyle(".recent-item", [
                "margin", "5px 0",
            ]),
        
            createStyle(".button-div", [
                "margin", "10px 0",
                "text-align", "center"
            ])    
        ])     
    }

    function createLink(url) {
        var link = div({
            "cursor": "pointer",       
            "display": "inline-block"
        })
        var callback = function() {
            backend.openUrl(url)
        }
        link.addEventListener("click", callback)
        return link
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

    function addRecentButton(recent, parent) {
        const recentItem = div("recent-item");
        var last = getLastStage(recent)
        recentItem.add(div("recent-name", {text:last}))
        recentItem.add(div("recent-value", {text:recent}))
        var callback = function() {
            tryOpenFolder(recent)
        }
        recentItem.addEventListener("click", callback)
        add(parent, recentItem);
    }

    function openFolder() {
        console.log("openFolder")
    }

    function clearRecent(recentDiv) {
        backend.setRecent([])
        clear(recentDiv)
    }

    function renderStartPage(container, recent) {
        var motherSite = "https://drakonhub.com/"
        var logoUrl = "static/images/drakosha-logo-text-126.png"
        var logoHeight = 63
            // Create header
        const header = div();
        header.style.height = `${logoHeight + 1}px`;        
        header.style.textAlign = "center"
        header.style.marginTop = "20px"
        header.style.marginBottom ="20px"
        header.style.position = "relative"


        const headerLink = createLink(motherSite); // Create the <a> tag
        const logo = img(logoUrl, "Logo");
        logo.style.width = "324.500px";
        logo.style.maxWidth = "100%"
        add(headerLink, logo);
        add(header, headerLink);
        add(container, header);

        add(
            container,
            div({
                text: appVersion,
                position: "absolute",
                display: "inline-block",
                right: "5px",
                top: "5px"
            })
        )        

        // Create body
        const body = div();
        body.style.width = "900px";
        body.style.maxWidth = "100%";
        body.style.paddingLeft = "20px";
        body.style.paddingRight = "20px";
        body.style.margin = "auto"; // Center align body content
        add(container, body);

        // Add "Open folder..." button
        const openFolderButtonDiv = div("button-div");
        const openFolderButton = div("ui2-default-button");
        openFolderButton.innerText = translate("Open folder...");
        openFolderButton.onclick = openFolder; // Set click handler
        add(openFolderButtonDiv, openFolderButton);
        add(body, openFolderButtonDiv);

        if (recent.length === 0) {return}
        

        // Add "Recent" subheader
        const recentSubheader = div("start-subheader");
        recentSubheader.innerText = translate("Recent");
        add(body, recentSubheader);

        const recentDiv = div("recent-div");

        // Add "Clear recent" button
        const clearRecentButtonDiv = div("button-div");
        const clearRecentButton = div("ui2-normal-button");
        clearRecentButton.innerText = translate("Clear recent");
        clearRecentButton.onclick = function() { clearRecent(recentDiv) } // Set click handler
        add(clearRecentButtonDiv, clearRecentButton);
        add(body, clearRecentButtonDiv);

        // Create recent-div and assign it to the variable
        
        add(body, recentDiv);

        // Add recent items if needed
        forEach(recent, addRecentButton, recentDiv)
    }
    

    async function main() {
        initStyles()
        var recent = await backend.getRecent()
        removeExisting("loading")
        var wide = get("wide")
        clear(wide)
        wide.style.display = "inline-block"
        wide.style.position = "fixed"
        wide.style.left = "0px"
        wide.style.top = "0px"
        wide.style.width = "100vw"
        wide.style.height = "100vh"
        renderStartPage(wide, recent)
    }


    main()

})();