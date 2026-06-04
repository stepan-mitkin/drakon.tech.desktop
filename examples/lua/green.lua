local multiply
multiply = require("exampleslua2604.ops")
.multiply
local secretValue = 23;
local nextId = 1

function add(left, right)
    local result
    result = addCore(left, right)
    return result
end

function addCore(left, right)
    return left + right
end

function complexAnd(valueA, valueB, valueC)
    if ((not (valueA)) and (valueB)) or (valueC) then
        return true
    else
        return false
    end
end

function complexOr(valueA, valueB, valueC)
    if (valueA) or ((not (valueB)) and (valueC)) then
        return true
    else
        return false
    end
end

function complexSilhouette(left, right)
    local _branch_, result
    _branch_ = "First"
    while true do
        if _branch_ == "First" then
            _branch_ = nil
            result = 0
            if left == 3 then
                result = result + right
                _branch_ = "Second"
            else
                _branch_ = "Third"
            end
        elseif _branch_ == "Second" then
            _branch_ = nil
            result = result + 2
            _branch_ = "Third"
        elseif _branch_ == "Third" then
            _branch_ = nil
            result = result + 10
            _branch_ = "Exit"
        elseif _branch_ == "Exit" then
            _branch_ = nil
            return result
        else
            return
        end
    end
end

function degenerateSelect(value)
    if value == 10 then
        return "ten"
    else
        return "other"
    end
end

function doWhile()
    local result
    result = 0
    while true do
        result = result + 3
        if result > 20 then
            break
        end
    end
    return
    result
end

function doWhileDo()
    local result
    result = 0
    while true do
        result = result + 7
        if result > 20 then
            break
        else
            result = result + 3
        end
    end
    return result
end

function earlyExit(array, value)
    local i, index
    index = -1
    i = 1
    while i <= #array do
        if array[i] == value then
            index = i
            break
        else
            i = i + 1
        end
    end
    if not (index == -1) then
        table.remove(array, index)
    end
    return array
end

function empty()
end

function fibonacci(ordinal)
    local i, i_1, i_2, result
    if (ordinal == 0) or (ordinal == 1) then
        result = ordinal
        return result
    else
        i_2 = 0
        i_1 = 1
        i = 2
        while i <= ordinal do
            result = i_2 + i_1
            i_2 = i_1
            i_1 = result
            i = i + 1
        end
        return result
    end
end

function fizzBuzz(number)
    if number % 3 == 0 then
        if number % 5 == 0 then
            return 'FizzBuzz'
        else
            return 'Fizz'
        end
    else
        if number % 5 == 0 then
            return 'Buzz'
        else
            return nil
        end
    end
end

function forEachUntil(array, action)
    local mustExit
    for _, element in ipairs(array) do
        mustExit = action(element)
        if mustExit then
            break
        end
    end
end

function forLoopNoDeclare(array)
    local copy, i, key, value
    copy = {}
    i = 1
    while i <  # array do
        key = array[i]
        value = array[i + 1]
        copy[key] = value
        i = i + 2
    end
    return copy
end

function foreachLoopArray(array, value)
    local copy, value2
    copy = {}
    for _, item in ipairs(array) do
        value2 = item + value
        table.insert(copy, value2)
    end
    return copy
end

function foreachLoopObject(object, value)
    local copy, value2, wrapper
    copy = {}
    wrapper = {collection = object}
    for key, item in pairs(wrapper.collection) do
        value2 = item + value
        copy[key] = value2
    end
    return copy
end

function generateId()
    local id
    id = nextId
    nextId = nextId + 1
    return id
end

function getSecret()
    return secretValue
end

function hello()
    print("Hello, world")
end

function inversedAnd(one, two, three)
    if ((one == 1) or (two == 2)) or (three == 3) then
        return false 
    else
        return true 
    end
end

function inversedOr(one, two, three)
    if ((one == 1) and (two == 2)) and (three == 3) then
        return false 
    else
        return true 
    end
end

function monitorPaymentStatus(status, dataStatus, output)
    local _branch_
    _branch_ = "Check payment on server"
    while true do
        if _branch_ == "Check payment on server" then
            _branch_ = nil
            if status == 200 then
                if dataStatus == "completed" then
                    _branch_ = "Exit"
                else
                    if dataStatus == "waiting" then
                        output.waited = true
                        dataStatus = "completed"
                        _branch_ = "Check payment on server"
                    else
                        _branch_ = "Exit"
                    end
                end
            else
                _branch_ = "Exit"
            end
        elseif _branch_ == "Exit" then
            _branch_ = nil
        else
            return
        end
    end
