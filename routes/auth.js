const express = require('express');
const router = express.Router();
const authHelpers = require('../utils/auth-helpers');
// const passport = require('../utils/auth-local');
const passport = require('../utils/auth-windows');
const db = require('../utils/db');

router.get('/login', authHelpers.loginRedirect, (req, res) => {
  var nconf = req.app.get('nconf');

  res.render('auth/login', {
    appconf: nconf.get(),
    error: req.flash('error')
  });
});

router.post('/login', authHelpers.loginRedirect, function(res, req, next) {
  passport.authenticate('WindowsAuthentication', function(err, user, info) {
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

// router.post('/login', authHelpers.loginRedirect, (res, req, next) => {
//   passport.authenticate('local', (err, user, info) => {
//     if (err) return next(err);
//     if (!user) {
//       req.flash('error', info.message);
//       return res.redirect('/auth/login');
//     }
//     req.login(user, (err) => {
//       if (err) return next(err);
//       req.session.save( (err) => {
//         if (err) return next(err);
//         res.redirect('/user');
//       });
//     });
//   })(req, res, next);
// });

router.get('/logout', authHelpers.loginRequired, (req, res) => {
  req.logout();
  req.session.save( (err) => {
    if (err) return err;
    res.redirect('/');
  });
});

module.exports = router;
