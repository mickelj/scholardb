var express = require('express');
var app = express();

var bodyparser = require('body-parser');
var index = require('./routes/index');
var massive = require('massive');
var connectionString = "postgres://knyadlimluugnb:ab832b8ca2651471a862e489e4f44f6754019e8c795a20a582e2f64a8ec13c7d@ec2-54-225-240-168.compute-1.amazonaws.com:5432/ddk942mhci1bsc";
var massiveInstance = massive.connectSync({connectionString: connectionString});

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

app.set('db', massiveInstance);

app.use('/', index);

app.listen(app.get('port'), function() {
  console.log('Node app is running on port ', app.get('port'));
});

module.exports = app;
