var http = require('http');
var persona = require('../')();

var button = document.getElementById('identify');
var whoami = document.getElementById('whoami');

persona.on('id', function (id) {
    if (id) {
        button.value = 'unidentify';
        whoami.textContent = id;
    }
    else button.value = 'identify';
});

persona.on('logout', function () {
    button.value = 'identify';
    whoami.textContent = '';
});

button.addEventListener('click', function () {
    if (!persona.id) {
        persona.identify();
    }
    else persona.unidentify();
});
