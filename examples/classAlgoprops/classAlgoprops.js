function Lilla() {
    var self = {};
    var lower, total, upper;
    function _calc_lower() {
        return 20;
    }
    function _calc_total() {
        _compute_lower();
        return lower + upper;
    }
    function _calc_upper() {
        return 10;
    }
    function getTotal() {
        _compute_total();
        return total;
    }
    function _compute_lower() {
        lower = _calc_lower();
    }
    function _compute_total() {
        upper = _calc_upper();
        total = _calc_total();
    }
    self.getTotal = getTotal;
    return self;
}
function Lime() {
    var self = {};
    var bar, foo;
    function _calc_bar() {
        return 5 + foo;
    }
    async function _calc_foo() {
        await pause(1);
        return 10;
    }
    async function getBar() {
        await _compute_bar();
        return bar;
    }
    async function _compute_bar() {
        foo = await _calc_foo();
        bar = _calc_bar();
    }
    self.getBar = getBar;
    return self;
}
function Pink(redValue) {
    var self = {};
    var index, orange, red, yellow;
    function _calc_index() {
        return 1;
    }
    function _calc_orange() {
        return {
            yellow: red[0],
            red: 100,
            blue: 0
        };
    }
    function _calc_red() {
        return [
            redValue,
            10,
            0
        ];
    }
    function _calc_yellow() {
        var x;
        x = orange.yellow + red[index];
        return x * 2;
    }
    function calculateYellow() {
        _compute_yellow();
        return yellow;
    }
    function _compute_yellow() {
        red = _calc_red();
        orange = _calc_orange();
        index = _calc_index();
        yellow = _calc_yellow();
    }
    self.calculateYellow = calculateYellow;
    return self;
}
function pause(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
module.exports = {
    Lilla,
    Lime,
    Pink
};