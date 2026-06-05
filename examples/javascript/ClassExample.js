function Blue(time) {
    var self = { _type: 'Blue' };
    var title;
    title = 'Dr.';
    function buildGreeting(name) {
        return `Good ${ time }, ${ title } ${ name }!`;
    }
    function greeting(name) {
        var message;
        message = buildGreeting(name);
        console.log(message);
    }
    self.greeting = greeting;
    return self;
}
module.exports = { Blue };