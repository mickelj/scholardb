const express = require('express');
const router = express.Router();
const authHelpers = require('../utils/auth-helpers');
const passport = require('../utils/auth-local');

router.get('/login', authHelpers.loginRedirect, (req, res) => {
  console.log("Flash: " + req.flash('error'));
  res.render('auth/login', {
    appconf: req.app.get('nconf').get(),
    error: req.flash('error')
  });
});

router.post('/login',
  authHelpers.loginRedirect,
  passport.authenticate('local',
    {
      failureRedirect:  '/auth/login',
      failureFlash:     true
    }
  ),
  (req, res) => {
    req.session.save( (err) => {
      if (err) return err;
      res.redirect('/user');
    });
  });
});

router.get('/logout', authHelpers.loginRequired, (req, res) => {
  req.logout();
  req.session.save( (err) => {
    if (err) return err;
    res.redirect('/');
  });
});

module.exports = router;
