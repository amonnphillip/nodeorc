let process = require('process');
let _ = require('lodash');

class webConfig {
  constructor(someValue) {
    this.someValue = someValue;
  }

  getMessage(call, callback) {
    debugger;
    console.log('HERE inside getMessage!');
    console.log('message from server: ' + call.request.message);
    console.log('this.someValue: ' + this.someValue);
    console.log('process cup usage: ' + JSON.stringify(process.cpuUsage()));
    console.log('lodash is here: ' + _.camelCase('Foo Bar'));
    callback(null, {message: 'response from web'});
  }
}

module.exports = webConfig;