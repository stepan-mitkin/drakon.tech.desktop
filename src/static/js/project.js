(function() {
    "use strict";

    var globalOptions;

    function clear(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    function setValue(combobox, value) {
        combobox.value = value;
    }

    function addEventListener(element, event, callback) {
        element.addEventListener(event, callback);
    }

    function add(container, element) {
        container.appendChild(element);
    }

    function addComboboxOption(combo, value, text) {
        var option = document.createElement("option");
        option.value = value;
        option.innerText = text;
        add(combo, option);
    }

    function addLabel(parent, text) {
        var div = document.createElement("div");
        parent.appendChild(div);
        div.innerText = text;
    }

    function addSpace(element) {
        var div = document.createElement("div");
        element.appendChild(div);
        div.style.height = "20px";
    }

    function addTitle(container, text) {
        var h2 = document.createElement("h2");
        container.appendChild(h2);
        h2.innerText = text;
    }

    function bindCallback(action, argument) {
        return async function(evt) {
            await action(argument, evt);
        };
    }

    function checkIfProjectNameIsValid(name) {
        var re_forbidden;
        var re_punctuation;

        if (!name) {
            return false;
        }

        if (/\s/.test(name)) {
            return false;
        }

        re_forbidden = /[\/\\:*?"<>|\x00]/;
        if (re_forbidden.test(name)) {
            return false;
        }

        re_punctuation = /[!"#$%&'()*+,\-.\/:;<=>?@[\\\]^_`{|}~]/;
        if (re_punctuation.test(name)) {
            return false;
        }

        return true;
    }

    function closeModalDialog() {
        var central = document.getElementById("central");
        clear(central);
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
        var central;
        var background;
        var dialog;

        central = document.getElementById("central");
        central.style.display = "block";
        clear(central);

        background = document.createElement("div");
        central.appendChild(background);

        background.style.background = "rgba(0, 0, 0, 0.5)";
        background.style.overflow = "hidden";
        background.style.position = "fixed";
        background.style.left = "0";
        background.style.top = "0";
        background.style.width = "100%";
        background.style.height = "100%";

        dialog = document.createElement("div");
        background.appendChild(dialog);

        dialog.style.background = "white";
        dialog.style.width = "500px";
        dialog.style.maxWidth = "100%";
        dialog.style.marginLeft = "auto";
        dialog.style.marginRight = "auto";
        dialog.style.marginTop = "0";
        dialog.style.overflowY = "auto";
        dialog.style.padding = "20px";

        dialog.classList.add("pp-central-dialog");

        return dialog;
    }

    async function createProject(arg) {
        var path;
        var name;
        var language;
        var error;
        var output;
        var format;
        var message;
        var project;
        var result;
        var opened;

        path = arg.path;
        name = arg.name;
        language = arg.language;
        error = arg.error;
        output = arg.output;
        format = arg.format;

        error.innerText = "";

        if (!output.value) {
            message = tr("Output file is not specified");
            error.innerText = message;
            return;
        }

        if (!path.value) {
            message = tr("Path is not specified");
            error.innerText = message;
            return;
        }

        if (!name.value) {
            message = tr("Name is not specified");
            error.innerText = message;
            return;
        }

        if (!checkIfProjectNameIsValid(name.value)) {
            message = tr("Not a valid project name");
            error.innerText = message;
            return;
        }

        project = {
            path: path.value,
            name: name.value,
            language: language.value,
            output: output.value
        };

        if (language.value == "JS2604") {
            project.format = format.value;
        }

        result = await globalOptions.createProject(project);

        if (result.ok) {
            closeModalDialog();

            opened = await globalOptions.openProject(result.projectPath);
            if (!opened.ok) {
                message = tr(opened.error);
                globalOptions.showErrorBar(message);
            }
        } else {
            message = tr(result.error);
            error.innerText = message;
        }
    }

    function createTextButton(className, text, action) {
        var div = document.createElement("div");
        div.innerText = text;
        div.className = className;
        addEventListener(div, "click", action);
        return div;
    }

    function createTextInput(value, placeholder) {
        var input = document.createElement("input");
        input.type = "text";

        if (value) {
            input.value = value;
        }

        if (placeholder) {
            input.placeholder = placeholder;
        }

        return input;
    }

    function getExtensionByLanguage(language) {
        if ((language == "JS2604") || (language == "JS")) {
            return ".js";
        } else {
            if (language == "LUA2604") {
                return ".lua";
            } else {
                if (language == "clojure") {
                    return ".clj";
                } else {
                    if (language == "PFL2605") {
                        return ".пфл";
                    } else {
                        if (!(language == "OS2605")) {
                            throw "Unexpected case value: " + language;
                        }
                        return ".os";
                    }
                }
            }
        }
    }

    function onLanguageChanged(arg) {
        var outputText;
        var languageCombo;
        var formatDiv;
        var name;
        var extension;

        outputText = arg.outputText;
        languageCombo = arg.languageCombo;
        formatDiv = arg.formatDiv;

        name = globalOptions.name;
        extension = getExtensionByLanguage(languageCombo.value);
        outputText.value = "../" + name + extension;

        if (languageCombo.value == "JS2604") {
            formatDiv.style.display = "block";
        } else {
            formatDiv.style.display = "none";
        }
    }

    function onNameChanged(arg) {
        var nameText;
        var outputText;
        var languageCombo;
        var formatDiv;
        var name;
        var ok;
        var extension;

        nameText = arg.nameText;
        outputText = arg.outputText;
        languageCombo = arg.languageCombo;
        formatDiv = arg.formatDiv;

        name = nameText.value;
        ok = checkIfProjectNameIsValid(name);

        if (ok) {
            extension = getExtensionByLanguage(languageCombo.value);
            outputText.value = "../" + name + extension;

            if (languageCombo.value == "JS2604") {
                formatDiv.style.display = "block";
            } else {
                formatDiv.style.display = "none";
            }
        }
    }

    async function onPathClicked(pathText) {
        var path = await globalOptions.choosePath(pathText.value);

        if (path) {
            pathText.value = path;
        }
    }

    function showCreateProjectDialog(options) {
        globalOptions = options;

        showProjectDialog(
            tr("Create a new project"),
            true,
            tr("Create"),
            createProject,
            onNameChanged
        );
    }

    function showProjectDialog(title, showPath, okName, onOk, onChange) {
        var dialog;
        var pathText;
        var onPath;
        var pathButton;
        var pathBlock;
        var nameText;
        var languageCombo;
        var formatDiv;
        var formatCombo;
        var outputText;
        var renameContext;
        var onName;
        var errorArea;
        var createProjectArgument;
        var createAction;
        var createButton;
        var cancelButton;

        dialog = createModalDialog();
        addTitle(dialog, title);

        if (showPath) {
            addSpace(dialog);
            addLabel(dialog, tr("Project path"));

            pathText = createTextInput(globalOptions.path);

            onPath = bindCallback(onPathClicked, pathText);

            pathButton = createTextButton(
                globalOptions.normalButtonClass,
                "...",
                onPath
            );

            pathBlock = createHorizontalRight(
                60,
                pathText,
                pathButton
            );

            add(dialog, pathBlock);
        } else {
            pathText = undefined;
        }

        addSpace(dialog);
        addLabel(dialog, tr("Project name"));

        nameText = createTextInput(globalOptions.name);
        add(dialog, nameText);

        addSpace(dialog);
        addLabel(dialog, tr("Language"));

        languageCombo = createCombobox();
        add(dialog, languageCombo);

        addComboboxOption(languageCombo, "JS2604", "JavaScript");
        addComboboxOption(languageCombo, "LUA2604", "Lua");
        addComboboxOption(languageCombo, "clojure", "Clojure");
        addComboboxOption(languageCombo, "PFL2605", "Перфолента");
        addComboboxOption(languageCombo, "OS2605", "OneScript");

        setValue(languageCombo, globalOptions.language || "JS2604");

        formatDiv = document.createElement("div");
        dialog.appendChild(formatDiv);

        addSpace(formatDiv);
        addLabel(formatDiv, tr("Format"));

        formatCombo = createCombobox();
        add(formatDiv, formatCombo);

        addComboboxOption(formatCombo, "CommonJS", "CommonJS — Node JS");
        addComboboxOption(formatCombo, "IIFE", "IIFE — Browser");
        addComboboxOption(formatCombo, "unit", "unit — Browser");

        setValue(formatCombo, globalOptions.format || "CommonJS");

        addSpace(dialog);
        addLabel(dialog, tr("Output file"));

        outputText = createTextInput(globalOptions.output);
        add(dialog, outputText);

        renameContext = {
            nameText: nameText,
            outputText: outputText,
            languageCombo: languageCombo,
            formatDiv: formatDiv,
            formatCombo: formatCombo
        };

        onName = bindCallback(onChange, renameContext);

        addEventListener(nameText, "input", onName);
        addEventListener(languageCombo, "change", onName);

        errorArea = createErrorArea();

        createProjectArgument = {
            path: pathText,
            name: nameText,
            language: languageCombo,
            error: errorArea,
            output: outputText,
            format: formatCombo
        };

        createAction = bindCallback(onOk, createProjectArgument);

        addSpace(dialog);

        createButton = createTextButton(
            globalOptions.defaultButtonClass,
            okName,
            createAction
        );

        add(dialog, createButton);

        addSpace(dialog);

        cancelButton = createTextButton(
            globalOptions.normalButtonClass,
            tr("Cancel"),
            closeModalDialog
        );

        add(dialog, cancelButton);

        addSpace(dialog);
        add(dialog, errorArea);

        onChange(renameContext);

        nameText.focus();
    }

    function showProjectPropertiesDialog(options) {
        globalOptions = options;

        showProjectDialog(
            tr("Project properties"),
            false,
            tr("Update"),
            updateProject,
            onLanguageChanged
        );
    }

    function tr(text) {
        return globalOptions.translate(text);
    }

    async function updateProject(arg) {
        var name;
        var language;
        var error;
        var output;
        var format;
        var message;
        var project;
        var result;
        var reloaded;

        name = arg.name;
        language = arg.language;
        error = arg.error;
        output = arg.output;
        format = arg.format;

        error.innerText = "";

        if (!output.value) {
            message = tr("Output file is not specified");
            error.innerText = message;
            return;
        }

        if (!name.value) {
            message = tr("Name is not specified");
            error.innerText = message;
            return;
        }

        if (!checkIfProjectNameIsValid(name.value)) {
            message = tr("Not a valid project name");
            error.innerText = message;
            return;
        }

        project = {
            name: name.value,
            language: language.value,
            output: output.value
        };

        if (language.value == "JS2604") {
            project.format = format.value;
        }

        result = await globalOptions.updateProject(project);

        if (result.ok) {
            closeModalDialog();

            reloaded = await globalOptions.reloadProject();
            if (!reloaded.ok) {
                message = tr(reloaded.error);
                globalOptions.showErrorBar(message);
            }
        } else {
            message = tr(result.error);
            error.innerText = message;
        }
    }

    window.showCreateProjectDialog = showCreateProjectDialog;
    window.showProjectPropertiesDialog = showProjectPropertiesDialog;
}());