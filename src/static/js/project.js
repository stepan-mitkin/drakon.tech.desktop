(function () {
    var globalOptions = undefined;

    function add(container, element) {
        container.appendChild(element);
    }

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

    function addComboboxOption(combo, value, text) {
        var option = document.createElement("option");
        option.value = value;
        option.text = text;
        add(combo, option);
    }

    function addLabel(parent, text) {
        var div = document.createElement("div");
        add(parent, div);
        div.innerText = text;
    }

    function addSpace(element) {
        var div = document.createElement("div");
        add(element, div);
        div.style.height = "20px";
    }

    function addTitle(container, text) {
        var h2 = document.createElement("h2");
        add(container, h2);
        h2.innerText = text;
    }

    function bindCallback(action, argument) {
        return function (evt) {
            action(argument, evt);
        };
    }

    function checkIfProjectNameIsValid(name) {
        if (!name) {
            return false;
        }
        if (/\s/.test(name)) {
            return false;
        }
        if (/[<>:"/\\|?*\x00-\x1F]/.test(name)) {
            return false;
        }
        if (/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~-]/.test(name)) {
            return false;
        }
        return true;
    }

    function closeModalDialog() {
        var central = document.getElementById("central");
        clear(central);
    }

    function createCombobox() {
        return document.createElement("select");
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
        container.style.whiteSpace = "nowrap"

        right.style.marginLeft = "5px"
        right.style.width = rightWidth + "px";
        right.style.minWidth = rightWidth + "px";
        left.style.width = "calc(100% - " + (rightWidth + 5) + "px)";

        return container;
    }

    function createModalDialog() {
        var central = document.getElementById("central");
        central.style.display = "block"
        clear(central);

        var background = document.createElement("div");
        add(central, background);

        background.style.background = "rgba(0, 0, 0, 0.5)";
        background.style.overflow = "hidden";
        background.style.position = "fixed";
        background.style.left = "0";
        background.style.top = "0";
        background.style.right = "0";
        background.style.bottom = "0";

        var dialog = document.createElement("div");
        add(background, dialog);

        dialog.style.background = "white";
        dialog.style.width = "500px";
        dialog.style.maxWidth = "100vw";
        dialog.style.marginLeft = "auto";
        dialog.style.marginRight = "auto";
        dialog.style.marginTop = "0";
        dialog.style.overflowY = "auto";
        dialog.style.padding = "20px";
        dialog.classList.add("pp-central-dialog");

        return dialog;
    }

    async function createProject(arg) {
        var path = arg.path;
        var name = arg.name;
        var language = arg.language;
        var error = arg.error;
        var output = arg.output;
        var message;
        var project;
        var result;
        var opened;

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
        div.addEventListener("click", action);
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
        if (language === "JS2604" || language === "JS") {
            return ".js";
        }

        if (language === "LUA2604") {
            return ".lua";
        }

        if (language === "clojure") {
            return ".clj";
        }

        if (language === "PFL2605") {
            return ".пфл";
        }

        if (language !== "OS2605") {
            throw new Error("Unexpected case value: " + language);
        }

        return ".os";
    }

    function onNameChanged(arg) {
        var nameText = arg.nameText;
        var outputText = arg.outputText;
        var languageCombo = arg.languageCombo;
        var name = nameText.value;
        var ok = checkIfProjectNameIsValid(name);
        var extension;

        if (ok) {
            extension = getExtensionByLanguage(languageCombo.value);
            outputText.value = "../" + name + extension;
        }
    }

    async function onPathClicked(pathText) {
        var path = await globalOptions.choosePath(pathText.value);

        if (path) {
            pathText.value = path;
        }
    }

    function showCreateProjectDialog(options) {
        var dialog;
        var pathText;
        var onPath;
        var pathButton;
        var pathBlock;
        var nameText;
        var languageCombo;
        var outputText;
        var renameContext;
        var onName;
        var errorArea;
        var createProjectArgument;
        var createAction;
        var createButton;
        var cancelButton;

        globalOptions = options;

        dialog = createModalDialog();
        addTitle(dialog, tr("Create a new project"));

        addSpace(dialog);
        addLabel(dialog, tr("Project path"));
        pathText = createTextInput(options.path);
        onPath = bindCallback(onPathClicked, pathText);
        pathButton = createTextButton(
            globalOptions.normalButtonClass,
            "...",
            onPath
        );
        pathBlock = createHorizontalRight(60, pathText, pathButton);
        add(dialog, pathBlock);

        addSpace(dialog);
        addLabel(dialog, tr("Project name"));
        nameText = createTextInput();
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
        setValue(languageCombo, "JS2604");

        addSpace(dialog);
        addLabel(dialog, tr("Output file"));
        outputText = createTextInput();
        add(dialog, outputText);

        renameContext = {
            nameText: nameText,
            outputText: outputText,
            languageCombo: languageCombo
        };
        onName = bindCallback(onNameChanged, renameContext);
        addEventListener(nameText, "input", onName);
        addEventListener(languageCombo, "change", onName);

        errorArea = createErrorArea();

        createProjectArgument = {
            path: pathText,
            name: nameText,
            language: languageCombo,
            error: errorArea,
            output: outputText
        };
        createAction = bindCallback(createProject, createProjectArgument);

        addSpace(dialog);
        createButton = createTextButton(
            globalOptions.defaultButtonClass,
            tr("Create"),
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
        nameText.focus();
    }

    function showProjectPropertiesDialog(options) {
        var dialog;
        var nameText;
        var languageCombo;
        var outputText;
        var renameContext;
        var onName;
        var errorArea;
        var updateProjectArgument;
        var updateAction;
        var updateButton;
        var cancelButton;

        globalOptions = options;

        dialog = createModalDialog();
        addTitle(dialog, tr("Project properties"));

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
        setValue(languageCombo, globalOptions.language);

        addSpace(dialog);
        addLabel(dialog, tr("Output file"));
        outputText = createTextInput(globalOptions.output);
        add(dialog, outputText);

        renameContext = {
            nameText: nameText,
            outputText: outputText,
            languageCombo: languageCombo
        };
        onName = bindCallback(onNameChanged, renameContext);
        addEventListener(nameText, "input", onName);
        addEventListener(languageCombo, "change", onName);

        errorArea = createErrorArea();

        updateProjectArgument = {
            name: nameText,
            language: languageCombo,
            error: errorArea,
            output: outputText
        };
        updateAction = bindCallback(updateProject, updateProjectArgument);

        addSpace(dialog);
        updateButton = createTextButton(globalOptions.defaultButtonClass, tr("Update"), updateAction);
        add(dialog, updateButton);

        addSpace(dialog);
        cancelButton = createTextButton(globalOptions.normalButtonClass, tr("Cancel"), closeModalDialog);
        add(dialog, cancelButton);

        addSpace(dialog);
        add(dialog, errorArea);
        nameText.focus();
    }

    function tr(text) {
        return globalOptions.translate(text);
    }

    async function updateProject(arg) {
        var name = arg.name;
        var language = arg.language;
        var error = arg.error;
        var output = arg.output;
        var message;
        var project;
        var result;
        var reloaded;

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