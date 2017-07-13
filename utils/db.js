const massive = require('massive');
const nconf = require('nconf');
nconf.file('database', '../config/database.json');

const connectionString = (process.env.DATABASE_URL || nconf.get('database:connectionString'));
module.exports = massive.connectSync({connectionString: connectionString});
