const nconf = require('nconf');
nconf.file('env', '../config/environment.json');

module.exports = nconf;
