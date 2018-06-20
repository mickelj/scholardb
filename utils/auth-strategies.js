const express = require('express');
const app = express();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const WindowsStrategy = require('passport-windowsauth');
const authHelpers = require('./auth-helpers');
const db = require('./db');
const options = {};

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.run("SELECT * FROM people WHERE id = $1", [id], function(err, results) {
    if (err) done(err, null);
    done(null, results[0]);
  });
});

passport.use(new LocalStrategy(options, (username, password, done) => {
  //check to see if the username exists
  db.run("SELECT * FROM people WHERE email = $1 AND password IS NOT NULL AND password <> ''", [username], function(err, results) {
    var user = results[0];
    if (err) return done(err);
    if (!results.length) return done(null, false, {message: 'User account not found'});
    if (!authHelpers.comparePass(password, user.password)) {
      return done(null, false, {message: 'Incorrect password'});
    } else {
      return done(null, user);
    }
  });
}));

passport.use(new WindowsStrategy({
    ldap: {
      url:             process.env.LDAP_URL,
      base:            process.env.LDAP_BASE,
      bindDN:          process.env.LDAP_BIND_USER,
      bindCredentials: process.env.LDAP_BIND_PWD,
      reconnect:       true
    },
    integrated:      false,
    passReqToCallback: true
  }, 
  function(req, profile, done){
    if (!profile) return done(null, false, {message: 'Incorrect username or password'});
    
    db.run("SELECT * FROM people WHERE email = $1", [profile._json.mail], function(err, results) {
      if (err) return done(err);
      if (!results.length) return done(null, false, {message: 'User account not found'});

      return done(null, results[0]);
    });
  }
));

module.exports = passport;
