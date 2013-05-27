var http = require('http');
var ecstatic = require('ecstatic')(__dirname + '/static');

var server = http.createServer(function (req, res) {
    console.log(req.method + ' ' + req.url);
    if (/^(PUT|POST)$/.test(req.method)) {
        req.pipe(process.stdout, { end: false });
        res.end('beep boop\n');
    }
    else ecstatic(req, res)
});
server.listen(5000);
