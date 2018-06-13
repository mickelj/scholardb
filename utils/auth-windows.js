const express = require('express');
const app = express();
const passport = require('passport');
const WindowsStrategy = require('passport-windowsauth');
const authHelpers = require('./auth-helpers');

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
    bindCredentials: process.env.LDAP_BIND_PWD
  },
  integrated:      false
}, 
  function(profile, done){
    User.findOrCreate({ waId: profile.id }, function (err, user) {
      done(err, user);
    });
  })
);

module.exports = passport;
