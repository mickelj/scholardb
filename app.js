const express = require('express');
const app = express();
const nconf = require('nconf');
nconf.file('env', 'config/environment.json');
nconf.file('database', 'config/database.json');

const bodyparser = require('body-parser');
const massive = require('massive');
const connectionString = (process.env.DATABASE_URL || nconf.get('database:connectionString'));
const massiveInstance = massive.connectSync({connectionString: connectionString});

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

app.set('db', massiveInstance);
app.set('nconf', nconf);

// Routes
const index = require('./routes/index');
const works = require('./routes/works');
const people = require('./routes/people');
const departments = require('./routes/departments');
// const publications = require('./routes/publications');
// const publishers = require('./routes/publishers');
app.use('/', index);
app.use('/works', works);
app.use('/people', people);
app.use('/departments', departments);
// app.use('/publications', publications);
// app.use('/publishers', publishers);

app.listen(app.get('port'), function() {
  console.log('Node app is running on port ', app.get('port'));
});

module.exports = app;
