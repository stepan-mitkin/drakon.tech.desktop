function GreyClass(value) {
    var self = {};
    function getValue() {
        log('getValue');
        return value;
    }
    function log(message) {
        console.log('GreyClass', message);
    }
    self.getValue = getValue;
    return self;
}
function YellowClass(name, color, arg1, arg2) {
    var self = {};
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
    function log(message) {
        console.log('YellowClass', message);
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
function runGrey() {
    var grey;
    grey = GreyClass(42);
    return grey.getValue();
}
module.exports = {
    YellowClass,
    runGrey
};