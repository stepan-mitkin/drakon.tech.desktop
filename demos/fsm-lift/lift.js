(function() {
var globals;
const canvasWidth = 380;
const canvasPadding = 30;
const doorWidth = 80;
const doorHeight = 130;
const floorThickness = 20;
const floorWidth = 160;
const floorHeight = 180;
const cabinThickness = 10;
const floorCount = 4;
const accelerationDistance = 60;
const cabinVelocity = 100;
const doorVelocity = 1;
const doorTimeout = 1000;
const fontFace = 'Arial';
const fontSize = 17;
const buttonSize = 40;
const buttonMargin = 10;
const activeButton = 'yellow';
const normalButton = '#f0f0f0';
const background = 'white';
const lineColor = 'black';
const openColor = '#8a98d1';
globals = {
    floors: undefined,
    delta: undefined,
    buttons: undefined,
    canvas: undefined,
    ctx: undefined,
    target: undefined,
    currentFloor: undefined,
    cabin: undefined
};
window.addEventListener('load', main);
function AcceleratedMotor(onDone, maxVelocity, accDistance) {
    var _obj_;
    _obj_ = AcceleratedMotor_create(onDone, maxVelocity, accDistance);
    return _obj_.run();
}
function AcceleratedMotor_create(onDone, maxVelocity, accDistance) {
    var _earlyPromise_, _topGen_, _topReject_, _topResolve_, me;
    me = {
        _type: 'AcceleratedMotor',
        _busy: true,
        state: 'created'
    };
    _topResolve_ = function (_value_) {
        _earlyPromise_ = Promise.resolve(_value_);
    };
    _topReject_ = function (_value_) {
        throw _value_;
    };
    function* AcceleratedMotor_main() {
        var _branch_, _eventType_, _event_, target;
        _branch_ = 'Init';
        while (true) {
            switch (_branch_) {
            case 'Init':
                me.current = 0;
                me.velocity = 0;
                _branch_ = 'Still';
                break;
            case 'Still':
                me.state = '8';
                me._busy = false;
                _event_ = yield;
                target = _event_[1];
                _branch_ = 'Start';
                break;
            case 'Start':
                scheduleUpdate();
                me.target = target;
                me.startPos = me.current;
                if (target > me.current) {
                    _branch_ = 'Increasing';
                } else {
                    _branch_ = 'Decreasing';
                }
                break;
            case 'Increasing':
                me.state = '12';
                me._busy = false;
                _event_ = yield;
                _eventType_ = _event_[0];
                if (_eventType_ === 'update') {
                    scheduleUpdate();
                    me.current += me.velocity * globals.delta;
                    me.velocity = getIncVelocity(me, maxVelocity, accDistance);
                    if (me.current >= me.target) {
                        me.current = me.target;
                        me.velocity = 0;
                        setTimeout(() => {
                            onDone();
                        }, 0);
                        _branch_ = 'Still';
                    } else {
                        _branch_ = 'Increasing';
                    }
                } else {
                    if (_eventType_ === 'newTarget') {
                        target = _event_[1];
                        me.target = target;
                        _branch_ = 'Increasing';
                    } else {
                        if (!(_eventType_ === 'start')) {
                            throw new Error('Unexpected case value: ' + _eventType_);
                        }
                        target = _event_[1];
                        _branch_ = 'Start';
                    }
                }
                break;
            case 'Decreasing':
                me.state = '26';
                me._busy = false;
                _event_ = yield;
                _eventType_ = _event_[0];
                if (_eventType_ === 'update') {
                    scheduleUpdate();
                    me.current -= me.velocity * globals.delta;
                    me.velocity = getDecVelocity(me, maxVelocity, accDistance);
                    if (me.current <= me.target) {
                        me.current = me.target;
                        me.velocity = 0;
                        setTimeout(() => {
                            onDone();
                        }, 0);
                        _branch_ = 'Still';
                    } else {
                        _branch_ = 'Decreasing';
                    }
                } else {
                    if (_eventType_ === 'newTarget') {
                        target = _event_[1];
                        me.target = target;
                        _branch_ = 'Decreasing';
                    } else {
                        if (!(_eventType_ === 'start')) {
                            throw new Error('Unexpected case value: ' + _eventType_);
                        }
                        target = _event_[1];
                        _branch_ = 'Start';
                    }
                }
                break;
            default:
                _topResolve_();
                return;
            }
        }
    }
    function AcceleratedMotor_run() {
        if (me.state !== 'created') {
            throw new Error('run() can be called only once');
        }
        me.state = 'started';
        _topGen_ = AcceleratedMotor_main();
        _topGen_.next();
        if (_earlyPromise_) {
            return _earlyPromise_;
        }
        return new Promise((resolve, reject) => {
            _topResolve_ = resolve;
            _topReject_ = reject;
        });
    }
    me.run = AcceleratedMotor_run;
    me.stop = function () {
        me.state = undefined;
    };
    me.start = function (target) {
        var _args_;
        if (me._busy) {
            throw new Error('Synchronous reentry is not allowed');
        }
        switch (me.state) {
        case '8':
        case '12':
        case '26':
            _args_ = [];
            _args_.push('start');
            _args_.push(target);
            me._busy = true;
            _topGen_.next(_args_);
            break;
        default:
            break;
        }
    };
    me.update = function () {
        var _args_;
        if (me._busy) {
            throw new Error('Synchronous reentry is not allowed');
        }
        switch (me.state) {
        case '12':
        case '26':
            _args_ = [];
            _args_.push('update');
            me._busy = true;
            _topGen_.next(_args_);
            break;
        default:
            break;
        }
    };
    me.newTarget = function (target) {
        var _args_;
        if (me._busy) {
            throw new Error('Synchronous reentry is not allowed');
        }
        switch (me.state) {
        case '12':
        case '26':
            _args_ = [];
            _args_.push('newTarget');
            _args_.push(target);
            me._busy = true;
            _topGen_.next(_args_);
            break;
        default:
            break;
        }
    };
    return me;
}
function CabinMachine() {
    var _obj_;
    _obj_ = CabinMachine_create();
    return _obj_.run();
}
function CabinMachine_create() {
    var _earlyPromise_, _topGen_, _topReject_, _topResolve_, me;
    me = {
        _type: 'CabinMachine',
        _busy: true,
        state: 'created'
    };
    _topResolve_ = function (_value_) {
        _earlyPromise_ = Promise.resolve(_value_);
    };
    _topReject_ = function (_value_) {
        throw _value_;
    };
    function* CabinMachine_main() {
        var _branch_, _eventType_, _event_;
        _branch_ = 'ClosedStill';
        while (true) {
            switch (_branch_) {
            case 'ClosedStill':
                me.state = '41';
                me._busy = false;
                _event_ = yield;
                if (requestedCurrentFloor()) {
                    openDoor(me);
                    _branch_ = 'Opening';
                } else {
                    if (startMovement(me)) {
                        _branch_ = 'Moving';
                    } else {
                        _branch_ = 'ClosedStill';
                    }
                }
                break;
            case 'Opening':
                me.state = '30';
                me._busy = false;
                _event_ = yield;
                _eventType_ = _event_[0];
                if (_eventType_ === 'update') {
                    me.door.update();
                    _branch_ = 'Opening';
                } else {
                    if (!(_eventType_ === 'onDoor')) {
                        throw new Error('Unexpected case value: ' + _eventType_);
                    }
                    _branch_ = 'Open';
                }
                break;
            case 'Open':
                setTimeout(me.onTimeout, doorTimeout);
                me.state = '72';
                me._busy = false;
                _event_ = yield;
                closeDoor(me);
                _branch_ = 'Closing';
                break;
            case 'Closing':
                me.state = '42';
                me._busy = false;
                _event_ = yield;
                _eventType_ = _event_[0];
                if (_eventType_ === 'update') {
                    me.door.update();
                    _branch_ = 'Closing';
                } else {
                    if (_eventType_ === 'onCommand') {
                        if (requestedCurrentFloor()) {
                            openDoor(me);
                            _branch_ = 'Opening';
                        } else {
                            _branch_ = 'Closing';
                        }
                    } else {
                        if (!(_eventType_ === 'onDoor')) {
                            throw new Error('Unexpected case value: ' + _eventType_);
                        }
                        if (startMovement(me)) {
                            _branch_ = 'Moving';
                        } else {
                            _branch_ = 'ClosedStill';
                        }
                    }
                }
                break;
            case 'Moving':
                globals.currentFloor = undefined;
                me.state = '10';
                me._busy = false;
                _event_ = yield;
                _eventType_ = _event_[0];
                if (_eventType_ === 'update') {
                    me.motor.update();
                    _branch_ = 'Moving';
                } else {
                    if (_eventType_ === 'onArrived') {
                        globals.currentFloor = me.target;
                        me.target = undefined;
                        resetFloorButtons();
                        openDoor(me);
                        _branch_ = 'Opening';
                    } else {
                        if (!(_eventType_ === 'onCommand')) {
                            throw new Error('Unexpected case value: ' + _eventType_);
                        }
                        updateDestination(me);
                        _branch_ = 'Moving';
                    }
                }
                break;
            default:
                _topResolve_();
                return;
            }
        }
    }
    function CabinMachine_run() {
        if (me.state !== 'created') {
            throw new Error('run() can be called only once');
        }
        me.state = 'started';
        _topGen_ = CabinMachine_main();
        _topGen_.next();
        if (_earlyPromise_) {
            return _earlyPromise_;
        }
        return new Promise((resolve, reject) => {
            _topResolve_ = resolve;
            _topReject_ = reject;
        });
    }
    me.run = CabinMachine_run;
    me.stop = function () {
        me.state = undefined;
    };
    me.update = function () {
        var _args_;
        if (me._busy) {
            throw new Error('Synchronous reentry is not allowed');
        }
        switch (me.state) {
        case '10':
        case '30':
        case '42':
            _args_ = [];
            _args_.push('update');
            me._busy = true;
            _topGen_.next(_args_);
            break;
        default:
            break;
        }
    };
    me.onArrived = function () {
        var _args_;
        if (me._busy) {
            throw new Error('Synchronous reentry is not allowed');
        }
        switch (me.state) {
        case '10':
            _args_ = [];
            _args_.push('onArrived');
            me._busy = true;
            _topGen_.next(_args_);
            break;
        default:
            break;
        }
    };
    me.onCommand = function () {
        var _args_;
        if (me._busy) {
            throw new Error('Synchronous reentry is not allowed');
        }
        switch (me.state) {
        case '10':
        case '41':
        case '42':
            _args_ = [];
            _args_.push('onCommand');
            me._busy = true;
            _topGen_.next(_args_);
            break;
        default:
            break;
        }
    };
    me.onDoor = function () {
        var _args_;
        if (me._busy) {
            throw new Error('Synchronous reentry is not allowed');
        }
        switch (me.state) {
        case '30':
        case '42':
            _args_ = [];
            _args_.push('onDoor');
            me._busy = true;
            _topGen_.next(_args_);
            break;
        default:
            break;
        }
    };
    me.onTimeout = function () {
        var _args_;
        if (me._busy) {
            throw new Error('Synchronous reentry is not allowed');
        }
        switch (me.state) {
        case '72':
            _args_ = [];
            _args_.push('onTimeout');
            me._busy = true;
            _topGen_.next(_args_);
            break;
        default:
            break;
        }
    };
    return me;
}
function LinearMotor(onDone, velocity) {
    var _obj_;
    _obj_ = LinearMotor_create(onDone, velocity);
    return _obj_.run();
}
function LinearMotor_create(onDone, velocity) {
    var _earlyPromise_, _topGen_, _topReject_, _topResolve_, me;
    me = {
        _type: 'LinearMotor',
        _busy: true,
        state: 'created'
    };
    _topResolve_ = function (_value_) {
        _earlyPromise_ = Promise.resolve(_value_);
    };
    _topReject_ = function (_value_) {
        throw _value_;
    };
    function* LinearMotor_main() {
        var _branch_, _eventType_, _event_, target;
        _branch_ = 'Init';
        while (true) {
            switch (_branch_) {
            case 'Init':
                me.current = 0;
                _branch_ = 'Still';
                break;
            case 'Still':
                me.state = '8';
                me._busy = false;
                _event_ = yield;
                target = _event_[1];
                _branch_ = 'Start';
                break;
            case 'Start':
                scheduleUpdate();
                me.target = target;
                if (target > me.current) {
                    _branch_ = 'Increasing';
                } else {
                    _branch_ = 'Decreasing';
                }
                break;
            case 'Increasing':
                me.state = '12';
                me._busy = false;
                _event_ = yield;
                _eventType_ = _event_[0];
                if (_eventType_ === 'update') {
                    scheduleUpdate();
                    me.current += velocity * globals.delta;
                    if (me.current >= me.target) {
                        me.current = me.target;
                        setTimeout(() => {
                            onDone();
                        }, 0);
                        _branch_ = 'Still';
                    } else {
                        _branch_ = 'Increasing';
                    }
                } else {
                    if (_eventType_ === 'newTarget') {
                        target = _event_[1];
                        me.target = target;
                        _branch_ = 'Increasing';
                    } else {
                        if (!(_eventType_ === 'start')) {
                            throw new Error('Unexpected case value: ' + _eventType_);
                        }
                        target = _event_[1];
                        _branch_ = 'Start';
                    }
                }
                break;
            case 'Decreasing':
                me.state = '26';
                me._busy = false;
                _event_ = yield;
                _eventType_ = _event_[0];
                if (_eventType_ === 'update') {
                    scheduleUpdate();
                    me.current -= velocity * globals.delta;
                    if (me.current <= me.target) {
                        me.current = me.target;
                        setTimeout(() => {
                            onDone();
                        }, 0);
                        _branch_ = 'Still';
                    } else {
                        _branch_ = 'Decreasing';
                    }
                } else {
                    if (_eventType_ === 'newTarget') {
                        target = _event_[1];
                        me.target = target;
                        _branch_ = 'Decreasing';
                    } else {
                        if (!(_eventType_ === 'start')) {
                            throw new Error('Unexpected case value: ' + _eventType_);
                        }
                        target = _event_[1];
                        _branch_ = 'Start';
                    }
                }
                break;
            default:
                _topResolve_();
                return;
            }
        }
    }
    function LinearMotor_run() {
        if (me.state !== 'created') {
            throw new Error('run() can be called only once');
        }
        me.state = 'started';
        _topGen_ = LinearMotor_main();
        _topGen_.next();
        if (_earlyPromise_) {
            return _earlyPromise_;
        }
        return new Promise((resolve, reject) => {
            _topResolve_ = resolve;
            _topReject_ = reject;
        });
    }
    me.run = LinearMotor_run;
    me.stop = function () {
        me.state = undefined;
    };
    me.start = function (target) {
        var _args_;
        if (me._busy) {
            throw new Error('Synchronous reentry is not allowed');
        }
        switch (me.state) {
        case '8':
        case '12':
        case '26':
            _args_ = [];
            _args_.push('start');
            _args_.push(target);
            me._busy = true;
            _topGen_.next(_args_);
            break;
        default:
            break;
        }
    };
    me.update = function () {
        var _args_;
        if (me._busy) {
            throw new Error('Synchronous reentry is not allowed');
        }
        switch (me.state) {
        case '12':
        case '26':
            _args_ = [];
            _args_.push('update');
            me._busy = true;
            _topGen_.next(_args_);
            break;
        default:
            break;
        }
    };
    me.newTarget = function (target) {
        var _args_;
        if (me._busy) {
            throw new Error('Synchronous reentry is not allowed');
        }
        switch (me.state) {
        case '12':
        case '26':
            _args_ = [];
            _args_.push('newTarget');
            _args_.push(target);
            me._busy = true;
            _topGen_.next(_args_);
            break;
        default:
            break;
        }
    };
    return me;
}
function OneWayButton() {
    var _obj_;
    _obj_ = OneWayButton_create();
    return _obj_.run();
}
function OneWayButton_create() {
    var _earlyPromise_, _topGen_, _topReject_, _topResolve_, me;
    me = {
        _type: 'OneWayButton',
        _busy: true,
        state: 'created'
    };
    _topResolve_ = function (_value_) {
        _earlyPromise_ = Promise.resolve(_value_);
    };
    _topReject_ = function (_value_) {
        throw _value_;
    };
    function* OneWayButton_main() {
        var _branch_, _event_;
        _branch_ = 'Off';
        while (true) {
            switch (_branch_) {
            case 'Off':
                me.on = false;
                me.state = '6';
                me._busy = false;
                _event_ = yield;
                setTimeout(() => {
                    onUserCommand();
                }, 0);
                scheduleUpdate();
                _branch_ = 'On';
                break;
            case 'On':
                me.on = true;
                me.state = '8';
                me._busy = false;
                _event_ = yield;
                scheduleUpdate();
                _branch_ = 'Off';
                break;
            default:
                _topResolve_();
                return;
            }
        }
    }
    function OneWayButton_run() {
        if (me.state !== 'created') {
            throw new Error('run() can be called only once');
        }
        me.state = 'started';
        _topGen_ = OneWayButton_main();
        _topGen_.next();
        if (_earlyPromise_) {
            return _earlyPromise_;
        }
        return new Promise((resolve, reject) => {
            _topResolve_ = resolve;
            _topReject_ = reject;
        });
    }
    me.run = OneWayButton_run;
    me.stop = function () {
        me.state = undefined;
    };
    me.click = function () {
        var _args_;
        if (me._busy) {
            throw new Error('Synchronous reentry is not allowed');
        }
        switch (me.state) {
        case '6':
            _args_ = [];
            _args_.push('click');
            me._busy = true;
            _topGen_.next(_args_);
            break;
        default:
            break;
        }
    };
    me.reset = function () {
        var _args_;
        if (me._busy) {
            throw new Error('Synchronous reentry is not allowed');
        }
        switch (me.state) {
        case '8':
            _args_ = [];
            _args_.push('reset');
            me._busy = true;
            _topGen_.next(_args_);
            break;
        default:
            break;
        }
    };
    return me;
}
function add(parent, child) {
    parent.appendChild(child);
}
function addElementWithText(container, tag, text) {
    var element;
    element = document.createElement(tag);
    addText(element, text);
    add(container, element);
}
function addLine(depth, container, name, value, bold) {
    var indent, nameEl, objLine, valueEl, valueStr;
    objLine = document.createElement('div');
    objLine.style.margin = '5px';
    if (depth) {
        indent = document.createElement('span');
        indent.style.display = 'inline-block';
        indent.style.verticalAlign = 'middle';
        indent.style.width = 20 * depth + 'px';
        add(objLine, indent);
    }
    nameEl = document.createElement('span');
    nameEl.style.display = 'inline-block';
    nameEl.style.verticalAlign = 'middle';
    addText(nameEl, name + ': ');
    nameEl.style.minWidth = '100px';
    add(objLine, nameEl);
    if (bold) {
        nameEl.style.fontWeight = 'bold';
    }
    if (!(value === undefined)) {
        valueStr = formatValue(value);
        valueEl = document.createElement('span');
        valueEl.style.display = 'inline-block';
        valueEl.style.verticalAlign = 'middle';
        addText(valueEl, valueStr);
        add(objLine, valueEl);
        valueEl.style.fontWeight = 'bold';
    }
    add(container, objLine);
}
function addText(element, text) {
    var tnode;
    tnode = document.createTextNode(text);
    element.appendChild(tnode);
}
function buildStructures() {
    var cabin;
    globals.floors = [undefined];
    globals.delta = 0;
    globals.buttons = [];
    createFloor(1, true, false);
    createFloor(2, true, true);
    createFloor(3, true, true);
    createFloor(4, false, true);
    globals.currentFloor = 1;
    cabin = CabinMachine_create();
    cabin.door = LinearMotor_create(cabin.onDoor, doorVelocity);
    cabin.motor = AcceleratedMotor_create(cabin.onArrived, cabinVelocity, accelerationDistance);
    globals.cabin = cabin;
    cabin.run();
    cabin.door.run();
    cabin.motor.run();
    takeCabinPositionFromFloor();
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
function closeDoor(self) {
    self.door.start(0);
}
function createButton(type, text, x, y) {
    var button;
    button = {
        x: x,
        y: y,
        type: type,
        text: text,
        machine: OneWayButton_create()
    };
    button.machine.run();
    globals.buttons.push(button);
    return button;
}
function createCanvas() {
    var canvas, canvasHeight, mainDiv, scale, status;
    canvasHeight = getCanvasHeight();
    mainDiv = get('main-container');
    clear(mainDiv);
    addElementWithText(mainDiv, 'h1', 'Lift: a state machine demo');
    addElementWithText(mainDiv, 'p', 'Press the lift buttons to make it move');
    canvas = document.createElement('canvas');
    canvas.style.display = 'inline-block';
    canvas.style.verticalAlign = 'top';
    status = document.createElement('div');
    status.style.display = 'inline-block';
    status.style.verticalAlign = 'top';
    scale = getRetinaFactor();
    canvas.width = canvasWidth * scale;
    canvas.height = canvasHeight * scale;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    add(mainDiv, canvas);
    add(mainDiv, status);
    globals.canvas = canvas;
    globals.status = status;
    globals.retina = scale;
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('mousemove', onHover);
}
function createFloor(number, up, down) {
    var bottom, centerY, floor, innerBottom, left, nleft, y, y1, y2;
    floor = { number: number };
    bottom = getFloorBottom(number);
    centerY = Math.round(bottom - floorHeight / 2);
    left = canvasPadding + floorWidth + canvasPadding;
    if (up) {
        if (down) {
            y1 = centerY - (buttonSize + buttonMargin / 2);
            y2 = y1 + buttonSize + buttonMargin;
            floor.up = createButton('up', undefined, left, y1);
            floor.down = createButton('down', undefined, left, y2);
        } else {
            y = centerY - buttonSize / 2;
            floor.up = createButton('up', undefined, left, y);
        }
    } else {
        if (down) {
            y = centerY - buttonSize / 2;
            floor.down = createButton('down', undefined, left, y);
        }
    }
    innerBottom = getFloorBottom(1);
    nleft = left + buttonSize + canvasPadding * 2;
    y = innerBottom - canvasPadding - floorThickness - buttonSize - (number - 1) * (buttonSize + buttonMargin);
    floor.inner = createButton('inner', number, nleft, y);
    globals.floors.push(floor);
}
function drawActiveButton(x, y, text) {
    drawButton(x, y, buttonSize, buttonSize, text, normalButton, lineColor);
}
function drawActiveDown(x, y) {
    drawDown(x, y, buttonSize, buttonSize, normalButton, lineColor);
}
function drawActiveUp(x, y) {
    drawUp(x, y, buttonSize, buttonSize, normalButton, lineColor);
}
function drawButton(x, y, width, height, text, color, background) {
    var bottom, ctx, left, textWidth;
    ctx = globals.ctx;
    ctx.fillStyle = background;
    fillRect(x, y, width, height);
    ctx.strokeStyle = color;
    rect(x, y, width, height);
    textWidth = ctx.measureText(text).width;
    left = Math.round(x + (width - textWidth) / 2);
    bottom = Math.floor(y + height - (height - fontSize * 0.9) / 2);
    ctx.font = fontSize + 'px ' + fontFace;
    ctx.fillStyle = color;
    ctx.textBaseLine = 'bottom';
    ctx.fillText(text, left, bottom);
}
function drawCabin(cabinFloorY, doorOpening) {
    var cabinHeight, cabinLeft, cabinTop, cabinWidth, ctx, doorLeft, doorTop, left, leftDoorX, rightDoorX;
    ctx = globals.ctx;
    left = canvasPadding;
    doorLeft = left + (floorWidth - doorWidth) / 2;
    cabinLeft = doorLeft - cabinThickness;
    doorTop = cabinFloorY - doorHeight;
    cabinTop = doorTop - cabinThickness;
    cabinWidth = doorWidth + cabinThickness * 2;
    cabinHeight = doorHeight + cabinThickness * 2;
    ctx.fillStyle = openColor;
    fillRect(doorLeft, doorTop, doorWidth, doorHeight);
    leftDoorX = doorLeft - doorWidth * 0.45 * doorOpening;
    ctx.fillStyle = normalButton;
    fillRect(leftDoorX, doorTop, doorWidth / 2, doorHeight);
    ctx.strokeStyle = lineColor;
    rect(leftDoorX, doorTop, doorWidth / 2, doorHeight);
    rightDoorX = doorLeft + doorWidth / 2 + doorWidth * 0.45 * doorOpening;
    fillRect(rightDoorX, doorTop, doorWidth / 2, doorHeight);
    rect(rightDoorX, doorTop, doorWidth / 2, doorHeight);
    ctx.fillStyle = lineColor;
    fillRect(cabinLeft, cabinTop, cabinWidth, cabinThickness);
    fillRect(cabinLeft, doorTop, cabinThickness, doorHeight);
    fillRect(cabinLeft, cabinFloorY, cabinWidth, cabinThickness);
    fillRect(doorLeft + doorWidth, doorTop, cabinThickness, doorHeight);
}
function drawDown(x, y, width, height, color, background) {
    var bottom, ctx, left, middle, right, top;
    ctx = globals.ctx;
    ctx.fillStyle = background;
    fillRect(x, y, width, height);
    ctx.strokeStyle = color;
    rect(x, y, width, height);
    left = Math.round(x + width / 3);
    right = Math.round(x + width * 2 / 3);
    middle = (left + right) / 2;
    top = Math.round(y + height / 3);
    bottom = Math.round(y + height * 2 / 3);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(right, top);
    ctx.lineTo(middle, bottom);
    ctx.fill();
}
function drawFloor(number) {
    var bottom, canvasHeight, ctx, doorHigh, doorLeft, doorLow, left, middle;
    ctx = globals.ctx;
    left = canvasPadding;
    canvasHeight = getCanvasHeight();
    bottom = getFloorBottom(number);
    doorLow = bottom - floorThickness;
    doorHigh = doorLow + doorHeight;
    middle = left + floorWidth / 2;
    doorLeft = left + (floorWidth - doorWidth) / 2;
    ctx.strokeStyle = lineColor;
    line(left, bottom, left + floorWidth, bottom);
    line(left, doorLow, left + floorWidth, doorLow);
    rect(doorLeft, doorLow - doorHeight, doorWidth, doorHeight);
    line(middle, doorLow - doorHeight, middle, doorLow);
}
function drawGuiButton(button) {
    var _selectValue_68;
    _selectValue_68 = button.type;
    if (_selectValue_68 === 'up') {
        if (button.machine.on) {
            drawActiveUp(button.x, button.y);
        } else {
            drawNormalUp(button.x, button.y);
        }
    } else {
        if (_selectValue_68 === 'down') {
            if (button.machine.on) {
                drawActiveDown(button.x, button.y);
            } else {
                drawNormalDown(button.x, button.y);
            }
        } else {
            if (!(_selectValue_68 === 'inner')) {
                throw new Error('Unexpected case value: ' + _selectValue_68);
            }
            if (button.machine.on) {
                drawActiveButton(button.x, button.y, button.text);
            } else {
                drawNormalButton(button.x, button.y, button.text);
            }
        }
    }
}
function drawNormalButton(x, y, text) {
    drawButton(x, y, buttonSize, buttonSize, text, lineColor, normalButton);
}
function drawNormalDown(x, y) {
    drawDown(x, y, buttonSize, buttonSize, lineColor, normalButton);
}
function drawNormalUp(x, y) {
    drawUp(x, y, buttonSize, buttonSize, lineColor, normalButton);
}
function drawUp(x, y, width, height, color, background) {
    var bottom, ctx, left, middle, right, top;
    ctx = globals.ctx;
    ctx.fillStyle = background;
    fillRect(x, y, width, height);
    ctx.strokeStyle = color;
    rect(x, y, width, height);
    left = Math.round(x + width / 3);
    right = Math.round(x + width * 2 / 3);
    middle = (left + right) / 2;
    top = Math.round(y + height / 3);
    bottom = Math.round(y + height * 2 / 3);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(left, bottom);
    ctx.lineTo(middle, top);
    ctx.lineTo(right, bottom);
    ctx.fill();
}
function fillRect(x, y, width, height) {
    var ctx;
    ctx = globals.ctx;
    ctx.fillRect(x, y, width, height);
}
function findButton(evt) {
    var _collection_99, button, crect, x, y;
    crect = globals.canvas.getBoundingClientRect();
    x = evt.clientX - crect.left;
    y = evt.clientY - crect.top;
    _collection_99 = globals.buttons;
    for (button of _collection_99) {
        if (hitBox(button.x, button.y, buttonSize, buttonSize, x, y)) {
            return button;
        }
    }
    return undefined;
}
function findNextTargetDown() {
    var cabin, floorY, found, i;
    found = undefined;
    cabin = getCabinPos() + accelerationDistance;
    for (i = 1; i <= floorCount; i++) {
        floorY = floorToPosition(i);
        if (floorY >= cabin) {
            if (found) {
                if (isFloorRequestedInner(i) || isFloorRequestedDown(i)) {
                    found = i;
                }
            } else {
                if (isFloorRequested(i)) {
                    found = i;
                }
            }
        } else {
            break;
        }
    }
    return found;
}
function findNextTargetUp() {
    var cabin, floorY, found, i;
    found = undefined;
    cabin = getCabinPos() - accelerationDistance;
    for (i = floorCount; i > 0; i--) {
        floorY = floorToPosition(i);
        if (floorY <= cabin) {
            if (found) {
                if (isFloorRequestedInner(i) || isFloorRequestedUp(i)) {
                    found = i;
                }
            } else {
                if (isFloorRequested(i)) {
                    found = i;
                }
            }
        } else {
            break;
        }
    }
    return found;
}
function floorToPosition(number) {
    var canvasHeight;
    canvasHeight = getCanvasHeight();
    return canvasHeight - canvasPadding - (number - 1) * floorHeight - floorThickness;
}
function formatValue(value) {
    if (typeof value === 'number') {
        if (value === Math.round(value)) {
            return value.toString();
        } else {
            return value.toFixed(2).toString();
        }
    } else {
        return value.toString();
    }
}
function get(id) {
    var element;
    element = document.getElementById(id);
    if (element) {
        return element;
    } else {
        throw new Error('Element not found ' + id);
    }
}
function getCabinPos() {
    return globals.cabin.motor.current;
}
function getCanvasHeight() {
    return canvasPadding * 2 + floorCount * floorHeight;
}
function getDecVelocity(self, maxVelocity, accDistance) {
    var acc, accTime, m1, m2, result;
    accTime = 2 * accDistance / maxVelocity;
    acc = maxVelocity / accTime;
    m1 = self.startPos - accDistance;
    m2 = self.target + accDistance;
    if (self.current > m1) {
        result = self.velocity + acc * globals.delta;
    } else {
        if (self.current < m2) {
            result = self.velocity - acc * globals.delta;
        } else {
            result = maxVelocity;
        }
    }
    return Math.max(maxVelocity * 0.05, Math.min(result, maxVelocity));
}
function getDoorPos() {
    return globals.cabin.door.current;
}
function getFloorBottom(number) {
    var bottom, canvasHeight;
    canvasHeight = getCanvasHeight();
    bottom = canvasHeight - canvasPadding - (number - 1) * floorHeight;
    return bottom;
}
function getIncVelocity(self, maxVelocity, accDistance) {
    var acc, accTime, m1, m2, result;
    accTime = 2 * accDistance / maxVelocity;
    acc = maxVelocity / accTime;
    m1 = self.startPos + accDistance;
    m2 = self.target - accDistance;
    if (self.current < m1) {
        result = self.velocity + acc * globals.delta;
    } else {
        if (self.current > m2) {
            result = self.velocity - acc * globals.delta;
        } else {
            result = maxVelocity;
        }
    }
    return Math.max(maxVelocity * 0.05, Math.min(result, maxVelocity));
}
function getIncVelocityOld(self, maxVelocity, accDistance) {
    var cutoff, distance, m1, m2, result;
    cutoff = accDistance * 0.1;
    distance = self.target - self.startPos;
    m1 = self.startPos + accDistance;
    m2 = self.target - accDistance;
    if (self.current < m1) {
        result = (self.current - self.startPos + cutoff) / (accDistance + cutoff) * maxVelocity;
    } else {
        if (self.current > m2) {
            result = (self.target - self.current + cutoff) / (accDistance + cutoff) * maxVelocity;
        } else {
            result = maxVelocity;
        }
    }
    return result;
}
function getRetina() {
    return window.matchMedia && (window.matchMedia('only screen and (min-resolution: 124dpi), only screen and (min-resolution: 1.3dppx), only screen and (min-resolution: 48.8dpcm)').matches || window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (min-device-pixel-ratio: 1.3)').matches) || window.devicePixelRatio && window.devicePixelRatio > 1.3;
}
function getRetinaFactor() {
    if (window.devicePixelRatio) {
        return window.devicePixelRatio;
    } else {
        if (isRetina()) {
            return 2;
        } else {
            return 1;
        }
    }
}
function hitBox(left, top, width, height, x, y) {
    var bottom, right;
    if (x >= left && y >= top) {
        right = left + width;
        if (x < right) {
            bottom = top + height;
            if (y < bottom) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } else {
        return false;
    }
}
function isFloorRequested(number) {
    if (isFloorRequestedUp(number) || isFloorRequestedDown(number) || isFloorRequestedInner(number)) {
        return true;
    } else {
        return false;
    }
}
function isFloorRequestedDown(number) {
    var floor;
    floor = globals.floors[number];
    if (floor.down) {
        return floor.down.machine.on;
    } else {
        return false;
    }
}
function isFloorRequestedInner(number) {
    var floor;
    floor = globals.floors[number];
    return floor.inner.machine.on;
}
function isFloorRequestedUp(number) {
    var floor;
    floor = globals.floors[number];
    if (floor.up) {
        return floor.up.machine.on;
    } else {
        return false;
    }
}
function line(x1, y1, x2, y2) {
    var ctx;
    ctx = globals.ctx;
    x1 += 0.5;
    y1 += 0.5;
    x2 += 0.5;
    y2 += 0.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}
function main() {
    createCanvas();
    buildStructures();
    updateWorld();
}
function onClick(evt) {
    var button;
    button = findButton(evt);
    if (button) {
        button.machine.click();
    }
    redraw();
}
function onHover(evt) {
    var button;
    button = findButton(evt);
    if (button) {
        globals.canvas.style.cursor = 'pointer';
    } else {
        globals.canvas.style.cursor = 'default';
    }
}
function onUserCommand() {
    globals.cabin.onCommand();
    resetFloorButtons();
}
function openDoor(self) {
    self.door.start(1);
}
function printMachine(container, machine, depth) {
    var _selectValue_101, name, names, value;
    if (machine && machine.state) {
        addLine(depth, container, 'state', machine.state, true);
        names = Object.keys(machine);
        names.sort();
        for (name of names) {
            if (!(name === 'state')) {
                value = machine[name];
                _selectValue_101 = typeof value;
                if (_selectValue_101 === 'object') {
                    addLine(depth, container, name, undefined, false);
                    printMachine(container, value, depth + 1);
                } else {
                    if (!(_selectValue_101 === 'function')) {
                        addLine(depth, container, name, value, false);
                    }
                }
            }
        }
    }
}
function rect(x, y, width, height) {
    var ctx;
    ctx = globals.ctx;
    x += 0.5;
    y += 0.5;
    ctx.strokeRect(x, y, width, height);
}
function redraw() {
    var _collection_70, button, canvasHeight, ctx, i;
    ctx = globals.canvas.getContext('2d');
    ctx.resetTransform();
    ctx.scale(globals.retina, globals.retina);
    globals.ctx = ctx;
    ctx.fillStyle = background;
    canvasHeight = getCanvasHeight();
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    for (i = 1; i <= floorCount; i++) {
        drawFloor(i);
    }
    drawCabin(getCabinPos(), getDoorPos());
    _collection_70 = globals.buttons;
    for (button of _collection_70) {
        drawGuiButton(button);
    }
    showMachineStatus();
}
function requestedCurrentFloor() {
    var i;
    if (globals.currentFloor) {
        for (i = 1; i <= floorCount; i++) {
            if (isFloorRequested(globals.currentFloor)) {
                return true;
            }
        }
    }
    return false;
}
function resetFloorButtons() {
    var floor;
    if (globals.currentFloor) {
        floor = globals.floors[globals.currentFloor];
        if (floor.up) {
            floor.up.machine.reset();
        }
        if (floor.down) {
            floor.down.machine.reset();
        }
        floor.inner.machine.reset();
    }
}
function scheduleUpdate() {
    globals.updateScheduled = true;
    requestAnimationFrame(updateWorld);
}
function showMachineStatus() {
    var root, status;
    status = globals.status;
    clear(status);
    root = {
        cabin: globals.cabin,
        currentFloor: globals.currentFloor,
        state: 'ok'
    };
    printMachine(status, root, 0);
}
function startMovement(self) {
    var nextTarget, targetY;
    if (self.direction === 'up') {
        nextTarget = findNextTargetUp();
        if (nextTarget) {
            self.direction = 'up';
        } else {
            nextTarget = findNextTargetDown();
            self.direction = 'down';
        }
    } else {
        nextTarget = findNextTargetDown();
        if (nextTarget) {
            self.direction = 'down';
        } else {
            nextTarget = findNextTargetUp();
            self.direction = 'up';
        }
    }
    self.target = nextTarget;
    if (self.target) {
        targetY = floorToPosition(self.target);
        self.motor.start(targetY);
        return true;
    } else {
        self.direction = undefined;
        return false;
    }
}
function takeCabinPositionFromFloor() {
    globals.cabin.motor.current = floorToPosition(globals.currentFloor);
    globals.cabin.door.current = 0;
}
function updateDestination(self) {
    var _branch_, nextTarget, targetY;
    _branch_ = 'Check';
    while (true) {
        switch (_branch_) {
        case 'Check':
            if (self.direction === 'up') {
                nextTarget = findNextTargetUp();
                if (nextTarget && nextTarget < self.target) {
                    _branch_ = 'Set new target';
                } else {
                    _branch_ = 'Exit';
                }
            } else {
                nextTarget = findNextTargetDown();
                if (nextTarget && nextTarget > self.target) {
                    _branch_ = 'Set new target';
                } else {
                    _branch_ = 'Exit';
                }
            }
            break;
        case 'Set new target':
            self.target = nextTarget;
            targetY = floorToPosition(self.target);
            self.motor.newTarget(targetY);
            _branch_ = 'Exit';
            break;
        case 'Exit':
            _branch_ = undefined;
            break;
        default:
            return;
        }
    }
}
function updateFrameTime() {
    var now;
    now = new Date().getTime();
    if (globals.lastFrame) {
        globals.delta = Math.min(0.2, (now - globals.lastFrame) / 1000);
    } else {
        globals.delta = 0;
    }
    globals.lastFrame = now;
}
function updateWorld() {
    updateFrameTime();
    globals.cabin.update();
    redraw();
    if (globals.updateScheduled) {
        globals.updateScheduled = false;
    } else {
        globals.lastFrame = 0;
    }
}
})();