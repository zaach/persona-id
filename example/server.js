var http = require('http');
var fs = require('fs');
var hyperstream = require('hyperstream');
var cookie = require('cookie-cutter');

var persona = require('../')('http://localhost:5000');
var ecstatic = require('ecstatic')(__dirname + '/static');

var sessions = {};

var server = http.createServer(function (req, res) {
console.dir(sessions);
    if (persona.test(req)) {
        var h = persona.handle(req, res);
        h.on('verify', function (id) {
            var sid = Math.random();
            res.setHeader('set-cookie', 'id=' + sid);
            sessions[sid] = id.email;
        });
    }
    else if (req.url === '/') {
        var id = cookie(req.headers.cookie).get('id')
        fs.createReadStream(__dirname + '/static/index.html')
            .pipe(hyperstream({ '#whoami': sessions[id] || '' }))
            .pipe(res)
        ;
        
    }
    else ecstatic(req, res)
});
server.listen(5000);
