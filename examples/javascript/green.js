var secretValue;
const {multiply} = require('./ops');
secretValue = 23;
var nextId = 1;
function add(left, right) {
    var result;
    result = addCore(left, right);
    return result;
}
function addCore(left, right) {
    return left + right;
}
function badShortCircuit(x, y) {
    if (!(!(x === 10) || y === 20)) {
        return 'red';
    }
    return 'black';
}
function complexAnd(valueA, valueB, valueC) {
    if (!valueA && valueB || valueC) {
        return true;
    } else {
        return false;
    }
}
function complexCatch(arg) {
    var _branch_, result;
    try {
        _branch_ = 'Do';
        while (true) {
            switch (_branch_) {
            case 'Do':
                result = arg.getTime();
                if (result >= 0) {
                    _branch_ = 'One more';
                } else {
                    _branch_ = 'Exit';
                }
                break;
            case 'One more':
                result *= 1000;
                _branch_ = 'Exit';
                break;
            case 'Exit':
                _branch_ = undefined;
                if (!result) {
                    result += 1;
                }
                return result;
            default:
                return;
            }
        }
    } catch (_handlerData_) {
        console.log(_handlerData_.message);
        return -1;
    }
}
function complexOr(valueA, valueB, valueC) {
    if (valueA || !valueB && valueC) {
        return true;
    } else {
        return false;
    }
}
function complexSilhouette(left, right) {
    var _branch_, result;
    _branch_ = 'First';
    while (true) {
        switch (_branch_) {
        case 'First':
            result = 0;
            if (left === 3) {
                result += right;
                _branch_ = 'Second';
            } else {
                _branch_ = 'Third';
            }
            break;
        case 'Second':
            result += 2;
            _branch_ = 'Third';
            break;
        case 'Third':
            result += 10;
            _branch_ = 'Exit';
            break;
        case 'Exit':
            _branch_ = undefined;
            return result;
        default:
            return;
        }
    }
}
function degenerateSelect(value) {
    if (value === 10) {
        return 'ten';
    } else {
        return 'other';
    }
}
function doWhile() {
    var result;
    result = 0;
    while (true) {
        result += 3;
        if (result > 20) {
            break;
        }
    }
    return result;
}
function doWhileDo() {
    var result;
    result = 0;
    while (true) {
        result += 7;
        if (result > 20) {
            break;
        } else {
            result += 3;
        }
    }
    return result;
}
function earlyExit(array, value) {
    var i, index;
    index = -1;
    for (i = 0; i < array.length; i++) {
        if (array[i] === value) {
            index = i;
            break;
        }
    }
    console.log('index', index);
    if (!(index === -1)) {
        array.splice(index, 1);
    }
    return array;
}
function empty() {
}
function fibonacci(ordinal) {
    var i, i_1, i_2, result;
    if (ordinal === 0 || ordinal === 1) {
        result = ordinal;
        return result;
    } else {
        i_2 = 0;
        i_1 = 1;
        for (i = 2; i <= ordinal; i++) {
            result = i_2 + i_1;
            i_2 = i_1;
            i_1 = result;
        }
        return result;
    }
}
function fibonacciSil(ordinal) {
    var _branch_, i, i_1, i_2, result;
    _branch_ = 'Simple case';
    while (true) {
        switch (_branch_) {
        case 'Simple case':
            if (ordinal === 0 || ordinal === 1) {
                result = ordinal;
                _branch_ = 'Exit';
            } else {
                i_2 = 0;
                i_1 = 1;
                i = 2;
                _branch_ = 'Fibonacci loop';
            }
            break;
        case 'Fibonacci loop':
            if (i > ordinal) {
                _branch_ = 'Exit';
            } else {
                result = i_2 + i_1;
                i_2 = i_1;
                i_1 = result;
                i++;
                _branch_ = 'Fibonacci loop';
            }
            break;
        case 'Exit':
            _branch_ = undefined;
            return result;
        default:
            return;
        }
    }
}
function fizzBuzz(number) {
    if (number % 3 === 0) {
        if (number % 5 === 0) {
            return 'FizzBuzz';
        } else {
            return 'Fizz';
        }
    } else {
        if (number % 5 === 0) {
            return 'Buzz';
        } else {
            return undefined;
        }
    }
}
function forArray(array) {
    var count, i, item;
    count = array.length;
    for (i = 0; i < count; i++) {
        item = array[i];
        console.log(item);
    }
}
function forEachUntil(array, action) {
    var element, mustExit;
    for (element of array) {
        mustExit = action(element);
        if (mustExit) {
            break;
        }
    }
}
function forLoopNoDeclare(array) {
    var copy, i, key, value;
    copy = {};
    for (i = 0; i < array.length; i += 2) {
        key = array[i];
        value = array[i + 1];
        copy[key] = value;
    }
    return copy;
}
function foreachArray(array) {
    var item;
    for (item of array) {
        console.log(item);
    }
}
function foreachLoopArray(array, value) {
    var copy, item, value2;
    copy = [];
    for (item of array) {
        value2 = item + value;
        copy.push(value2);
    }
    return copy;
}
function foreachLoopObject(object, value) {
    var _collection_49, copy, item, key, value2, wrapper;
    copy = {};
    wrapper = { collection: object };
    _collection_49 = wrapper.collection;
    for (key in _collection_49) {
        item = _collection_49[key];
        value2 = item + value;
        copy[key] = value2;
    }
    return copy;
}
function foreachMap(map) {
    var item, key;
    for (key in map) {
        item = map[key];
        console.log(key, item);
    }
}
function generateId() {
    var id;
    id = nextId;
    nextId = nextId + 1;
    return id;
}
function getSecret() {
    return secretValue;
}
function hello() {
    console.log('Hello, world');
}
function inversedAnd(one, two, three) {
    if (one === 1 && two === 2 && three === 3) {
        return false;
    } else {
        return true;
    }
}
function inversedOr(one, two, three) {
    if (one === 1 || two === 2 || three === 3) {
        return false;
    } else {
        return true;
    }
}
function monitorPaymentStatus(status, dataStatus, output) {
    var _branch_;
    _branch_ = 'Check payment on server';
    while (true) {
        switch (_branch_) {
        case 'Check payment on server':
            if (status == 200) {
                if (dataStatus === 'completed') {
                    _branch_ = 'Exit';
                } else {
                    if (dataStatus === 'waiting') {
                        output.waited = true;
                        dataStatus = 'completed';
                        _branch_ = 'Check payment on server';
                    } else {
                        _branch_ = 'Exit';
                    }
                }
            } else {
                _branch_ = 'Exit';
            }
            break;
        case 'Exit':
            _branch_ = undefined;
            break;
        default:
            return;
        }
    }
}
function mul(left, right) {
    return multiply(left, right);
}
function noDublicates(x, y) {
    var i, result;
    if (x > 0) {
        result = 1000;
        for (i = 0; i < x + y; i++) {
            result += i;
        }
        return result;
    } else {
        x = -x;
        if (y > 0) {
            result = 1000;
            for (i = 0; i < x + y; i++) {
                result += i;
            }
            return result;
        } else {
            return -1;
        }
    }
}
function pause(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
function question(value) {
    if (value >= 0) {
        console.log('neg');
    } else {
        console.log('pos');
    }
}
function questionMerge(left, right) {
    var result;
    result = 0;
    if (left) {
        result += 10;
    } else {
        result++;
        if (right) {
            result += 10;
        } else {
            result += 5;
        }
    }
    return result;
}
function scope3(array, sortProp, cutoff) {
    var found, result;
    result = undefined;
    found = undefined;
    array.sort((a, b) => {
        var left, right;
        left = a[sortProp];
        right = b[sortProp];
        if (left < right) {
            return -1;
        }
        if (left > right) {
            return 1;
        }
        a = 'what?';
        return 0;
    });
    forEachUntil(array, function (element) {
        var e2;
        e2 = element.value * 2;
        if (e2 > cutoff) {
            result = e2;
            found = element;
            return true;
        }
        return false;
    });
    return {
        result,
        found
    };
}
function select(value) {
    if (value === 10) {
        return 'ten';
    } else {
        if (value === 20) {
            return 'twenty';
        } else {
            return 'other';
        }
    }
}
function selectArrow() {
    var result;
    result = 0;
    while (true) {
        if (result === 10) {
            break;
        } else {
            if (result === 5) {
                result += 2;
            } else {
                result++;
            }
        }
    }
    return result;
}
function selectShortCircuit(value) {
    var _selectValue_53;
    _selectValue_53 = value + 5;
    if (_selectValue_53 === 10 || _selectValue_53 === 20) {
        return 'good';
    } else {
        if (!(_selectValue_53 === 30)) {
            throw new Error('Unexpected case value: ' + _selectValue_53);
        }
        return 'bad';
    }
}
function selectWithDefault(value) {
    if (value === 10) {
        return 'ten';
    } else {
        if (value === 20) {
            return 'twenty';
        } else {
            return 'other';
        }
    }
}
function selectWithoutDefault(value) {
    var _selectValue_55;
    _selectValue_55 = value + 5;
    if (_selectValue_55 === 10) {
        return 'ten';
    } else {
        if (_selectValue_55 === 20) {
            return 'twenty';
        } else {
            if (!(_selectValue_55 === 30)) {
                throw new Error('Unexpected case value: ' + _selectValue_55);
            }
            return 'thirty';
        }
    }
}
function sil2(value) {
    var foo;
    if (value >= 0) {
        if (value % 10 === 0) {
            foo = value * 10;
        } else {
            foo = value * 10;
        }
    } else {
        foo = value * 10;
    }
    foo += 5;
    return foo;
}
function simpleAnd(valueA, valueB, valueC) {
    if (valueA && valueB && valueC) {
        return true;
    } else {
        return false;
    }
}
function simpleCatch(arg) {
    var result;
    try {
        result = arg.getTime();
        return result;
    } catch (_handlerData_) {
        console.log(_handlerData_.message);
        return -1;
    }
}
function simpleOr(valueA, valueB, valueC) {
    if (valueA || valueB || valueC) {
        return true;
    } else {
        return false;
    }
}
async function slow() {
    console.log('slow', 'start');
    await pause(1000);
    console.log('slow', 'end');
}
function twoExits(array, value) {
    var i, index, item;
    if (!array) {
        array = [];
    }
    i = 0;
    while (true) {
        if (i < array.length) {
            item = array[i];
            if (item === value) {
                index = i;
                break;
            } else {
                i++;
            }
        } else {
            index = -1;
            break;
        }
    }
    return index;
}
function whileDo() {
    var result;
    result = 0;
    while (true) {
        if (result > 20) {
            break;
        } else {
            result += 3;
        }
    }
    return result;
}
module.exports = {
    add,
    badShortCircuit,
    complexAnd,
    complexCatch,
    complexOr,
    complexSilhouette,
    degenerateSelect,
    doWhile,
    doWhileDo,
    earlyExit,
    empty,
    fibonacci,
    fibonacciSil,
    fizzBuzz,
    forLoopNoDeclare,
    foreachLoopArray,
    foreachLoopObject,
    generateId,
    getSecret,
    hello,
    inversedAnd,
    inversedOr,
    monitorPaymentStatus,
    mul,
    noDublicates,
    questionMerge,
    scope3,
    select,
    selectArrow,
    selectShortCircuit,
    selectWithDefault,
    selectWithoutDefault,
    sil2,
    simpleAnd,
    simpleCatch,
    simpleOr,
    slow,
    twoExits,
    whileDo
};