main();
function add(parent, child) {
    parent.appendChild(child);
}
function addElement(tag, text) {
    var container, element;
    container = get('playground');
    element = document.createElement(tag);
    addText(element, text);
    add(container, element);
}
function addNode(list, value) {
    var head, node;
    node = { value: value };
    head = list.head;
    node.next = head;
    list.head = node;
}
function addPar(text) {
    addElement('p', text);
}
function addSpacer() {
    var container, element;
    container = get('playground');
    element = document.createElement('div');
    element.style.height = '50px';
    add(container, element);
}
function addSubheader(name) {
    addElement('h3', name);
}
function addText(element, text) {
    var newNode;
    newNode = document.createTextNode(text);
    element.appendChild(newNode);
}
function clear(node) {
    while (true) {
        if (node.firstChild) {
            node.removeChild(node.lastChild);
        } else {
            break;
        }
    }
}
function copyList(src) {
    var dst, node;
    dst = createLinkedList();
    node = src.head;
    while (true) {
        if (node) {
            addNode(dst, node.value);
            node = node.next;
        } else {
            break;
        }
    }
    reverseList(dst);
    return dst;
}
function countValues(list, value) {
    var count, node;
    count = 0;
    node = list.head;
    while (true) {
        if (node) {
            if (node.value === value) {
                count++;
            }
            node = node.next;
        } else {
            break;
        }
    }
    return count;
}
function createLinkedList() {
    return { head: undefined };
}
function createListFromValues(values) {
    var copy, list, value;
    copy = values.slice();
    copy.reverse();
    list = createLinkedList();
    for (value of copy) {
        addNode(list, value);
    }
    return list;
}
function createNodeElement(color) {
    var nodeElement;
    nodeElement = document.createElement('div');
    nodeElement.style.background = color;
    nodeElement.style.display = 'inline-block';
    nodeElement.style.width = '30px';
    nodeElement.style.height = '30px';
    nodeElement.style.marginRight = '5px';
    nodeElement.style.borderRadius = '5px';
    nodeElement.style.border = 'solid 1px black';
    return nodeElement;
}
function get(id) {
    var element;
    element = document.getElementById(id);
    if (element) {
        return element;
    } else {
        throw new Error('Element not found: ' + id);
    }
}
function main() {
    var start;
    start = get('start');
    start.addEventListener('click', runDemo);
}
function printList(list) {
    var listDiv, node, nodeElement;
    listDiv = document.createElement('div');
    listDiv.className = 'list-div';
    add(get('playground'), listDiv);
    node = list.head;
    while (true) {
        if (node) {
            nodeElement = createNodeElement(node.value);
            add(listDiv, nodeElement);
            node = node.next;
        } else {
            break;
        }
    }
}
function removeDuplicates(list, value) {
    var node, prevWithValue;
    node = list.head;
    while (true) {
        if (!node || node.value !== value) {
            break;
        } else {
            list.head = node;
            node = node.next;
        }
    }
    prevWithValue = undefined;
    while (true) {
        if (node) {
            if (prevWithValue) {
                if (node.value === value) {
                    prevWithValue.next = undefined;
                } else {
                    prevWithValue.next = node;
                    prevWithValue = undefined;
                }
            } else {
                if (node.value === value) {
                    prevWithValue = node;
                }
            }
            node = node.next;
        } else {
            break;
        }
    }
}
function reverseList(list) {
    var next, node, prev;
    prev = undefined;
    node = list.head;
    while (true) {
        if (node) {
            next = node.next;
            node.next = prev;
            prev = node;
            node = next;
        } else {
            break;
        }
    }
    list.head = prev;
}
function runDemo() {
    clear(get('playground'));
    runExample('Empty', []);
    runExample('Only black', [
        'black',
        'black',
        'black'
    ]);
    runExample('No black', [
        '#FFC759',
        '#FF7B9C',
        '#607196',
        '#BABFD1',
        '#E8E9ED'
    ]);
    runExample('Black at the start', [
        'black',
        'black',
        '#FFC759',
        '#FF7B9C',
        '#607196',
        '#BABFD1',
        '#E8E9ED'
    ]);
    runExample('Black at the end', [
        '#FFC759',
        '#FF7B9C',
        '#607196',
        '#BABFD1',
        '#E8E9ED',
        'black',
        'black'
    ]);
    runExample('Black at the start, middle, and end', [
        'black',
        'black',
        '#FFC759',
        '#FF7B9C',
        '#607196',
        'black',
        'black',
        '#BABFD1',
        '#E8E9ED',
        'black',
        'black'
    ]);
    runExample('No duplicates', [
        'black',
        '#FFC759',
        '#FF7B9C',
        '#607196',
        'black',
        '#BABFD1',
        '#E8E9ED',
        'black'
    ]);
}
function runExample(name, values) {
    var changedList, count, originalList;
    originalList = createListFromValues(values);
    changedList = copyList(originalList);
    count = countValues(originalList, 'black');
    removeDuplicates(changedList, 'black');
    startSection(name);
    addSubheader('Original list');
    printList(originalList);
    addSubheader('Count of black nodes');
    addPar(count);
    addSubheader('After duplicates removal');
    printList(changedList);
    addSpacer();
}
function startSection(name) {
    addElement('h2', name);
}