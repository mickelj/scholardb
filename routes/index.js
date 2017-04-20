const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', {title: "ScholarsDB - Home", "message": "Welcome to ScholarsDB!"});
});

module.exports = router;
