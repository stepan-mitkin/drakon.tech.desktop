
function Blue(time)
    local self = {_type="Blue"}
    local title
    title = "Dr."
    
    function buildGreeting(name)
        return "Good " .. time .. ", " .. title ..
        " " .. name .. "!"
    end
    
    function greeting(name)
        local message
        message = buildGreeting(name)
        print(message)
    end
    
    self.greeting = greeting
    return self
end

return {
    Blue = Blue
}