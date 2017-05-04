const nodeorcMaster = require('./lib/master.js');

let configPath = __dirname + '/config/'; // TODO: THIS WILL BE SUPPLIED BY THE USER

let master = new nodeorcMaster(configPath);
master.start();


// REST LIKE INTERFACE?

/*
// OR CLI??
let vorpal = require('vorpal')();

vorpal.command('foo', 'Outputs "bar".')
  .action(function(args, callback) {
    master.doClientCall();
    callback();
  });
vorpal.delimiter('nodeorc-cli').show();*/

