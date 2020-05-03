var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render(__path_views+'pages/publish/index', { pageTitle: 'PublishPage' });
});


module.exports = router;
