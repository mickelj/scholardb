const express = require('express');
const router = express.Router();
const authHelpers = require('../utils/auth-helpers');
const db = require('../utils/db');
const gn = require('../utils/genNames');
const czo = require('../utils/convertZoteroOutput');
const jimp = require('jimp');
const request = require('request');
const nocache = require('node-nocache');
const regex = /(^\[)(.*)(\]$)/gm;
const subst = `$2`;

function getWorkTypes(req, res, next) {
  db.run("SELECT type, description FROM work_types ORDER BY description", (err, results) => {
    if (err) return next(err);

    req.worktypes = results;
    return next();
  })
}

function getInfo(req, res, next) {
  db.run("SELECT prefix, suffix, phone, office_location FROM people WHERE id = $1", [req.user.id], (err, results) => {
    if (err) return next(err);

    req.info = results[0];
    return next();
  });
}

function saveInfo(req, res, next) {
  db.people.update({id: req.user.id, prefix: req.body.prefix, suffix: req.body.suffix, phone: req.body.phone, office_location: req.body.office}, (err, results) => {
    if (err) {
      req.flash('error', 'Error updating information: ' + err);
      return res.redirect('/user/info');
    }
    req.flash('success', 'Information updated successfully');
    return res.redirect('/user/info');
  });
}

function getPenNames(req, res, next) {
  db.run("SELECT display_name FROM pennames WHERE people_id = $1 ORDER BY machine_name", [req.user.id], (err, results) => {
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
      return next();
    }
    return next();
  })
}

function savePenName(req, res, next) {
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
  });
}

