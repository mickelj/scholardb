const express = require('express');
const router = express.Router();
const authHelpers = require('../utils/auth-helpers');
const passport = require('../utils/auth-local');
const db = require('../utils/db');
const nconf = require('../utils/nconf');

router.get('/login', authHelpers.loginRedirect, (req, res) => {
  res.render('auth/login', {
    appconf: nconf.get(),
    error: req.flash('error')
  });
});

router.post('/login', authHelpers.loginRedirect, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('error', info.message);
      return res.redirect('/auth/login');
    }
    req.login(user, (err) => {
      if (err) return next(err);
      req.session.save( (err) => {
        if (err) return next(err);
        res.redirect('/user');
      });
    });
  })(req, res, next);
});

router.get('/logout', authHelpers.loginRequired, (req, res) => {
  req.logout();
  req.session.flash = [];
  req.session.save( (err) => {
    if (err) return err;
    res.redirect('/');
  });
});

module.exports = router;
