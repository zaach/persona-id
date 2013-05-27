var identify = document.getElementById('identify');
var email = document.getElementById('email');

identify.addEventListener('click', function () {
    if (identify.value === 'identify') {
        watch(email);
    }
    else {
        navigator.id.logout();
    }
});

var http = require('http');

function watch (user) {
    navigator.id.watch({
        loggedInUser: user,
        onlogin: login,
        onlogout: logout
    });
    navigator.id.request();
    
    function login (assertion) {
        var req = http.request({
            method: 'POST',
            path: '/auth/login',
        });
        req.on('response', function (res) {
            if (!/^2\d\d\b/.test(res.statusCode)) {
                console.error('error code ' + res.statusCode);
                navigator.id.logout();
            }
            res.on('data', function (buf) {
                console.log(String(buf));
            });
        });
        req.end(JSON.stringify({ assertion: assertion }));
    }
    
    function logout () {
        var req = http.request({
            method: 'POST',
            path: '/auth/logout',
        });
        req.on('response', function (res) {
            if (/^2\d\d\b/.test(res.statusCode)) {
                console.error('error code ' + res.statusCode);
            }
            res.on('data', function (buf) {
                console.log(String(buf));
            });
        });
    }
}
