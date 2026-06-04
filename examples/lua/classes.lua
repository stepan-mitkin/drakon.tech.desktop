
function GreyClass()
    local self = {_type="GreyClass"}
    
    function getValue()
        log("getValue")
        return smarterAdd(self.value, 20)
    end
    
    function init(value)
        self.value = value
    end
    
    function log(message)
        print("GreyClass " .. message)
    end
    
    function smarterAdd(left, right)
        return (left + right) * 2
    end
    
    self.getValue = getValue
    self.init = init
    return self
end

function YellowClass(name, color, arg1, arg2)
    local self = {_type="YellowClass"}
    local a, b, title, x, y
    title = "Dr."
    local
    greeting = "Hello"
    x = arg1.x
    y = arg1.y
    a = arg2[1]
    b = arg2[2]
    
    function getFullInfo()
        local result
        log("getFullInfo")
        a = 1000
        result = {
            name = name,
            color = color,
            address = self.address,
            a = a,
            b = b,
            x = x,
            y = y
        }
        return result
    end
    
    function greet()
        local message
        log("greet")
        message = greeting .. ", " .. title .. " " ..
        name .. "!"
        return message
    end
    
    function log(message)
        print("YellowClass " .. message)
    end
    
    function setName(newName)
        log("setName: " .. newName)
        name = newName
    end
    
    function setTitle(newTitle)
        log("setTitle: " .. newTitle)
        title = newTitle
    end
    
    self.getFullInfo = getFullInfo
    self.greet = greet
    self.setName = setName
    self.setTitle = setTitle
    return self
end

function runGrey()
    local grey
    grey = GreyClass()
    grey.init(42)
    return grey.getValue()
end

return {
    YellowClass = YellowClass,
    runGrey = runGrey
}