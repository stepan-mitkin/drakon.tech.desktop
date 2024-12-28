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
function YellowClass(name, color) {
    var title;
    var self = {};
    title = 'Dr.';
    const greeting = 'Hello';
    function getFullInfo() {
        log('getFullInfo');
        var result = {
            name: name,
            color: color,
            address: self.address
        };
        return result;
    }
    function greet() {
        log('greet');
        return greeting + ', ' + title + ' ' + name + '!';
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