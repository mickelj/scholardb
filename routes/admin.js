const express = require('express');
const router = express.Router();
const authHelpers = require('../utils/auth-helpers');

router.get('/', authHelpers.adminRequired, (req, res, next) => {
  handleResponse(res, 200, 'success');
});

function handleResponse(res, code, statusMsg) {
  res.status(code).json({status: statusMsg});
}

module.exports = router;
