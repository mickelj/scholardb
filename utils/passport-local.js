const express = require('express');
const app = express();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const authHelpers = require('./passport-helpers');
const init = require('./passport');
const db = app.get('db');
const options = { usernameField: 'email', passwordField: 'password' };

init();

passport.use(new LocalStrategy(options, (username, password, done) => {
  //check to see if the username exists
  db.people.findOne({email : username}, function(err, user) {
    console.log('User: ' + user);
    if (err) return done(err);
    if (!user) return done(null, false, {message: 'Username not found'});
    if (!authHelpers.comparePass(password, user.password)) {
      return done(null, false, {message: 'Incorrect password'});
    } else {
      return done(null, user);
    }
  });
}));

module.exports = passport;
