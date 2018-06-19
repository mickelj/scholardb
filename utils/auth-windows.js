const express = require('express');
const app = express();
const passport = require('passport');
const WindowsStrategy = require('passport-windowsauth');
const authHelpers = require('./auth-helpers');
const db = require('./db');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.run("SELECT * FROM people WHERE id = $1", [id], function(err, results) {
    if (err) done(err, null);
    done(null, results[0]);
  });
});

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
