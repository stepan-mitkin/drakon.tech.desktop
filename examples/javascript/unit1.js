function unit1() {
var unit = {};
var name;
function hello(title) {
    return title + ', ' + name;
}
unit.hello = hello;
Object.defineProperty(unit, 'name', {
    get: function () {
        return name;
    },
    set: function (newValue) {
        name = newValue;
    },
    enumerable: true,
    configurable: true
});
return unit;
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        unit1
    };
}
