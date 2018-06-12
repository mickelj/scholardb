const express = require('express');
const router = express.Router();
const authHelpers = require('../utils/auth-helpers');
const db = require('../utils/db');

function getInfo(req, res, next) {
  db.run("SELECT * FROM people WHERE id = $1", [req.user.id], (err, results) => {
    if (err) return next(err);

    req.info = results[0];

    if (req.info.alt_last_names) {
      req.altlastnames = req.info.alt_last_names.join(',');
    }

    if (req.info.alt_first_names) {
      req.altfirstnames = req.info.alt_first_names.join(',');
    }

    return next();
  });
}

router.get('/', authHelpers.loginRequired, authHelpers.adminRequired, (req, res) => {
  var nconf = req.app.get('nconf');
  
  res.render('admin', {
    appconf: nconf.get(),
    user: req.user
  });
});

router.get('/usermod', authHelpers.loginRequired, authHelpers.adminRequired, (req, res, next) => {
  var nconf = req.app.get('nconf');

  res.render('admin', {
    appconf: nconf.get(),
    user: req.user,
    page: 'usermod',
    error: req.flash('error'),
    success: req.flash('success')
  });

});

module.exports = router;
