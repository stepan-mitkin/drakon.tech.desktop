function GreyClass() {
    var self = { _type: 'GreyClass' };
    function getValue() {
        log('getValue');
        return smarterAdd(self.value, 20);
    }
    function init(value) {
        self.value = value;
    }
    self.getValue = getValue;
    self.init = init;
    return self;
}
function YellowClass(name, color, arg1, arg2) {
    var self = { _type: 'YellowClass' };
    var title;
    title = 'Dr.';
    const greeting = 'Hello';
    const {x, y} = arg1;
    var [a, b] = arg2;
    function getFullInfo() {
        var result;
        log('getFullInfo');
        a = 1000;
        result = {
            name: name,
            color: color,
            address: self.address,
            a: a,
            b: b,
            x: x,
            y: y
        };
        return result;
    }
    function greet() {
        var message;
        log('greet');
        message = greeting + ', ' + title + ' ' + name + '!';
        return message;
    }
    function setName(newName) {
        log('setName: ' + newName);
        name = newName;
    }
    function setTitle(newTitle) {
        log('setTitle: ' + newTitle);
        title = newTitle;
    }
    self.getFullInfo = getFullInfo;
    self.greet = greet;
    self.setName = setName;
    self.setTitle = setTitle;
    return self;
}
function log(message) {
    console.log('GreyClass', message);
}
function runGrey() {
    var grey;
    grey = GreyClass();
    grey.init(42);
    return grey.getValue();
}
function smarterAdd(left, right) {
    return (left + right) * 2;
}
module.exports = {
    GreyClass,
    YellowClass,
    runGrey
};