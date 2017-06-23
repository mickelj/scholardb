// App Dependencies
const express = require('express');
const app = express();
const nconf = require('nconf');
const bodyparser = require('body-parser');
const massive = require('massive');

// Initialize configuration
nconf.file('env', 'config/environment.json');
nconf.file('database', 'config/database.json');
const connectionString = (process.env.DATABASE_URL || nconf.get('database:connectionString'));
const massiveInstance = massive.connectSync({connectionString: connectionString});
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
app.set('db', massiveInstance);
app.set('nconf', nconf);
app.locals._ = require("underscore");

// Routes
const index = require('./routes/index');
const works = require('./routes/works');
const people = require('./routes/people');
const departments = require('./routes/departments');
const journals = require('./routes/journals');
const publishers = require('./routes/publishers');
const search = require('./routes/search');
app.use('/', index);
app.use('/works', works);
app.use('/people', people);
app.use('/departments', departments);
app.use('/journals', journals);
app.use('/publishers', publishers);
app.use('/search', search);

// Fire up the app
app.listen(app.get('port'), function() {
  console.log('Node app is running on port ', app.get('port'));
});

module.exports = app;
