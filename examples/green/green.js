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
function complexAnd(valueA, valueB, valueC) {
    if (!valueA && valueB || valueC) {
        return true;
    } else {
        return false;
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
    var _state_, result;
    _state_ = 'First';
    while (true) {
        switch (_state_) {
        case 'First':
            result = 0;
            if (left === 3) {
                result += right;
                _state_ = 'Second';
            } else {
                _state_ = 'Third';
            }
            break;
        case 'Second':
            result += 2;
            _state_ = 'Third';
            break;
        case 'Third':
            result += 10;
            _state_ = 'Exit';
            break;
        case 'Exit':
            _state_ = undefined;
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
    if (index !== -1) {
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
    var _collection_2, copy, item, key, value2, wrapper;
    copy = {};
    wrapper = { collection: object };
    _collection_2 = wrapper.collection;
    for (key in _collection_2) {
        item = _collection_2[key];
        value2 = item + value;
        copy[key] = value2;
    }
    return copy;
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
function mul(left, right) {
    return multiply(left, right);
}
function pause(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
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
    var _selectValue_5;
    _selectValue_5 = value + 5;
    if (_selectValue_5 === 10 || _selectValue_5 === 20) {
        return 'good';
    } else {
        if (_selectValue_5 !== 30) {
            throw new Error('Unexpected case value: ' + _selectValue_5);
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
    var _selectValue_7;
    _selectValue_7 = value + 5;
    if (_selectValue_7 === 10) {
        return 'ten';
    } else {
        if (_selectValue_7 === 20) {
            return 'twenty';
        } else {
            if (_selectValue_7 !== 30) {
                throw new Error('Unexpected case value: ' + _selectValue_7);
            }
            return 'thirty';
        }
    }
}
function simpleAnd(valueA, valueB, valueC) {
    if (valueA && valueB && valueC) {
        return true;
    } else {
        return false;
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
    complexAnd,
    complexOr,
    complexSilhouette,
    degenerateSelect,
    doWhile,
    doWhileDo,
    earlyExit,
    empty,
    fibonacci,
    fizzBuzz,
    forLoopNoDeclare,
    foreachLoopArray,
    foreachLoopObject,
    generateId,
    getSecret,
    hello,
    mul,
    questionMerge,
    scope3,
    selectArrow,
    selectShortCircuit,
    selectWithDefault,
    selectWithoutDefault,
    simpleAnd,
    simpleOr,
    slow,
    twoExits,
    whileDo
};