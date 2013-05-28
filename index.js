var quotemeta = require('quotemeta');
var concat = require('concat-stream');
var hyperquest = require('hyperquest');
var qs = require('querystring');
var EventEmitter = require('events').EventEmitter;

module.exports = function (opts, cb) {
    return new Persona(opts, cb);
};

function Persona (opts, cb) {
    if (!opts) opts = {};
    if (typeof opts === 'string') opts = { audience: opts };
    this.audience = opts.audience;
    this.prefix = opts.prefix || '/_persona';
    this.verifier = opts.verify || 'https://verifier.login.persona.org/verify';
    
    this._prefixRegex = RegExp(
        '^' + quotemeta(this.prefix) + '/(login|logout)\\b'
    );
    this.sessionCallback = cb || function () {};
}

Persona.prototype.test = function (req) {
    return req.method === 'POST' && this._prefixRegex.test(req.url);
};

Persona.prototype.handle = function (req, res, cb) {
    var self = this;
    var hEvents = new EventEmitter;
    if (cb) hEvents.on('identify', cb);
    
    res.setHeader('content-type', 'application/json');
    
    var m = this._prefixRegex.exec(req.url);
    if (!m) { res.statusCode = 404; res.end('not found') }
    else if (m[1] === 'login') {
        req.pipe(concat(function (body) {
            try { var msg = JSON.parse(body) }
            catch (err) { res.statusCode = 400; res.end(err + '\n'); return }
            
            self.verify(msg.assertion, function (err, id) {
                if (err) {
                    res.statusCode = id && id.code || 500;
                    res.end(err + '\n');
                    return;
                }
                else if (!id) {
                    res.statusCode = 400;
                    res.end('bad request\n');
                }
                else {
                    hEvents.emit('identify', id);
                    res.end(JSON.stringify({ 
                        id: id.email,
                        cookie: self.sessionCallback(id) || {}
                    }));
                }
            });
        }));
    }
    else if (m[1] === 'logout') {
        res.end('todo...\n');
    }
    
    return hEvents;
};

Persona.prototype.verify = function (assertion, cb) {
    var self = this;
    var hq = hyperquest.post(self.verifier);
    var payload = JSON.stringify({
        assertion: assertion,
        audience: this.audience
    });
    
    hq.setHeader('content-type', 'application/json');
    hq.setHeader('content-length', payload.length + '');
    
    hq.pipe(concat(function (body) {
        try { var msg = JSON.parse(body) }
        catch (err) {
            return cb('parse error: ' + err + ' while parsing: ' + body);
        }
        
        if (!msg || typeof msg !== 'object') {
            return cb('unexpected response type ' + typeof msg);
        }
        if (msg.status !== 'okay') {
            return cb('response not ok: ' + msg.reason);
        }
        
        if (msg.status !== 'okay' || typeof msg.email !== 'string') {
            cb(null, null);
        }
        else cb(null, msg);
        
    }));
    
    hq.end(payload);
};
