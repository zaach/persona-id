var http = require('http');
var fs = require('fs');
var hyperstream = require('hyperstream');
var cookie = require('cookie-cutter');
var ecstatic = require('ecstatic')(__dirname + '/static');

var sessions = {};
var personaId = require('../');
var persona = personaId('http://localhost:5000', function (id) {
    var sid = Math.random();
    sessions[sid] = id.email;
    return { session_id: sid };
});

var server = http.createServer(function (req, res) {
    if (persona.test(req)) {
        persona.handle(req, res);
    }
    else if (req.url === '/') {
        var id = cookie(req.headers.cookie).get('session_id')
        fs.createReadStream(__dirname + '/static/index.html')
            .pipe(hyperstream({ '#whoami': sessions[id] || '' }))
            .pipe(res)
        ;
    }
    else ecstatic(req, res)
});
server.listen(5000);
