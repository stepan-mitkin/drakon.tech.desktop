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
    var self = {};
    self.current = 0;
    self.velocity = 0;
    self.state = 'Still';
    function Decreasing_newTarget(target) {
        self.target = target;
        self.state = 'Decreasing';
    }
    function Decreasing_start(target) {
        scheduleUpdate();
        self.target = target;
        self.startPos = self.current;
        if (target > self.current) {
            self.state = 'Increasing';
        } else {
            self.state = 'Decreasing';
        }
    }
    function Decreasing_update() {
        scheduleUpdate();
        self.current -= self.velocity * globals.delta;
        self.velocity = getDecVelocity(self, maxVelocity, accDistance);
        if (self.current <= self.target) {
            self.current = self.target;
            setTimeout(() => {
                onDone();
            }, 0);
            self.state = 'Still';
        } else {
            self.state = 'Decreasing';
        }
    }
    function Increasing_newTarget(target) {
        self.target = target;
        self.state = 'Increasing';
    }
    function Increasing_start(target) {
        scheduleUpdate();
        self.target = target;
        self.startPos = self.current;
        if (target > self.current) {
            self.state = 'Increasing';
        } else {
            self.state = 'Decreasing';
        }
    }
    function Increasing_update() {
        scheduleUpdate();
        self.current += self.velocity * globals.delta;
        self.velocity = getIncVelocity(self, maxVelocity, accDistance);
        if (self.current >= self.target) {
            self.current = self.target;
            setTimeout(() => {
                onDone();
            }, 0);
            self.state = 'Still';
        } else {
            self.state = 'Increasing';
        }
    }
    function Still_start(target) {
        scheduleUpdate();
        self.target = target;
        self.startPos = self.current;
        if (target > self.current) {
            self.state = 'Increasing';
        } else {
            self.state = 'Decreasing';
        }
    }
    function newTarget(target) {
        switch (self.state) {
        case 'Increasing':
            return Increasing_newTarget(target);
        case 'Decreasing':
            return Decreasing_newTarget(target);
        default:
            return undefined;
        }
    }
    function start(target) {
        switch (self.state) {
        case 'Still':
            return Still_start(target);
        case 'Increasing':
            return Increasing_start(target);
        case 'Decreasing':
            return Decreasing_start(target);
        default:
            return undefined;
        }
    }
    function update() {
        switch (self.state) {
        case 'Increasing':
            return Increasing_update();
        case 'Decreasing':
            return Decreasing_update();
        default:
            return undefined;
        }
    }
    self.newTarget = newTarget;
    self.start = start;
    self.update = update;
    return self;
}
function CabinMachine() {
    var self = {};
    self.state = 'ClosedStill';
    function ClosedStill_onCommand() {
        if (requestedCurrentFloor()) {
            resetFloorButtons();
            openDoor(self);
            self.state = 'Opening';
        } else {
            if (startMovement(self)) {
                self.state = 'Moving';
            } else {
                self.state = 'ClosedStill';
            }
        }
    }
    function Closing_onCommand() {
        if (requestedCurrentFloor()) {
            resetFloorButtons();
            openDoor(self);
            self.state = 'Opening';
        } else {
            self.state = 'Closing';
        }
    }
    function Closing_onDoor() {
        if (startMovement(self)) {
            self.state = 'Moving';
        } else {
            self.state = 'ClosedStill';
        }
    }
    function Closing_update() {
        self.door.update();
        self.state = 'Closing';
    }
    function Moving_onArrived() {
        globals.currentFloor = globals.target;
        globals.target = undefined;
        resetFloorButtons();
        openDoor(self);
        self.state = 'Opening';
    }
    function Moving_onCommand() {
        updateDestination(self);
        self.state = 'Moving';
    }
    function Moving_update() {
        self.motor.update();
        self.state = 'Moving';
    }
    function Open_onCommand() {
        resetFloorButtons();
        setTimeout(self.onTimeout, doorTimeout);
        self.state = 'Open';
    }
    function Open_onTimeout() {
        closeDoor(self);
        self.state = 'Closing';
    }
    function Opening_onCommand() {
        resetFloorButtons();
        self.state = 'Opening';
    }
    function Opening_onDoor() {
        setTimeout(self.onTimeout, doorTimeout);
        self.state = 'Open';
    }
    function Opening_update() {
        self.door.update();
        self.state = 'Opening';
    }
    function onArrived() {
        switch (self.state) {
        case 'Moving':
            return Moving_onArrived();
        default:
            return undefined;
        }
    }
    function onCommand() {
        switch (self.state) {
        case 'Moving':
            return Moving_onCommand();
        case 'Opening':
            return Opening_onCommand();
        case 'ClosedStill':
            return ClosedStill_onCommand();
        case 'Closing':
            return Closing_onCommand();
        case 'Open':
            return Open_onCommand();
        default:
            return undefined;
        }
    }
    function onDoor() {
        switch (self.state) {
        case 'Opening':
            return Opening_onDoor();
        case 'Closing':
            return Closing_onDoor();
        default:
            return undefined;
        }
    }
    function onTimeout() {
        switch (self.state) {
        case 'Open':
            return Open_onTimeout();
        default:
            return undefined;
        }
    }
    function update() {
        switch (self.state) {
        case 'Moving':
            return Moving_update();
        case 'Opening':
            return Opening_update();
        case 'Closing':
            return Closing_update();
        default:
            return undefined;
        }
    }
    self.onArrived = onArrived;
    self.onCommand = onCommand;
    self.onDoor = onDoor;
    self.onTimeout = onTimeout;
    self.update = update;
    return self;
}
function LinearMotor(onDone, velocity) {
    var self = {};
    self.current = 0;
    self.state = 'Still';
    function Decreasing_newTarget(target) {
        self.target = target;
        self.state = 'Decreasing';
    }
    function Decreasing_start(target) {
        scheduleUpdate();
        self.target = target;
        if (target > self.current) {
            self.state = 'Increasing';
        } else {
            self.state = 'Decreasing';
        }
    }
    function Decreasing_update() {
        scheduleUpdate();
        self.current -= velocity * globals.delta;
        if (self.current <= self.target) {
            self.current = self.target;
            setTimeout(() => {
                onDone();
            }, 0);
            self.state = 'Still';
        } else {
            self.state = 'Decreasing';
        }
    }
    function Increasing_newTarget(target) {
        self.target = target;
        self.state = 'Increasing';
    }
    function Increasing_start(target) {
        scheduleUpdate();
        self.target = target;
        if (target > self.current) {
            self.state = 'Increasing';
        } else {
            self.state = 'Decreasing';
        }
    }
    function Increasing_update() {
        scheduleUpdate();
        self.current += velocity * globals.delta;
        if (self.current >= self.target) {
            self.current = self.target;
            setTimeout(() => {
                onDone();
            }, 0);
            self.state = 'Still';
        } else {
            self.state = 'Increasing';
        }
    }
    function Still_start(target) {
        scheduleUpdate();
        self.target = target;
        if (target > self.current) {
            self.state = 'Increasing';
        } else {
            self.state = 'Decreasing';
        }
    }
    function newTarget(target) {
        switch (self.state) {
        case 'Increasing':
            return Increasing_newTarget(target);
        case 'Decreasing':
            return Decreasing_newTarget(target);
        default:
            return undefined;
        }
    }
    function start(target) {
        switch (self.state) {
        case 'Still':
            return Still_start(target);
        case 'Increasing':
            return Increasing_start(target);
        case 'Decreasing':
            return Decreasing_start(target);
        default:
            return undefined;
        }
    }
    function update() {
        switch (self.state) {
        case 'Increasing':
            return Increasing_update();
        case 'Decreasing':
            return Decreasing_update();
        default:
            return undefined;
        }
    }
    self.newTarget = newTarget;
    self.start = start;
    self.update = update;
    return self;
}
function OneWayButton() {
    var self = {};
    self.on = false;
    self.state = 'Off';
    function Off_click() {
        setTimeout(() => {
            onUserCommand();
        }, 0);
        scheduleUpdate();
        self.on = true;
        self.state = 'On';
    }
    function On_reset() {
        scheduleUpdate();
        self.on = false;
        self.state = 'Off';
    }
    function click() {
        switch (self.state) {
        case 'Off':
            return Off_click();
        default:
            return undefined;
        }
    }
    function reset() {
        switch (self.state) {
        case 'On':
            return On_reset();
        default:
            return undefined;
        }
    }
    self.click = click;
    self.reset = reset;
    return self;
}
function add(parent, child) {
    parent.appendChild(child);
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
    cabin = CabinMachine();
    cabin.door = LinearMotor(cabin.onDoor, doorVelocity);
    cabin.motor = AcceleratedMotor(cabin.onArrived, cabinVelocity, accelerationDistance);
    globals.cabin = cabin;
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
        machine: OneWayButton()
    };
    globals.buttons.push(button);
    return button;
}
function createCanvas() {
    var canvas, canvasHeight, mainDiv, scale;
    canvasHeight = getCanvasHeight();
    mainDiv = get('main-container');
    clear(mainDiv);
    canvas = document.createElement('canvas');
    scale = getRetinaFactor();
    canvas.width = canvasWidth * scale;
    canvas.height = canvasHeight * scale;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    add(mainDiv, canvas);
    globals.canvas = canvas;
    globals.retina = scale;
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('mousemove', onHover);
}
function createFloor(number, up, down) {
    var _state_, bottom, centerY, floor, innerBottom, left, nleft, y, y1, y2;
    _state_ = 'Common values';
    while (true) {
        switch (_state_) {
        case 'Common values':
            floor = { number: number };
            bottom = getFloorBottom(number);
            centerY = Math.round(bottom - floorHeight / 2);
            left = canvasPadding + floorWidth + canvasPadding;
            _state_ = 'Floor button';
            break;
        case 'Floor button':
            if (up) {
                if (down) {
                    y1 = centerY - (buttonSize + buttonMargin / 2);
                    y2 = y1 + buttonSize + buttonMargin;
                    floor.up = createButton('up', undefined, left, y1);
                    floor.down = createButton('down', undefined, left, y2);
                    _state_ = 'Cabin button';
                } else {
                    y = centerY - buttonSize / 2;
                    floor.up = createButton('up', undefined, left, y);
                    _state_ = 'Cabin button';
                }
            } else {
                if (down) {
                    y = centerY - buttonSize / 2;
                    floor.down = createButton('down', undefined, left, y);
                    _state_ = 'Cabin button';
                } else {
                    _state_ = 'Cabin button';
                }
            }
            _state_ = 'Cabin button';
            break;
        case 'Cabin button':
            innerBottom = getFloorBottom(1);
            nleft = left + buttonSize + canvasPadding * 2;
            y = innerBottom - canvasPadding - floorThickness - buttonSize - (number - 1) * (buttonSize + buttonMargin);
            floor.inner = createButton('inner', number, nleft, y);
            _state_ = 'Exit';
            break;
        case 'Exit':
            _state_ = undefined;
            globals.floors.push(floor);
            break;
        default:
            return;
        }
    }
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
    var _selectValue_34;
    _selectValue_34 = button.type;
    if (_selectValue_34 === 'up') {
        if (button.machine.on) {
            drawActiveUp(button.x, button.y);
        } else {
            drawNormalUp(button.x, button.y);
        }
    } else {
        if (_selectValue_34 === 'down') {
            if (button.machine.on) {
                drawActiveDown(button.x, button.y);
            } else {
                drawNormalDown(button.x, button.y);
            }
        } else {
            if (_selectValue_34 !== 'inner') {
                throw new Error('Unexpected case value: ' + _selectValue_34);
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
    var _collection_38, button, crect, x, y;
    crect = globals.canvas.getBoundingClientRect();
    x = evt.clientX - crect.left;
    y = evt.clientY - crect.top;
    _collection_38 = globals.buttons;
    for (button of _collection_38) {
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
}
function openDoor(self) {
    self.door.start(1);
}
function rect(x, y, width, height) {
    var ctx;
    ctx = globals.ctx;
    x += 0.5;
    y += 0.5;
    ctx.strokeRect(x, y, width, height);
}
function redraw() {
    var _collection_36, button, canvasHeight, ctx, i;
    ctx = globals.canvas.getContext('2d');
    ctx.scale(globals.retina, globals.retina);
    globals.ctx = ctx;
    ctx.fillStyle = background;
    canvasHeight = getCanvasHeight();
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    for (i = 1; i <= floorCount; i++) {
        drawFloor(i);
    }
    drawCabin(getCabinPos(), getDoorPos());
    _collection_36 = globals.buttons;
    for (button of _collection_36) {
        drawGuiButton(button);
    }
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
    floor = globals.floors[globals.currentFloor];
    if (floor.up) {
        floor.up.machine.reset();
    }
    if (floor.down) {
        floor.down.machine.reset();
    }
    floor.inner.machine.reset();
}
function scheduleUpdate() {
    globals.updateScheduled = true;
    requestAnimationFrame(updateWorld);
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
    globals.target = nextTarget;
    if (globals.target) {
        targetY = floorToPosition(globals.target);
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
    var _state_, nextTarget, targetY;
    _state_ = 'Check';
    while (true) {
        switch (_state_) {
        case 'Check':
            if (self.direction === 'up') {
                nextTarget = findNextTargetUp();
                if (nextTarget && nextTarget < globals.target) {
                    _state_ = 'Set new target';
                } else {
                    _state_ = 'Exit';
                }
            } else {
                nextTarget = findNextTargetDown();
                if (nextTarget && nextTarget > globals.target) {
                    _state_ = 'Set new target';
                } else {
                    _state_ = 'Exit';
                }
            }
            break;
        case 'Set new target':
            globals.target = nextTarget;
            targetY = floorToPosition(globals.target);
            self.motor.newTarget(targetY);
            _state_ = 'Exit';
            break;
        case 'Exit':
            _state_ = undefined;
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