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
        255,
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
module.exports = { calculateYellow };