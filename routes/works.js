const express = require('express');
const router = express.Router();

router.get('/', function(req, res) {
  res.render('works', {
    title: nconf.get('application:appname') + " - Works",
    tagline: nconf.get('application:tagline'),
    logo: nconf.get('application:logo'),
    appname: nconf.get('application:appname'),
    sampling: "A Sample of " + nconf.get('application:orgshortname') + " Scholars",
    defimgext: nconf.get('application:defimgext'),
    imgrootdir: nconf.get('application:imgrootdir'),
    organization: nconf.get('application:organization'),
    searchdeftext: nconf.get('application:searchdeftext')
  })
});

module.exports = router;
