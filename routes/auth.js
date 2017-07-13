const express = require('express');
const router = express.Router();
const authHelpers = require('../utils/auth-helpers');
const passport = require('../utils/auth-local');

router.get('/login', authHelpers.loginRedirect, (req, res, next) => {
  console.log("Flash: " + req.flash('error'));
  res.render('auth/login', {
    appconf: req.app.get('nconf').get(),
    error: req.flash('error')
  });
});

router.post('/login',
  authHelpers.loginRedirect,
  (req, res, next) => {
    passport.authenticate('local',
      {
        failureRedirect:  '/auth/login',
        failureFlash:     true
      },
      (err, user, info) => {
        req.session.save( (err) => {
          if (err) return next(err);
          res.redirect('/user');
        });
      });
  // passport.authenticate('local', (err, user, info) => {
  //   if (err) res.status(500).send('Error in passport local authentication module');
  //   if (!user) res.redirect('/auth/login');
  //   if (user) {
  //     req.session.save( (err) => {
  //       if (err) return next(err);
  //       res.redirect('/user');
  //     });
  //   }
  // });
});

router.get('/logout', authHelpers.loginRequired, (req, res, next) => {
  req.logout();
  req.session.save( (err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

module.exports = router;
