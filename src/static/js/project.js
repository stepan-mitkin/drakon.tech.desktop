// project-dialog.js
(function() {
    "use strict";

    // Module global variables
    var globalOptions = undefined;

    // Helper functions
    function tr(text) {
        return globalOptions.translate(text);
    }

    function add(container, element) {
        container.appendChild(element);
    }

    function addComboboxOption(combo, value, text) {
        var option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        add(combo, option);
    }

    function addLabel(parent, text) {
        var div = document.createElement("div");
        div.textContent = text;
        parent.appendChild(div);
    }

    function addSpace(element) {
        var div = document.createElement("div");
        div.style.height = "20px";
        element.appendChild(div);
    }

    function addTitle(container, text) {
        var h2 = document.createElement("h2");
        h2.textContent = text;
        container.appendChild(h2);
    }

    function bindCallback(action, argument) {
        return function(evt) {
            action(argument, evt);
        };
    }

    function checkIfProjectNameIsValid(name) {
        if (name === "") {
            return false;
        }
        // Check for whitespace chars
        if (/\s/.test(name)) {
            return false;
        }
        // Check for chars forbidden in file paths on Windows, macOS, and Linux
        if (/[<>:"|?*\\/]/.test(name)) {
            return false;
        }
        // Check for punctuation symbols
        if (/[.,;!@#$%^&()\[\]{}=+~`]/.test(name)) {
            return false;
        }
        return true;
    }

    function closeModalDialog() {
        var central = document.getElementById("central");
        clear(central);
    }

    function clear(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    function createCombobox() {
        var select = document.createElement("select");
        return select;
    }

    function createErrorArea() {
        var div = document.createElement("div");
        div.style.color = "darkred";
        return div;
    }

    function createHorizontalRight(rightWidth, left, right) {
        var container = document.createElement("div");
        add(container, left);
        add(container, right);
        container.style.display = "block";
        container.style.whiteSpace = "nowrap";
        
        right.style.width = rightWidth + "px";
        right.style.minWidth = rightWidth + "px";
        right.style.marginLeft = "5px";
        left.style.width = "calc(100% - " + (rightWidth + 5) + "px)";
        
        return container;
    }

    function createModalDialog() {
        var central = document.getElementById("central");
        central.style.display = "block";
        clear(central);
        
        var background = document.createElement("div");
        background.style.position = "fixed";
        background.style.top = "0";
        background.style.left = "0";
        background.style.width = "100%";
        background.style.height = "100%";
        background.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        background.style.overflow = "hidden";
        central.appendChild(background);
        
        var dialog = document.createElement("div");
        dialog.style.backgroundColor = "white";
        dialog.style.width = "500px";
        dialog.style.maxWidth = "calc(100% - 40px)";
        dialog.style.margin = "0 auto";
        dialog.style.position = "relative";
        dialog.style.top = "50px";
        dialog.style.overflowY = "auto";
        dialog.style.padding = "20px";
        dialog.classList.add("pp-central-dialog");
        central.appendChild(dialog);
        
        return dialog;
    }

    function createTextButton(className, text, action) {
        var div = document.createElement("div");
        div.textContent = text;
        div.className = className;
        div.addEventListener("click", action);
        return div;
    }

    function createTextInput(value, placeholder) {
        var input = document.createElement("input");
        input.type = "text";
        if (value !== undefined) {
            input.value = value;
        }
        if (placeholder !== undefined) {
            input.placeholder = placeholder;
        }
        return input;
    }

    function getExtensionByLanguage(language) {
        if (language === "JS2604" || language === "JS") {
            return ".js";
        } else if (language === "LUA2604") {
            return ".lua";
        } else if (language === "clojure") {
            return ".clj";
        } else if (language === "PFL2605") {
            return ".пфл";
        } else if (language === "OS2605") {
            return ".os";
        } else {
            // Error: Unexpected case value language
            return ".js";
        }
    }

    function isJavaScript(languageCombo) {
        if (languageCombo.value === "JS2604") {
            return true;
        } else if (languageCombo.value === "JS") {
            return true;
        } else {
            return false;
        }
    }

    function onLanguageChanged(arg) {
        var languageCombo = arg.languageCombo;
        var formatCombo = arg.formatCombo;
        var depsDiv = arg.depsDiv;
        var mainDiv = arg.mainDiv;
        var formatDiv = arg.formatDiv;
        
        if (isJavaScript(languageCombo)) {
            formatDiv.style.display = "block";
        } else {
            formatDiv.style.display = "none";
        }
        
        if (languageCombo.value === "clojure") {
            mainDiv.style.display = "block";
        } else {
            mainDiv.style.display = "none";
        }
        
        if (isJavaScript(languageCombo) && formatCombo.value === "unit") {
            depsDiv.style.display = "block";
        } else {
            depsDiv.style.display = "none";
        }
    }

    function onNameChanged(arg) {
        var nameText = arg.nameText;
        var outputText = arg.outputText;
        var languageCombo = arg.languageCombo;
        
        var name = nameText.value;
        var ok = checkIfProjectNameIsValid(name);
        
        if (ok) {
            var extension = getExtensionByLanguage(languageCombo.value);
            outputText.value = "../" + name + extension;
        }
        
        onLanguageChanged(arg);
    }

    function setValue(combobox, value) {
        if (value !== undefined) {
            combobox.value = value;
        }
    }

    function addEventListener(element, event, callback) {
        element.addEventListener(event, callback);
    }

    async function onPathClicked(pathText) {
        var path = await globalOptions.choosePath(pathText.value);
        if (path !== undefined && path !== null) {
            pathText.value = path;
        }
    }

    async function createProject(arg) {
        var path = arg.path;
        var name = arg.name;
        var language = arg.language;
        var error = arg.error;
        var output = arg.output;
        var format = arg.format;
        var deps = arg.deps;
        var mainText = arg.mainText;
        
        error.innerText = "";
        var message = "";
        
        // Check input
        if (output.value === "") {
            message = tr("Output file is not specified");
            error.innerText = message;
            return;
        }
        
        if (path !== undefined && path.value === "") {
            message = tr("Path is not specified");
            error.innerText = message;
            return;
        }
        
        if (name.value === "") {
            message = tr("Name is not specified");
            error.innerText = message;
            return;
        }
        
        if (name.value.length > 50) {
            message = tr("ERR_NAME_TOO_LONG");
            error.innerText = message;
            return;
        }


        if (!checkIfProjectNameIsValid(name.value)) {
            message = tr("Not a valid project name");
            error.innerText = message;
            return;
        }
        
        // Do create project
        var project = {
            path: path.value,
            name: name.value,
            language: language.value,
            outputFile: output.value
        };
        
        if (isJavaScript(language)) {
            project.format = format.value;
            project.dependencies = deps.value;
        } else if (language.value === "clojure") {
            project.mainFun = mainText.value;
        }
        
        var result = await globalOptions.createProject(project);
        
        if (result.ok) {
            closeModalDialog();
            var opened = await globalOptions.openProject(result.projectPath);
            if (!opened.ok) {
                message = tr(opened.error);
                globalOptions.showErrorBar(message);
            }
        } else {
            message = tr(result.error);
            error.innerText = message;
        }
    }

    async function updateProject(arg) {
        var name = arg.name;
        var language = arg.language;
        var error = arg.error;
        var output = arg.output;
        var format = arg.format;
        var deps = arg.deps;
        var mainText = arg.mainText;
        
        error.innerText = "";
        var message = "";
        
        // Check input
        if (output.value === "") {
            message = tr("Output file is not specified");
            error.innerText = message;
            return;
        }
        
        // Do update project
        var project = {
            language: language.value,
            outputFile: output.value
        };
        
        if (isJavaScript(language)) {
            project.format = format.value;
            project.dependencies = deps.value;
        } else if (language.value === "clojure") {
            project.mainFun = mainText.value;
        }
        
        var result = await globalOptions.updateProject(project);
        
        if (result.ok) {
            closeModalDialog();
            var reloaded = await globalOptions.reloadProject();
            if (!reloaded.ok) {
                message = tr(reloaded.error);
                globalOptions.showErrorBar(message);
            }
        } else {
            message = tr(result.error);
            error.innerText = message;
        }
    }

    function showProjectDialog(title, showPath, okName, onOk) {
        var dialog = createModalDialog();
        addTitle(dialog, title);
        
        var pathText = undefined;
        
        // Path
        if (showPath) {
            addSpace(dialog);
            addLabel(dialog, tr("Project path"));
            pathText = createTextInput(globalOptions.path);
            var onPath = bindCallback(onPathClicked, pathText);
            var pathButton = createTextButton(globalOptions.normalButtonClass, "...", onPath);
            var pathBlock = createHorizontalRight(60, pathText, pathButton);
            add(dialog, pathBlock);
        }
        
        // Name
        addSpace(dialog);
        addLabel(dialog, tr("Project name"));
        var nameText = createTextInput(globalOptions.name);
        add(dialog, nameText);
        
        if (!showPath) {
            nameText.readOnly = true;
        }
        
        // Language
        addSpace(dialog);
        addLabel(dialog, tr("Language"));
        var languageCombo = createCombobox();
        add(dialog, languageCombo);
        
        // Language options
        addComboboxOption(languageCombo, "JS2604", "JavaScript");
        addComboboxOption(languageCombo, "JS", "JavaScript — Legacy");
        addComboboxOption(languageCombo, "LUA2604", "Lua");
        addComboboxOption(languageCombo, "clojure", "Clojure");
        addComboboxOption(languageCombo, "PFL2605", "Перфолента");
        addComboboxOption(languageCombo, "OS2605", "OneScript");
        setValue(languageCombo, globalOptions.language || "JS2604");
        
        // Format
        var formatDiv = document.createElement("div");
        addSpace(formatDiv);
        addLabel(formatDiv, tr("Format"));
        var formatCombo = createCombobox();
        add(formatDiv, formatCombo);
        
        addComboboxOption(formatCombo, "CommonJS", "CommonJS — Node JS");
        addComboboxOption(formatCombo, "IIFE", "IIFE — Browser");
        addComboboxOption(formatCombo, "unit", "unit — Browser");
        setValue(formatCombo, globalOptions.format || "CommonJS");
        
        // Output
        addSpace(dialog);
        addLabel(dialog, tr("Output file"));
        var outputText = createTextInput(globalOptions.outputFile);
        add(dialog, outputText);
        
        // Deps
        var depsDiv = document.createElement("div");
        addSpace(depsDiv);
        addLabel(depsDiv, tr("Dependencies"));
        var depsText = document.createElement("textarea");
        depsText.style.resize = "none";
        depsText.style.height = "4em";
        depsText.style.width = "100%";
        depsDiv.appendChild(depsText);
        if (globalOptions.dependencies !== undefined) {
            depsText.value = globalOptions.dependencies;
        }
        
        // Main function
        var mainDiv = document.createElement("div");
        addSpace(mainDiv);
        addLabel(mainDiv, tr("Main function"));
        var mainText = createTextInput(globalOptions.mainFun);
        add(mainDiv, mainText);
        
        // Visibility logic - determine initial visibility
        if (isJavaScript(languageCombo)) {
            formatDiv.style.display = "block";
        } else {
            formatDiv.style.display = "none";
        }
        
        if (languageCombo.value === "clojure") {
            mainDiv.style.display = "block";
        } else {
            mainDiv.style.display = "none";
        }
        
        if (isJavaScript(languageCombo) && formatCombo.value === "unit") {
            depsDiv.style.display = "block";
        } else {
            depsDiv.style.display = "none";
        }
        
        add(dialog, formatDiv);
        add(dialog, depsDiv);
        add(dialog, mainDiv);
        
        var renameContext = {
            nameText: nameText,
            outputText: outputText,
            languageCombo: languageCombo,
            formatCombo: formatCombo,
            formatDiv: formatDiv,
            depsDiv: depsDiv,
            mainDiv: mainDiv
        };
        
        var onName = bindCallback(onNameChanged, renameContext);
        addEventListener(nameText, "input", onName);
        addEventListener(languageCombo, "change", onName);
        
        var onFormat = bindCallback(onNameChanged, renameContext);
        addEventListener(formatCombo, "change", onFormat);
        
        // Error area
        var errorArea = createErrorArea();
        
        var createProjectArgument = {
            path: pathText,
            name: nameText,
            language: languageCombo,
            error: errorArea,
            output: outputText,
            format: formatCombo,
            deps: depsText,
            mainText: mainText
        };
        
        var createAction = bindCallback(onOk, createProjectArgument);
        
        addSpace(dialog);
        var createButton = createTextButton(globalOptions.defaultButtonClass, okName, createAction);
        add(dialog, createButton);
        
        addSpace(dialog);
        var cancelButton = createTextButton(globalOptions.normalButtonClass, tr("Cancel"), closeModalDialog);
        add(dialog, cancelButton);
        
        addSpace(dialog);
        add(dialog, errorArea);
        
        onLanguageChanged(renameContext);
        nameText.focus();
    }

    function showCreateProjectDialog(options) {
        globalOptions = options;
        showProjectDialog(tr("Create a new project"), true, tr("Create"), createProject);
    }

    function showProjectPropertiesDialog(options) {
        globalOptions = options;
        showProjectDialog(tr("Project properties"), false, tr("MES_SAVE"), updateProject);
    }

    // Export functions to window
    window.showCreateProjectDialog = showCreateProjectDialog;
    window.showProjectPropertiesDialog = showProjectPropertiesDialog;
})();