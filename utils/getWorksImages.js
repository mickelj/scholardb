const request = require('request');
const _ = require('underscore');

module.exports = function() {
  function getWorksImages (works_list, covimgsrv) {
    var idents = _.map(works_list, function(work) {
      return work.identifier ? work.identifier.replace(/-/g, '') : 'null';
    });

    request.get(covimgsrv + idents.join(','), function(err, res, body) {
      if (err) {
        return next(err);
      }

      imgobj = JSON.parse(body);

      _.map(works_list, function(work) {
        var wi = (work.identifier ? work.identifier.replace(/-/g, '') : null);
        work.coverimage = (wi in imgobj ? imgobj[wi] : null);
      });

      return works_list;
    });
  }
}