function getPhoto(req, res, next) {
  db.run("SELECT id, image_url AS image FROM people WHERE id = $1", [req.user.id], (err, results) => {
    if (err) return next(err);
    req.photo = results[0];
    return next();
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
          resp = JSON.parse(body);
          if (resp.err) {
            req.flash('error', 'Error saving photo: ' + resp.err);
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

function processCitation(req, res, next) {
  var nconf = req.app.get('nconf');
  var anystyleApi = process.env.ANYSTYLE_API_KEY;
  var url = nconf.get('anystyle:anystyleurl');

  var options = {
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    uri: url,
    method: 'POST',
    json: {
      "access_token": anystyleApi,
      "references": [req.body.citation]
    }
  };

  var r = request(options, (err, response, content) => {
    if (response.statusCode !== 200) {
      req.flash('error', 'Error parsing citation: ' + content);
      return res.redirect('back');
    }

    if (typeof content !== 'string') {
      if (content.length > 1) content = content[0];
      content = JSON.stringify(content);
    } else {
      js = JSON.parse(content);
      if (js.length > 1) content = JSON.stringify(js[0]);
    }  
    
    db.works_pending.insert({pending_data: content}, (err, results) => {
      if (err) {
        req.flash('error', 'Error adding new work to pending queue: ' + err);
        return res.redirect('/user/work/citation');
      }
      req.flash('success', 'Work added to pending queue.  It will be reviewed soon.');
      return res.redirect('/user/work');
    });
  });
}

function processIdentifier(req, res, next) {
  var nconf = req.app.get('nconf');
  var url = nconf.get('zotero:tsurl') + "/search";
  var options = {
    headers: {
      'Content-Type': 'text/plain'
    },
    uri: url,
    method: 'POST',
    body: req.body.identifier
  };
  var r = request(options, (err, response, content) => {
    if (response.statusCode !== 200) {
      req.flash('error', 'Error processing identifier (' + req.body.identifier + '): ' + content);
      return res.redirect('back');
    }

    czo.convert(content, function(data) {
      if (!data) {
        req.flash('error', 'Unknown error');
        return res.redirect('back');
      } else if (data.rcode !== 200) {
        req.flash('error', data.msg);
        return res.redirect('back');
      }

      db.works_pending.insert({pending_data: data.msg[0]}, (err, results) => {
        if (err) {
          req.flash('error', 'Error adding new work to pending queue: ' + err);
          return res.redirect('/user/work/identifier');
        }
        req.flash('success', 'Work added to pending queue.  It will be reviewed soon.');
        return res.redirect('/user/work');
      });
    });
  });
}

function processUrl(req, res, next) {
  var nconf = req.app.get('nconf');
  var url = nconf.get('zotero:tsurl') + "/web";

  var options = {
    headers : {
      'Content-Type' : 'application/json'
    },
    uri: url,
    method: 'POST',
    json: {
      "url" : req.body.url,
      "sessionid" : "scholarsdb"
    }
  };

  var r = request(options, (err, response, content) => {
    if (response.statusCode !== 200) {
      req.flash('error', "Error processing URL (" + req.body.url + "): " + content);
      return res.redirect('back');
    }

    resp = czo.convert(content, function(data) {
      if (!data) {
        req.flash('error', 'Unknown error');
        return res.redirect('back');
      } else if (data.rcode !== 200) {
        req.flash('error', data.msg);
        return res.redirect('back');
      }

      var content = data.msg;

      if (typeof content !== 'string') {
        if (content.length > 1) content = content[0];
        content = JSON.stringify(content);
      } else {
        js = JSON.parse(content);
        if (js.length > 1) content = JSON.stringify(js[0]);
      }
  
      db.works_pending.insert({pending_data: content}, (err, results) => {
        if (err) {
          req.flash('error', 'Error adding new work to pending queue: ' + err);
          return res.redirect('/user/work/url');
        }
        req.flash('success', 'Work added to pending queue.  It will be reviewed soon.');
        return res.redirect('/user/work');
      });
    });
  });
}

function storePendingForm(req, res) {
  if (!req.body.workdata) {
    req.flash('error', 'The form was empty');
    return res.redirect('/user/work/form');
  }

  var pending_contributors = (req.body.contributors) ? req.body.contributors.split(',') : null;
  var pending_publication = (req.body.pubid) ? req.body.pubid : null;

  db.works_pending.insert({pending_data: req.body.workdata, pending_contributors: pending_contributors, pending_publication: pending_publication}, (err, results) => {
    if (err) {
      req.flash('error', 'Error adding new work to pending queue: ' + err);
      return res.redirect('/user/work/form');
    }
    req.flash('success', 'Work added to pending queue.  It will be reviewed soon.');
    return res.redirect('/user/work');
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
  db.run("SELECT group_id, name FROM memberships JOIN groups ON group_id = id WHERE hidden = false AND people_id = $1 ORDER BY name", [req.user.id], (err, results) => {
    if (err) return next(err);

    req.departments = results;
    return next();
  });
}

function addDepartment(req, res, next) {
  var deptid = req.body.deptid || null;

  if (deptid) {
    db.memberships.insert({group_id: deptid, people_id: req.user.id}, (err, results) => {
      if (err) {
        req.flash('error', 'Error adding department to database: ' + err);
        return res.json({success: false});
      }

      req.flash('success', 'Department added successfully');
      return res.json({success: true});
    });
  }
}

function deleteDepartment(req, res, next) {
  var deptid = req.body.deptid || null;

  if (deptid) {
    db.memberships.destroy({group_id: deptid, people_id: req.user.id}, (err, results) => {
      if (err) {
        req.flash('error', 'Error removing department from database: ' + err);
        return res.json({success: false});
      }
      req.flash('success', 'Department removed successfully');
      return res.json({success: true});
    });
  }
}

router.get('/', authHelpers.loginRequired, (req, res) => {
  var nconf = req.app.get('nconf');

  res.render('user', {
    appconf: nconf.get(),
    user: req.user
  });
});

router.get('/work', authHelpers.loginRequired, (req, res) => {
  var nconf = req.app.get('nconf');

  res.render('user', {
    appconf: nconf.get(),
    user: req.user,
    page: 'work',
    error: req.flash('error'),
    success: req.flash('success')
  });
});

router.get('/work/identifier', authHelpers.loginRequired, (req, res) => {
  var nconf = req.app.get('nconf');

  res.render('user', {
    appconf: nconf.get(),
    user: req.user,
    page: 'workidentifier',
    error: req.flash('error'),
    success: req.flash('success')
  });
});

router.get('/work/url', authHelpers.loginRequired, (req, res) => {
  var nconf = req.app.get('nconf');

  res.render('user', {
    appconf: nconf.get(),
    user: req.user,
    page: 'workurl',
    error: req.flash('error'),
    success: req.flash('success')
  });
});

router.get('/work/citation', authHelpers.loginRequired, (req, res) => {
  var nconf = req.app.get('nconf');

  res.render('user', {
    appconf: nconf.get(),
    user: req.user,
    page: 'workcitation',
    error: req.flash('error'),
    success: req.flash('success')
  });
});

router.get('/work/form', authHelpers.loginRequired, getWorkTypes, (req, res) => {
  var nconf = req.app.get('nconf');

  res.render('user', {
    appconf: nconf.get(),
    user: req.user,
    page: 'workform',
    worktypes: req.worktypes,
    error: req.flash('error'),
    success: req.flash('success')
  });
});

router.get('/info', authHelpers.loginRequired, getInfo, (req, res) => {
  var nconf = req.app.get('nconf');

  res.render('user', {
    appconf: nconf.get(),
    user: req.user,
    page: 'info',
    info: req.info,
    error: req.flash('error'),
    success: req.flash('success')
  });
});

router.get('/penname', authHelpers.loginRequired, getPenNames, (req, res) => {
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

router.get('/photo', authHelpers.loginRequired, getPhoto, nocache, (req, res) => {
  var nconf = req.app.get('nconf');

  res.render('user', {
    appconf: nconf.get(),
    user: req.user,
    page: 'photo',
    photo: req.photo,
    error: req.flash('error'),
    success: req.flash('success')
  });
});

router.get('/departments', authHelpers.loginRequired, getAllDepts, getDepartments, (req, res) => {
  var nconf = req.app.get('nconf');

  res.render('user', {
    appconf: nconf.get(),
    user: req.user,
    page: 'departments',
    departments: req.departments,
    alldepts: req.alldepts,
    error: req.flash('error'),
    success: req.flash('success')
  });
});

router.post('/penname', authHelpers.loginRequired, checkPenName, savePenName);
router.post('/info', authHelpers.loginRequired, saveInfo);
router.post('/photo', authHelpers.loginRequired, processPhoto);
router.post('/departments/add', authHelpers.loginRequired, addDepartment);
router.post('/departments/delete', authHelpers.loginRequired, deleteDepartment);
router.post('/work/citation', authHelpers.loginRequired, processCitation);
router.post('/work/identifier', authHelpers.loginRequired, processIdentifier);
router.post('/work/url', authHelpers.loginRequired, processUrl);
router.post('/work/form', authHelpers.loginRequired, storePendingForm);

module.exports = router;
