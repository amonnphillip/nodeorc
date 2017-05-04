const nodeorcMinion = require('./lib/minion.js');

let configPath = __dirname + '/config/'; // TODO: THIS WILL BE SUPPLIED BY THE USER

let minion = new nodeorcMinion(configPath);
minion.start().catch((err) => {
  // TODO: Should clean up and exit!
  console.log('ERROR! Could not start minion');
  console.dir(err);
});