end

function mul(left, right)
    return multiply(left, right)
end

function noDublicates(x, y)
    local i, result
    if x > 0 then
        result = 1000
        i = 0
        while i < x + y do
            result = result + i
            i = i + 1
        end
        return result
    else
        x = -x
        if y > 0 then
            result = 1000
            i = 0
            while i < x + y do
                result = result + i
                i = i + 1
            end
            return result
        else
            return -1
        end
    end
end

function questionMerge(left, right)
    local result
    result = 0
    if left then
        result = result + 10
    else
        result = result + 1
        if right then
            result = result + 10
        else
            result = result + 5
        end
    end
    return result
end

function scope3(array, sortProp, cutoff)
    local a, found, result
    result = nil
    found = nil
    a = nil
    table.sort(
        array,
        function (a, b)
        local left = a[sortProp]
        local right = b[sortProp]
        if left < right
        then return true
        end if left > right
        then return false
        end a = "what?"
        return false
        end 
    )
    forEachUntil(
        array,
        function (element)
        local e2 = element.value * 2
        if e2 > cutoff
        then result = e2
        found = element
        return true
        end return false
        end 
    )
    return {
        result = result,
        found = found
    }
end

function selectArrow()
    local result
    result = 0
    while true do
        if result == 10 then
            break
        else
            if result == 5 then
                result = result + 2
            else
                result = result + 1
            end
        end
    end
    return result
end

function selectShortCircuit(value)
    local _var7
    _var7 = value + 5
    if (_var7 == 10) or (_var7 == 20) then
        return "good"
    else
        if not (_var7 == 30) then
            error("Unexpected case value: " .. tostring(_var7))
        end
        return "bad"
    end
end

function selectWithDefault(value)
    if value == 10 then
        return "ten"
    else
        if value == 20 then
            return "twenty"
        else
            return "other"
        end
    end
end

function selectWithoutDefault(value)
    local _var9
    _var9 = value + 5
    if _var9 == 10 then
        return "ten"
    else
        if _var9 == 20 then
            return "twenty"
        else
            if not (_var9 == 30) then
                error("Unexpected case value: " .. tostring(_var9))
            end
            return "thirty"
        end
    end
end

function sil2(value)
    local foo
    if value >= 0 then
        if value % 10 == 0 then
            foo = value * 10
        else
            foo = value * 10
        end
    else
        foo = value * 10
    end
    foo = foo + 5
    return foo
end

function simpleAnd(valueA, valueB, valueC)
    if ((valueA) and (valueB)) and (valueC) then
        return true
    else
        return false
    end
end

function simpleOr(valueA, valueB, valueC)
    if ((valueA) or (valueB)) or (valueC) then
        return true
    else
        return false
    end
end

function twoExits(array, value)
    local i, item
    if not (array) then
        array = {}
    end
    i = 1
    while true do
        if i <= #array then
            item = array[i]
            if item == value then
                return i
            else
                i = i + 1
            end
        else
            return -1
        end
    end
end

function whileDo()
    local result
    result = 0
    while true do
        if result > 20 then
            break
        else
            result = result + 3
        end
    end
    return result
end

return {
    add = add,
    complexAnd = complexAnd,
    complexOr = complexOr,
    complexSilhouette = complexSilhouette,
    degenerateSelect = degenerateSelect,
    doWhile = doWhile,
    doWhileDo = doWhileDo,
    earlyExit = earlyExit,
    empty = empty,
    fibonacci = fibonacci,
    fizzBuzz = fizzBuzz,
    forLoopNoDeclare = forLoopNoDeclare,
    foreachLoopArray = foreachLoopArray,
    foreachLoopObject = foreachLoopObject,
    generateId = generateId,
    getSecret = getSecret,
    hello = hello,
    inversedAnd = inversedAnd,
    inversedOr = inversedOr,
    monitorPaymentStatus = monitorPaymentStatus,
    mul = mul,
    noDublicates = noDublicates,
    questionMerge = questionMerge,
    scope3 = scope3,
    selectArrow = selectArrow,
    selectShortCircuit = selectShortCircuit,
    selectWithDefault = selectWithDefault,
    selectWithoutDefault = selectWithoutDefault,
    sil2 = sil2,
    simpleAnd = simpleAnd,
    simpleOr = simpleOr,
    twoExits = twoExits,
    whileDo = whileDo
}