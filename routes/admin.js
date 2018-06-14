const express = require('express');
const router = express.Router();
const authHelpers = require('../utils/auth-helpers');
const db = require('../utils/db');
const ActiveDirectory = require('activedirectory');
const ADoptions = { url: process.env.LDAP_URL,  baseDN: process.env.LDAP_BASE,  username: process.env.LDAP_BIND_USER,  password: process.env.LDAP_BIND_PWD };
const AD = new ActiveDirectory(ADoptions);

function getADInfo(req, res) {
  if (!req.query.username) return res.json({});

  AD.findUser(req.query.username, function(err, user) {
    if (err || !user) return res.json({});

    return res.json(JSON.stringify(user));
  });
}

function saveInfo(req, res, next) {
  function _cleanInfo(info) {
    Object.keys(info).forEach(function(val) {
      if (!info[val]) info[val] = null;
    });
  
    return info;
  }
  
  var info = _cleanInfo(req.body);

  var altfirstnames = (info.alt_first_names) ? info.alt_first_names.split(',') : null;
  var altlastnames  = (info.alt_last_names) ? info.alt_last_names.split(',') : null;
  var fullname = info.first_name + " " + ((info.middle_name) ? info.middle_name + " " : "") + info.last_name;

  db.people.update({ id: info.id },
                   {
                    first_name: info.first_name, middle_name: info.middle_name, last_name: info.last_name,
                    alt_last_names: altlastnames, alt_first_names: altfirstnames, university_id: info.university_id, 
                    prefix: info.prefix, suffix: info.suffix, phone: info.phone, user_type: info.user_type, office_location: info.office,
                    active: info.active, admin: info.admin, fullname: fullname
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

router.get('/adinfo', authHelpers.loginRequired, authHelpers.adminRequired, getADInfo);

router.post('/usermod', authHelpers.loginRequired, authHelpers.adminRequired, saveInfo);

module.exports = router;
