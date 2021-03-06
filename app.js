// App-wide Dependencies
const express = require('express'); 
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const errors = require('./utils/errorHandler');
const passport = require('passport');
const flash = require('connect-flash');
const nconf = require('nconf');
const fileUpload = require('express-fileupload');
const app = express();

// Initialize configuration
nconf.file('env', './config/environment.json');
app.set('port', (process.env.PORT || 5000));
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
app.set('nconf', nconf);

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  store:  new RedisStore({url: process.env.REDIS_URL}),
  secret: process.env.SECRET_AUTH_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1800000      // 30 minutes
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 },
}));
app.use(express.static(__dirname + '/public'));
app.use('/materialize', express.static(__dirname + '/node_modules/materialize-css/dist'));
app.use(errors.logErrors);
app.use(errors.clientErrorHandler);
app.use(errors.errorHandler);

// Allow access to libraries in Pug templates
app.locals._ = require("underscore");
app.locals.moment = require("moment");

// Routes
const index = require('./routes/index');
const works = require('./routes/works');
const people = require('./routes/people');
const departments = require('./routes/departments');
const publications = require('./routes/publications');
const publishers = require('./routes/publishers');
const search = require('./routes/search');
const auth = require('./routes/auth');
const admin = require('./routes/admin');
const user = require('./routes/user');
app.use('/', index);
app.use('/works', works);
app.use('/people', people);
app.use('/departments', departments);
app.use('/publications', publications);
app.use('/publishers', publishers);
app.use('/search', search);
app.use('/auth', auth);
app.use('/admin', admin);
app.use('/user', user);

// Fire up the app
app.listen(app.get('port'), function() {
  console.log('Node app is running on port ', app.get('port'));
});

module.exports = app;
