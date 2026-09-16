(function() {
main();
function App(containerId) {
    var self = { _type: 'App' };
    function clickItem(id) {
        self.currentId = id;
        render();
    }
    function init() {
        var container;
        container = get(containerId);
        container.innerHTML = '';
        add(container, textDiv('Loading...'));
    }
    function renameCurrent() {
        var item, newValue;
        if (self.currentId) {
            newValue = self.nameInput.value.trim();
            if (newValue) {
                item = findByProperty(self.items, 'id', self.currentId);
                item.text = newValue;
                render();
            }
        }
    }
    function render() {
        var _collection_2, container, item, itemDiv, renameDiv;
        container = get(containerId);
        container.innerHTML = '';
        self.nameInput = createTextInput();
        renameDiv = createHorContainer(self.nameInput, createButton('Rename', renameCurrent));
        add(container, renameDiv);
        _collection_2 = self.items;
        for (item of _collection_2) {
            itemDiv = add(container, createListItem(item.text));
            if (item.id === self.currentId) {
                markAsSelected(itemDiv);
                self.nameInput.value = item.text;
            }
            addDomEvent(itemDiv, 'click', item.id, clickItem);
        }
    }
    function setList(items) {
        self.items = items;
        self.currentId = undefined;
        render();
    }
    self.init = init;
    self.setList = setList;
    return self;
}
function add(parent, child) {
    parent.appendChild(child);
    return child;
}
function addDomEvent(element, eventName, arg, listener) {
    var callback;
    callback = evt => listener(arg, evt);
    element.addEventListener(eventName, callback);
}
function createButton(text, callback) {
    var butt;
    butt = createElement([
        'button',
        'btn',
        { text: 'Rename' }
    ]);
    addDomEvent(butt, 'click', undefined, callback);
    return butt;
}
function createElement(args) {
    var className, element, i, key, style, tag, text, value;
    tag = args[0];
    element = document.createElement(tag);
    className = args[1];
    style = args[2];
    if (className) {
        element.className = className;
    }
    if (style) {
        text = undefined;
        for (key in style) {
            value = style[key];
            if (key === 'text') {
                text = value;
            } else {
                element.style[key] = value;
            }
        }
        if (text) {
            element.innerText = text;
        }
    }
    for (i = 3; i < args.length; i++) {
        add(element, args[i]);
    }
    return element;
}
function createHorContainer() {
    var args, i;
    args = [
        'div',
        undefined,
        undefined
    ];
    for (i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }
    return createElement(args);
}
function createListItem(text) {
    return createElement([
        'div',
        'list-item',
        { text: text }
    ]);
}
function createTextInput() {
    var input;
    input = createElement(['input']);
    input.type = 'text';
    return input;
}
function findByProperty(array, property, value) {
    var actual, item;
    for (item of array) {
        actual = item[property];
        if (actual === value) {
            return item;
        }
    }
    return undefined;
}
function get(id) {
    return document.getElementById(id);
}
async function main() {
    var app, items;
    app = App('main');
    app.init();
    await pause(500);
    items = [
        {
            id: '1',
            text: 'Én'
        },
        {
            id: '2',
            text: 'To'
        },
        {
            id: '3',
            text: 'Tre'
        },
        {
            id: '4',
            text: 'Fire'
        },
        {
            id: '5',
            text: 'Fem'
        }
    ];
    app.setList(items);
    console.log('main completed');
}
function markAsSelected(itemDiv) {
    itemDiv.style.background = '#c0d0ff';
}
function pause(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}
function textDiv(text) {
    var args;
    args = [
        'div',
        undefined,
        { text: text }
    ];
    return createElement(args);
}
})();