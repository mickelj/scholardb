const express = require('express');
const router = express.Router();
const authHelpers = require('../utils/auth-helpers');
const db = require('../utils/db');
const nocache = require('node-nocache');
const jimp = require('jimp');
const request = require('request');
const ActiveDirectory = require('activedirectory');
const ADoptions = { url: process.env.LDAP_URL,  baseDN: process.env.LDAP_BASE,  username: process.env.LDAP_BIND_USER,  password: process.env.LDAP_BIND_PWD };
const AD = new ActiveDirectory(ADoptions);
const ADattributes = {attributes: ['sAMAccountName', 'mail', 'whenCreated', 'employeeID', 'sn', 'givenName', 'initials', 'title', 'physicalDeliveryOfficeName', 'telephoneNumber']};

function _cleanInfo(info) {
  Object.keys(info).forEach(function(val) {
    if (!info[val]) info[val] = null;
  });

  return info;
}

function getADInfo(req, res) {
  if (!req.query.username) return res.json({});

  AD.findUser(ADattributes, req.query.username, function(err, user) {
    if (err || !user) return res.json({});

    if (req.query.adduser) {
      db.people.where("university_id = $1 OR email = $2", [user.employeeID, user.mail], (err, results) => {
        if (err) return res.json({});
        if (results.length) return res.json(JSON.stringify({exists: true}));
        return res.json(JSON.stringify(user));
      });
    } else {
      return res.json(JSON.stringify(user));
    }
  });
}

function addUser(req, res, next) {
  var info = _cleanInfo(req.body);

  var altfirstnames = (info.alt_first_names) ? info.alt_first_names.split(',') : null;
  var altlastnames  = (info.alt_last_names) ? info.alt_last_names.split(',') : null;
  var fullname = info.first_name + " " + ((info.middle_name) ? info.middle_name + " " : "") + info.last_name;
  var admin = (info.admin) ? info.admin : false;
  var active = (info.active) ? info.active : false;

  db.people.insert({
                    first_name: info.first_name, middle_name: info.middle_name, last_name: info.last_name,
                    alt_last_names: altlastnames, alt_first_names: altfirstnames, university_id: info.university_id, 
                    prefix: info.prefix, suffix: info.suffix, phone: info.phone, user_type: info.user_type, office_location: info.office,
                    active: active, admin: admin, fullname: fullname
                   }, (err, results) => {
    if (err) {
      req.flash('error', 'Error adding user: ' + err);
      return res.redirect('back');
    }

    req.flash('success', 'User added successfully');
    return res.redirect('/admin');
  });
}

function modifyUser(req, res, next) {
  var info = _cleanInfo(req.body);

  var altfirstnames = (info.alt_first_names) ? info.alt_first_names.split(',') : null;
  var altlastnames  = (info.alt_last_names) ? info.alt_last_names.split(',') : null;
  var fullname = info.first_name + " " + ((info.middle_name) ? info.middle_name + " " : "") + info.last_name;
  var admin = (info.admin) ? info.admin : false;
  var active = (info.active) ? info.active : false;

  db.people.update({ id: info.id },
                   {
                    first_name: info.first_name, middle_name: info.middle_name, last_name: info.last_name,
                    alt_last_names: altlastnames, alt_first_names: altfirstnames, university_id: info.university_id, 
                    prefix: info.prefix, suffix: info.suffix, phone: info.phone, user_type: info.user_type, office_location: info.office,
                    active: active, admin: admin, fullname: fullname
                   }, (err, results) => {
    if (err) {
      req.flash('error', 'Error saving information: ' + err);
      return res.redirect('back');
    }
    req.flash('success', 'User information saved successfully');
    return res.redirect('/admin');
  });
}

function processPhoto(req, res, next) {
  var nconf = req.app.get('nconf');

  if (!req.files) {
    req.flash('error', 'No photo was uploaded');
    return res.redirect('back');
  }

  if (req.files.newphoto.mimetype == 'image/jpeg' || req.files.newphoto.mimetype == 'image/png') {
    jimp.read(req.files.newphoto.data, (err, image) => {
      if (err) {
        req.flash('error', 'Error processing photo: ' + err);
        return res.redirect('back');
      }

      if (image.bitmap.width < 350 || image.bitmap.height < 350) {
        req.flash('error', 'Please choose a photo that is at least 350 pixels wide OR 350 pixels tall');
        return res.redirect('back');
      }

      image.cover(400, 400, jimp.HORIZONTAL_ALIGN_CENTER | jimp.VERTICAL_ALIGN_TOP);
      image.getBuffer(jimp.AUTO, (err, result) => {
        if (err) {
          req.flash('error', 'Error buffering photo: ' + err);
          return res.redirect('back');
        }

        var url = nconf.get('appurls:imguploader');
        var options = {
          headers: {
            'Referer': nconf.get('appurls:apphome')
          },
          uri: url,
          method: 'POST'
        };
        var r = request(options, (err, response, body) => {
          try { 
            resp = JSON.parse(body);
          } catch (e) {
            req.flash('error', 'Error saving photo: ' + e);
            return res.redirect('back');
          }

          db.people.update({id: req.body.id}, {image_url: req.body.fname}, (err, results) => {
            if (err) {
              req.flash('error', 'Error updating information: ' + err);
              return res.redirect('back');
            }

            req.flash('success', resp.success);
            return res.redirect('/admin');
          });
        });

        var form = r.form();
        form.append('file', result, {
          filename:    'temp-' + new Date().getTime() + '.jpg',
          contentType: req.files.newphoto.mimetype
        });
        form.append('filename', req.body.fname);
      });
    });
  } else {
    req.flash('error', 'Please choose a JPEG or PNG file.');
    return res.redirect('back');
  }
}

