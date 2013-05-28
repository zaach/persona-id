var http = require('http');
var persona = require('../')('/auth');

var button = document.getElementById('identify');

persona.on('id', function (id) {
    button.value = 'unidentify as ' + id;
});

persona.on('logout', function () {
    button.value = 'identify';
});

button.addEventListener('click', function () {
    if (!persona.id) {
        persona.identify();
    }
    else persona.unidentify();
});
