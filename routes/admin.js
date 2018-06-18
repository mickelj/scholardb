const express = require('express');
const router = express.Router();
const authHelpers = require('../utils/auth-helpers');
const db = require('../utils/db');
const nocache = require('node-nocache');
const ActiveDirectory = require('activedirectory');
const ADoptions = { url: process.env.LDAP_URL,  baseDN: process.env.LDAP_BASE,  username: process.env.LDAP_BIND_USER,  password: process.env.LDAP_BIND_PWD };
const AD = new ActiveDirectory(ADoptions);
const ADattributes = {attributes: ['sAMAccountName', 'mail', 'whenCreated', 'employeeID', 'sn', 'givenName', 'initials', 'title', 'physicalDeliveryOfficeName', 'telephoneNumber']};

function getADInfo(req, res) {
  if (!req.query.username) return res.json({});

  AD.findUser(ADattributes, req.query.username, function(err, user) {
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
          console.log(body);
          try { 
            resp = JSON.parse(body);
          } catch (e) {
            req.flash('error', 'Error saving photo: ' + e);
            return res.redirect('back');
          }

          req.flash('success', resp.success);
          return res.redirect('back');
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

router.get('/photo', authHelpers.loginRequired, authHelpers.adminRequired, nocache, (req, res) => {
  var nconf = req.app.get('nconf');

  res.render('user', {
    appconf: nconf.get(),
    user: req.user,
    page: 'photo',
    error: req.flash('error'),
    success: req.flash('success')
  });
});

router.get('/adinfo', authHelpers.loginRequired, authHelpers.adminRequired, getADInfo);

router.post('/usermod', authHelpers.loginRequired, authHelpers.adminRequired, saveInfo);

module.exports = router;
