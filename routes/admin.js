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

function saveInfo(req, res, next) {
  var altfirstnames = req.body.alt_first_names.split(',');
  var altlastnames  = req.body.alt_last_names.split(',');

  db.people.update({ id: req.body.id }, 
                   {
                    first_name: req.body.first_name, middle_name: req.body.middle_name, last_name: req.body.last_name,
                    alt_last_names: altlastnames, alt_first_names: altfirstnames, university_id: req.body.university_id, 
                    prefix: req.body.prefix, suffix: req.body.suffix, phone: req.body.phone, user_type: req.body.user_type, office_location: req.body.office,
                    active: req.body.active, admin: req.body.admin
                   }, (err, results) => {
    if (err) {
      req.flash('error', 'Error updating information: ' + err);
      return res.redirect('/admin/usermod');
    }
    req.flash('success', 'Information updated successfully');
    return res.redirect('/admin');
  });
}


router.get('/', authHelpers.loginRequired, authHelpers.adminRequired, (req, res) => {
  var nconf = req.app.get('nconf');
  
  res.render('admin', {
    appconf: nconf.get(),
    user: req.user,
    error: req.flash('error'),
    success: req.flash('success')
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

router.post('/usermod', authHelpers.loginRequired, authHelpers.adminRequired, saveInfo);

module.exports = router;
