var quotemeta = require('quotemeta');

module.exports = function (opts) {
    return new Persona(opts);
};

function Persona (opts) {
    if (!opts) opts = {};
    if (typeof opts === 'string') opts = { audience: opts };
    this.audience = opts.audience;
    this.prefix = opts.prefix || '/_persona';
    
    this._prefixRegex = RegExp(
        '^' + quotemeta(this.prefix) + '/(login|logout)\\b'
    );
}

Persona.prototype.test = function (req) {
    return req.method === 'POST' && this._prefixRegex.test(req.url);
};

Persona.prototype.handle = function (req, res) {
    res.setHeader('content-type', 'application/json');
    var m = this._prefixRegex.exec(req.url);
    if (!m) { res.statusCode = 404; res.end('not found') }
    else if (m[1] === 'login') {
        res.end('verify...\n');
    }
    else if (m[1] === 'logout') {
        res.end('todo...\n');
    }
};

Persona.prototype.verify = function () {
    // ...
};
