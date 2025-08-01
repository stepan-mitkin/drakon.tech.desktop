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
            main.style.width = "700px"
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
    var editor;
    if (cmOptions) {
        editor = make(main, "textarea")
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
        globs.editor = createPlainTextEditor(
            main,
            Config.EDITOR_FONT,
            "14px",
            oldText
        )
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

function createPlainTextEditor(parent, fontFamily, fontSize, oldText) {
    var editor = make(parent, "textarea")
    editor.style.tabSize = 4
    editor.style.fontSize = fontSize
    editor.style.fontFamily = fontFamily
    editor.className = "mousetrap"
    editor.style.boxSizing = "border-box"
    editor.style.resize = "none"
    editor.style.outline = "none"
    editor.style.width = "100%"
    editor.style.padding = "10px"
    editor.style.border = "none"
    editor.style.height = "300px"
    editor.style.margin = "0px"
    editor.style.borderBottom = "solid 1px #707070"
    editor.style.verticalAlign = "top"
    editor.value = oldText
    editor.spellcheck = false
    editor.onfocus = fixIPadKeyboard
    var getValue = function() {
        return {
            selectionStart: editor.selectionStart,
            selectionEnd: editor.selectionEnd,
            value: editor.value
        }
    }
    var setValue = function(value) {
        editor.value = value.value
        editor.selectionStart = value.selectionStart
        editor.selectionEnd = value.selectionEnd
    }
    var widget = {
        textarea: editor,
        buffer: createUndoBuffer(getValue, setValue)        
    }
    editor.onkeydown = (evt) => onEditorKeyDown(widget, evt)
    editor.oninput = () => onEditorInput(widget)
    editor.onselectionchange = () => onEditorSelectionChange(widget)

    return editor
}

function onEditorSelectionChange(widget) {
    widget.buffer.recordLatestState()
}

function createUndoBuffer(getValue, setValue) {
    let currentIndex = 0;
    let latestState = getValue()
    let history = [createHistoryItem(latestState, latestState)]

    function createHistoryItem(before, after) {
        return {
            before,
            after
        }
    }
  
    function undoEdit() {
      if (currentIndex > 0) {
        currentIndex--;
        setValue(history[currentIndex].before);
      }
    }
  
    function redoEdit() {
      if (currentIndex < history.length - 1) {
        currentIndex++;
        setValue(history[currentIndex].after);
      }
    }
  
    function recordUndoAction() {
      const currentValue = getValue();
      // Truncate history after current index (discards redo states)
      history = history.slice(0, currentIndex + 1);
      // Append new state
      var item = createHistoryItem(latestState, currentValue)
      history.push(item);
      currentIndex++;
    }

    function recordLatestState() {
        latestState = getValue()
    }
  
    return {
      recordLatestState,
      undoEdit,
      redoEdit,
      recordUndoAction
    };
}

function onEditorKeyDown(widget, evt) {
    if (((evt.keyCode == 9) || (evt.key == "Tab")) || (evt.which == 9)) {
        evt.preventDefault();
        if (evt.shiftKey) {
            onUnTab(evt)
        } else {
            onTab(evt)
        }        
        widget.buffer.recordUndoAction()    
    } else if (evt.key === "z" && (evt.metaKey || evt.ctrlKey)) {
        evt.preventDefault()
        widget.buffer.undoEdit()
    } else if (evt.key === "y" && (evt.metaKey || evt.ctrlKey)) {
        evt.preventDefault()
        widget.buffer.redoEdit()
    }
}

function onEditorInput(widget) {
    widget.buffer.recordUndoAction() 
}

function fixIPadKeyboard() {
    if (window.scrollTo) {
        window.scrollTo(0, 0)
    }
    document.body.scrollTop = 0
    document.body.scrollLeft = 0
}

function hide() {
    globs = {}
    HtmlUtils.hidePopup()
    fixIPadKeyboard()
}




function onTab(evt) {
    const textarea = evt.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;

    if (start !== end) {
        // Text is selected
        // Find the start of the first selected line
        let lineStart = start;
        while (lineStart > 0 && value[lineStart - 1] !== '\n') {
            lineStart--;
        }
        
        // Find the end of the last selected line
        let lineEnd = end;
        while (lineEnd < value.length && value[lineEnd] !== '\n') {
            lineEnd++;
        }
        
        // Get the full lines that include the selection
        const selectedText = value.substring(lineStart, lineEnd);
        const lines = selectedText.split('\n');
        const indentedLines = lines.map(line => '\t' + line);
        const newText = indentedLines.join('\n');
        
        // Replace the full lines with indented versions
        textarea.value = value.substring(0, lineStart) + newText + value.substring(lineEnd);
        
        // Update selection to cover the same lines
        textarea.selectionStart = lineStart;
        textarea.selectionEnd = lineStart + newText.length;
    } else {
        // No text selected, insert tab at caret
        const before = value.substring(0, start);
        const after = value.substring(start);
        textarea.value = before + '\t' + after;
        
        // Move caret after tab
        textarea.selectionStart = textarea.selectionEnd = start + 1;
    }
}

function onUnTab(evt) {
    const textarea = evt.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    let lines, lineStart, lineEnd;

    if (start !== end) {
        // Text is selected
        // Find the start of the first selected line
        lineStart = start;
        while (lineStart > 0 && value[lineStart - 1] !== '\n') {
            lineStart--;
        }
        
        // Find the end of the last selected line
        lineEnd = end;
        while (lineEnd < value.length && value[lineEnd] !== '\n') {
            lineEnd++;
        }
        
        // Get the full lines that include the selection
        const selectedText = value.substring(lineStart, lineEnd);
        lines = selectedText.split('\n');
    } else {
        // No text selected, get the current line
        lineStart = start;
        while (lineStart > 0 && value[lineStart - 1] !== '\n') {
            lineStart--;
        }
        
        lineEnd = start;
        while (lineEnd < value.length && value[lineEnd] !== '\n') {
            lineEnd++;
        }
        
        lines = [value.substring(lineStart, lineEnd)];
    }
    
    // Process each line to remove indentation
    const unindentedLines = lines.map(line => {
        if (line.startsWith('\t')) {
            return line.substring(1);
        } else {
            // Count leading spaces
            let spaces = 0;
            while (spaces < line.length && line[spaces] === ' ') {
                spaces++;
            }
            
            // Strip leading spaces and calculate tabs
            const value = line.substring(spaces);
            const tabs = Math.ceil(spaces / 4);
            const newTabs = Math.max(tabs - 1, 0);
            
            // Create new indentation with tabs
            return '\t'.repeat(newTabs) + value;
        }
    });
    
    const newText = unindentedLines.join('\n');
    
    // Replace the affected lines
    textarea.value = value.substring(0, lineStart) + newText + value.substring(lineEnd);
    
    if (start === end) {
        // Adjust caret position for single line case
        const newCaretPos = lineStart + unindentedLines[0].length;
        textarea.selectionStart = textarea.selectionEnd = newCaretPos;
    } else {
        // Adjust selection for multi-line case
        textarea.selectionStart = lineStart;
        textarea.selectionEnd = lineStart + newText.length;
    }
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
