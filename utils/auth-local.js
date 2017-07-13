const express = require('express');
const app = express();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const authHelpers = require('./auth-helpers');
const init = require('./auth');
const db = app.get('db');
const options = { usernameField: 'email', passwordField: 'password' };

console.log('before init');
init();
console.log('after init');

passport.use(new LocalStrategy(options, (username, password, done) => {
  console.log('username: ' + username + " | password: " + password);
  //check to see if the username exists
  db.run('SELECT * FROM people WHERE email = $1', [username], function(err, results) {
    var user = results[0];
    console.log('User: ' + user);
    if (err) return done(err);
    if (!results.length) return done(null, false, {message: 'Username not found'});
    if (!authHelpers.comparePass(password, user.password)) {
      return done(null, false, {message: 'Incorrect password'});
    } else {
      return done(null, user);
    }
  });
}));

module.exports = passport;
