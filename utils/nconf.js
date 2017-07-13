const nconf = require('nconf');

function Config() {
  nconf.file('env', '../config/environment.json');
}

Config.prototype.get = function(key) {
  return nconf.get(key);
}

module.exports = new Config();
