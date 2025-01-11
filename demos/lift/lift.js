var globals;
const canvasWidth = 600;
const canvasPadding = 30;
const doorWidth = 80;
const doorHeight = 130;
const floorThickness = 20;
const floorWidth = 160;
const floorHeight = 180;
const cabinThickness = 10;
const floorCount = 4;
const fontFace = 'Arial';
const fontSize = 17;
const buttonSize = 40;
const activeButton = 'yellow';
const normalButton = '#f0f0f0';
const background = 'white';
const lineColor = 'black';
const openColor = '#8a98d1';
globals = { canvas: undefined };
window.addEventListener('load', main);
function add(parent, child) {
    parent.appendChild(child);
}
function buildStructures() {
    globals.floors = [undefined];
    globals.delta = 0;
    createFloor(1, true, false);
    createFloor(2, true, true);
    createFloor(3, true, true);
    createFloor(4, false, true);
    globals.currentFloor = 1;
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
}
function createFloor(number, up, down) {
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
    bottom = canvasHeight - canvasPadding - (number - 1) * floorHeight;
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
function get(id) {
    var element;
    element = document.getElementById(id);
    if (element) {
        return element;
    } else {
        throw new Error('Element not found ' + id);
    }
}
function getCanvasHeight() {
    return canvasPadding * 2 + floorCount * floorHeight;
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
function rect(x, y, width, height) {
    var ctx;
    ctx = globals.ctx;
    x += 0.5;
    y += 0.5;
    ctx.strokeRect(x, y, width, height);
}
function redraw() {
    var canvasHeight, ctx, i;
    ctx = globals.canvas.getContext('2d');
    ctx.scale(globals.retina, globals.retina);
    globals.ctx = ctx;
    ctx.fillStyle = background;
    canvasHeight = getCanvasHeight();
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    for (i = 1; i <= floorCount; i++) {
        drawFloor(i);
    }
    drawCabin(canvasHeight - canvasPadding - floorThickness, 0);
    drawCabin(canvasHeight - canvasPadding - floorThickness - floorHeight * 2, 1);
    drawActiveButton(350, 100, '2');
    drawNormalButton(350, 200, '4');
    drawActiveUp(400, 150);
    drawNormalUp(400, 200);
    drawActiveDown(300, 150);
    drawNormalDown(300, 200);
}
function takeCabinPositionFromFloor() {
    var canvasHeight;
    canvasHeight = getCanvasHeight();
    globals.cabinPos = canvasHeight - canvasPadding - (globals.currentFloor - 1) * floorHeight - floorThickness;
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
    redraw();
    if (globals.requestRedraw) {
        globals.requestRedraw = false;
        requestAnimationFrame(updateWorld);
    }
}