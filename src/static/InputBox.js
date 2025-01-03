function InputBoxModule(window, document) {

var Font = "Cousine"
var HeaderHeight = 30
var Padding = 2
var DarkBackground = "#455A64"
var BorderRadius = "3px"
var NormalBack = "linear-gradient(#758A94, #455A64)"
var SpecialBack = "linear-gradient(coral, #CD5B45)"
var globs = {}

// Autogenerated with DRAKON Editor 1.33


function buildWindow(headerText, oldText, cmOptions) {
    var main = HtmlUtils.createPopup(null, true)
    main.className = "popup"
    main.style.background = "white"
    if (HtmlUtils.isMobile()) {
        main.style.minWidth = "200px"
        main.style.width = "100%"
    } else {
        if (cmOptions) {
            main.style.width = "700px"
            main.style.maxWidth = "100vw"
        } else {
            main.style.minWidth = "200px"
            main.style.width = "500px"
        }
    }
    HtmlUtils.makePopupModal()
    //HtmlUtils.noContext(main)
    var winTitle = makeWindowTitle(
    	main,
    	headerText
    )
    var img = winTitle.cross
    img.onclick = hide
    var client = make(main, "div")
    var error = make(main, "div")
    globs.error = error
    error.style.background = "yellow"
    error.style.padding = "3px"
    error.style.display = "none"
    var editor = make(main, "textarea")
    editor.style.fontSize = "14px"
    editor.style.fontFamily = Config.EDITOR_FONT
    editor.className = "mousetrap"
    editor.style.boxSizing = "border-box"
    editor.style.resize = "none"
    editor.style.outline = "none"
    editor.style.width = "100%"
    editor.style.padding = "10px"
    editor.style.border = "none"
    editor.style.height = "180px"
    editor.style.margin = "0px"
    editor.style.borderBottom = "solid 1px #707070"
    editor.style.verticalAlign = "top"
    if (cmOptions) {
        editor.style.height = "400px"
        var cm = CodeMirror.fromTextArea(editor, {
            indentUnit: 4,
            lineWrapping: true,
            mode: cmOptions.mode,
            theme: cmOptions.theme
        });
        cm.setValue(oldText)
        cm.on("keydown", onCrmKeyDown)
        globs.cm = cm
    } else {
        globs.editor = editor
        editor.value = oldText
        editor.spellcheck = false
        editor.onfocus = fixIPadKeyboard
        editor.onkeydown = handleTab
    }
    var panel = make(main, "div")
    panel.style.height = "40px"
    var butts = make(panel, "div")
    butts.style.display = "inline-block"
    butts.style["float"] = "right"
    var save = make(butts, "div")
    setButtonStyle(
    	save,
    	"white",
    	SpecialBack,
    	"6px"
    )
    HtmlUtils.setDivText(
    	save,
    	translate("MES_SAVE")
    )
    var cancel = make(butts, "div")
    setButtonStyle(
    	cancel,
    	"white",
    	NormalBack,
    	"6px"
    )
    HtmlUtils.setDivText(
    	cancel,
    	translate("MES_CANCEL")
    )
    save.onclick = onSave
    cancel.onclick = hide
    return main
}

function fixIPadKeyboard() {
    if (window.scrollTo) {
        window.scrollTo(0, 0)
    }
    document.body.scrollTop = 0
    document.body.scrollLeft = 0
}

function handleTab(evt) {
    if (((evt.keyCode == 9) || (evt.key == "Tab")) || (evt.which == 9)) {
        insertTab(this, evt)
    }
}

function hide() {
    globs = {}
    HtmlUtils.hidePopup()
    fixIPadKeyboard()
}

function insertTab(edit, evt) {
    evt.preventDefault();
    var s = edit.selectionStart;
    edit.value = edit.value.substring(0,edit.selectionStart) + "\t" + edit.value.substring(edit.selectionEnd);
    edit.selectionEnd = s+1;
}

function isVisible() {
    return !!globs.visible
}

function make(parent, tag) {
    var element = document.createElement(tag)
    parent.appendChild(element)
    //element.ontouchstart = prevent
    //element.ontouchmove = prevent
    //element.ontouchend = prevent
    return element
}

function makeImagePath(image) {
    return "static/images/" + image
}

function makeWindowTitle(main, headerText) {
    var header = make(main, "table")
    header.style.background = DarkBackground
    header.style.height = HeaderHeight + "px"
    header.style.width = "100%"
    var tr = make(header, "tr")
    var headerTd = make(tr, "td")
    headerTd.style.verticalAlign = "center"
    headerTd.style.color = "white"
    headerTd.style.paddingLeft = "3px"
    HtmlUtils.setDivText(headerTd, headerText)
    var imgTd = make(tr, "td")
    imgTd.style.width = HeaderHeight + "px"
    var img = make(imgTd, "img")
    img.draggable = false
    img.src = makeImagePath("cross.png")
    img.width = HeaderHeight
    img.height = HeaderHeight
    var style = img.style
    img.className = "common_button"
    style.cursor = "pointer"
    style.display = "inline-block"
    style["float"] = "right"
    return {
    	header: headerTd,
    	cross: img
    }
}

function moveCursorToEnd(textarea) {
    var length = textarea.value.length
    textarea.setSelectionRange(
    	length,
    	length
    )
}

function onCrmKeyDown(a, evt, c) {
    if (evt.key === "Enter") {
        if (evt.ctrlKey || evt.metaKey) {
            evt.preventDefault()
            onSave()
        }
    } else {
        if (evt.key === "Escape") {
            evt.preventDefault()
            hide()
        }
    }
}

function onSave() {
    var text
    if (globs.editor) {
        text = globs.editor.value
    } else {
        text = globs.cm.getValue()
    }
    if (globs.validator) {
        var message = globs.validator(text)
        if (message) {
            showError(message)
        } else {
            globs.callback(text)
            if (globs.isAsync) {
                
            } else {
                hide()
            }
        }
    } else {
        globs.callback(text)
        if (globs.isAsync) {
            
        } else {
            hide()
        }
    }
}

function setButtonStyle(div, color, background, padding) {
    var style = div.style
    div.className = "common_button"
    HtmlUtils.noContext(div)
    style.cursor = "pointer"
    style.display = "inline-block"
    style.color = color
    style.background = background
    style.padding = padding
    style.borderRadius = BorderRadius
    style.marginTop = "7px"
    style.marginRight = "7px"
}

function setError(text) {
    showError(text)
}

function show(isAsync, header, text, callback, validator, x, y, cmOptions) {
    globs.callback = callback
    globs.validator = validator
    globs.visible = true
    globs.isAsync = isAsync
    var win = buildWindow(header, text, cmOptions)
    globs.main = win
    if (HtmlUtils.isMobile()) {
        HtmlUtils.setPosCorrected(
        	0,
        	0,
        	win
        )
    } else {
        if ((x === undefined) || (y === undefined)) {
            HtmlUtils.showAtCenter(
            	win
            )
        } else {
            HtmlUtils.setPosCorrected(
            	x,
            	y,
            	win
            )
        }
        HtmlUtils.setUpMovable(win, HeaderHeight)
    }
    if (globs.editor) {
        moveCursorToEnd(globs.editor)
        globs.editor.focus()
    } else {
        globs.cm.focus()
    }
}

function showError(text) {
    globs.main.style.height = null
    globs.error.style.display = "block"
    HtmlUtils.setDivText(globs.error, text)
}

function submit() {
    onSave()
}


this.show = show
this.hide = hide
this.isVisible = isVisible
this.setError = setError
this.submit = submit
this.makeWindowTitle = makeWindowTitle
}

InputBox = new InputBoxModule(window, document)
