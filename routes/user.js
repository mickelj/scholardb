const express = require('express');
const router = express.Router();
const authHelpers = require('../utils/auth-helpers');
const db = require('../utils/db');
const gn = require('../utils/genNames');

function getPenNames(req, res, next) {
  db.run("SELECT display_name FROM pennames WHERE people_id = $1 ORDER BY machine_name", [req.user.id], function(err, results) {
    if (err) return next(err);

    req.pennames = results;
    return next();
  });
}

function checkPenName(req, res, next) {
  req.pn = req.body.last_name + ", " + req.body.first_name + (req.body.middle_name ? " " + req.body.middle_name : "");
  req.mn = gn.genMachineName(req.pn);

  db.run("SELECT id FROM pennames WHERE people_id = $1 AND machine_name ILIKE $2", [req.user.id, '%' + req.mn + '%'], (err, results) => {
    if (err) return next(err);
    if (results.length) {
      req.dberr = 'Pen name is already in database.';
      console.log('Pen name is already in database.')
      return next();
    }
    return next();
  })
}

function savePenName(req, res) {
  if (req.dberr) {
    req.flash('error', req.dberr);
    return res.redirect('/user/penname');
  }

  if (!req.pn) {
    req.flash('error', 'Pen name was empty');
    return res.redirect('/user/penname');
  }

  db.pennames.insert({people_id: req.user.id, display_name: req.pn, machine_name: req.mn}, (err, results) => {
    if (err) {
      req.flash('error', 'Error adding pen name to database: ' + err);
      return res.redirect('/user/penname');
    }
    req.flash('success', 'Pen name added successfully');
    return res.redirect('/user/penname');
  })
}

router.get('/', authHelpers.loginRequired, (req, res, next) => {
  var nconf = req.app.get('nconf');

  res.render('user', {
    appconf: nconf.get(),
    user: req.user
  });
});

router.get('/penname', authHelpers.loginRequired, getPenNames, (req, res, next) => {
  var nconf = req.app.get('nconf');

  res.render('user', {
    appconf: nconf.get(),
    user: req.user,
    page: 'pennames',
    pennames: req.pennames,
    error: req.flash('error'),
    success: req.flash('success')
  });
});

router.post('/penname', authHelpers.loginRequired, checkPenName, savePenName);

module.exports = router;
