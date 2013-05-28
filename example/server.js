var http = require('http');
var ecstatic = require('ecstatic')(__dirname + '/static');
var persona = require('../')('http://localhost:5000');

var server = http.createServer(function (req, res) {
    if (persona.test(req)) {
        persona.handle(req, res);
    }
    else ecstatic(req, res)
});
server.listen(5000);
