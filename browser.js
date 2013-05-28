var cookies = require('cookie-cutter');
var http = require('http');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var url = require('url');

module.exports = function (opts) { return new Persona(opts) };

function Persona (opts) {
    var self = this;
    
    if (!opts) opts = { route: '/_persona' };
    if (typeof opts === 'string') opts = { route: opts };
    
    var routes = {};
    if (typeof opts.route === 'string') {
        routes.login = opts.route + '/login';
        routes.logout = opts.route + '/logout';
    }
    if (opts.login) routes.login = opts.login;
    if (opts.logout) routes.logout = opts.logout;
    
    if (routes.login) {
        self.on('login', function (assertion) {
            self._login(routes.login, assertion);
        });
    }
    if (routes.logout) {
        self.on('logout', function () {
            self._logout(routes.logout);
        });
    }
    
    self._cookieName = opts.cookieName || '_persona_id';
    self.on('id', function (id) {
        cookies.set(self._cookieName, id);
    });
    
    var user = opts.user || cookies.get(self._cookieName);
    if (user) self._watch(user);
    process.nextTick(function () {
        self.emit('id', user);
    });
}
inherits(Persona, EventEmitter);

Persona.prototype.identify = function () {
    this._watch(null);
    navigator.id.request();
};

Persona.prototype.unidentify = function () {
    navigator.id.logout();
};

Persona.prototype._watch = function (user) {
    var self = this;
    navigator.id.watch({
        loggedInUser: user,
        onlogin: function (assertion) { self.emit('login', assertion) },
        onlogout: function () { self.emit('logout') }
    });
};

Persona.prototype._login = function (uri, assertion) {
    var self = this;
    var u = typeof uri === 'object' ? uri : url.parse(uri);
    var req = http.request({
        method: 'POST',
        host: u.hostname || window.location.hostname,
        port: u.port || window.location.port,
        path: u.path
    });
    req.on('response', function (res) {
        if (!/^2\d\d\b/.test(res.statusCode)) {
            self.id = null;
            var body = '';
            res.on('data', function (buf) { body += buf });
            res.on('end', function () {
                self.emit('error', new Error(
                    'error code ' + res.statusCode + ': ' + body
                ));
            });
            navigator.id.logout();
        }
        else {
            if (res.headers['set-cookie']) {
                document.cookie = res.headers['set-cookie'];
            }
            
            var id = '';
            res.on('data', function (buf) { id += buf });
            res.on('end', function () {
                self.id = id;
                self.emit('id', id);
            });
        }
    });
    req.end(JSON.stringify({ assertion: assertion }));
};

Persona.prototype._logout = function (uri) {
    var self = this;
    self.id = null;
    
    var u = typeof uri === 'object' ? uri : url.parse(uri);
    var req = http.request({
        method: 'POST',
        host: u.hostname || window.location.hostname,
        port: u.port || window.location.port,
        path: u.path
    });
    req.on('response', function (res) {
        if (/^2\d\d\b/.test(res.statusCode)) {
            var body = '';
            res.on('data', function (buf) { body += buf });
            res.on('end', function () {
                self.emit('error', new Error(
                    'error code ' + res.statusCode + ': ' + body
                ));
            });
        }
    });
};