function deactivateUser(req, res, next) {
  db.people.update({id: req.body.id}, {active: false}, (err, results) => {
    if (err) {
      req.flash('error', 'Error deactivating user');
      return res.redirect('back');
    }

    req.flash('success', 'User successfully deactivated.');
    return res.redirect('/admin');
  });
}

function deleteUser(req, res, next) {
  db.run("UPDATE works SET contributors = $1 WHERE contributors @> $2;", ["array_remove(contributors, " + req.body.id + ")", "ARRAY[" + req.body.id + "]"], (err, results) => {
    if (err) {
      req.flash('error', 'Error deleting user from works.');
      return res.redirect('back');
    }

    db.people.destroy({id: req.body.id}, (err, results) => {
      if (err) {
        req.flash('error', 'Error deleting user');
        return res.redirect('back');
      }

      req.flash('success', 'User successfully deleted.');
      return res.redirect('/admin');  
    });
  });
}

function getAllDepts(req, res, next) {
  db.run("SELECT id, name FROM groups WHERE hidden = false ORDER BY name", (err, results) => {
    if (err) return next(err);
    req.alldepts = results;
    return next();
  });
}

function getDepartments(req, res, next) {
  db.run("SELECT group_id, name FROM memberships JOIN groups ON group_id = id WHERE hidden = false AND people_id = $1 ORDER BY name", [req.query.id], (err, results) => {
    if (err || !results.length) return res.json({});

    res.json(results);
  });
}

function addDepartment(req, res, next) {
  var deptid = req.body.deptid || null;

  if (deptid) {
    db.memberships.insert({group_id: deptid, people_id: req.body.userid}, (err, results) => {
      if (err) {
        return res.json({success: false});
      }

      return res.json({success: true});
    });
  }
}

function deleteDepartment(req, res, next) {
  var deptid = req.body.deptid || null;

  if (deptid) {
    db.memberships.destroy({group_id: deptid, people_id: req.body.userid}, (err, results) => {
      if (err) {
        return res.json({success: false});
      }
      return res.json({success: true});
    });
  }
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

router.get('/usernew', authHelpers.loginRequired, authHelpers.adminRequired, (req, res, next) => {
  var nconf = req.app.get('nconf');

  res.render('admin', {
    appconf: nconf.get(),
    user: req.user,
    page: 'usernew',
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

router.get('/userdel', authHelpers.loginRequired, authHelpers.adminRequired, (req, res, next) => {
  var nconf = req.app.get('nconf');

  res.render('admin', {
    appconf: nconf.get(),
    user: req.user,
    page: 'userdel',
    error: req.flash('error'),
    success: req.flash('success')
  });
});

router.get('/photo', authHelpers.loginRequired, authHelpers.adminRequired, nocache, (req, res) => {
  var nconf = req.app.get('nconf');

  res.render('admin', {
    appconf: nconf.get(),
    user: req.user,
    page: 'photo',
    error: req.flash('error'),
    success: req.flash('success')
  });
});

router.get('/departments', authHelpers.loginRequired, getAllDepts, (req, res) => {
  var nconf = req.app.get('nconf');

  res.render('admin', {
    appconf: nconf.get(),
    user: req.user,
    page: 'departments',
    alldepts: req.alldepts,
    error: req.flash('error'),
    success: req.flash('success')
  });
});

router.get('/adinfo', authHelpers.loginRequired, authHelpers.adminRequired, getADInfo);
router.get('/getdepts', authHelpers.loginRequired, authHelpers.adminRequired, getDepartments);

router.post('/user/departments/add', authHelpers.loginRequired, authHelpers.adminRequired, addDepartment);
router.post('/user/departments/delete', authHelpers.loginRequired, authHelpers.adminRequired, deleteDepartment);
router.post('/user/add', authHelpers.loginRequired, authHelpers.adminRequired, addUser)
router.post('/user/modify', authHelpers.loginRequired, authHelpers.adminRequired, modifyUser);
router.post('/user/deactivate', authHelpers.loginRequired, authHelpers.adminRequired, deactivateUser);
router.post('/user/delete', authHelpers.loginRequired, authHelpers.adminRequired, deleteUser);
router.post('/user/photo', authHelpers.loginRequired, authHelpers.adminRequired, processPhoto);

module.exports = router;
