const request = require('request');
const xml2js = require('xml2js');
const util = require('util');

var romeourl = 'http://www.sherpa.ac.uk/romeo/api29.php?ak=bEi1YdbpB6Y';

request.get(romeourl + '&issn=1444-1586', function(err, res, body) {
  if (err) {
    return next(err);
  }

  xml2js.parseString(body, function(err, result) {
    if (err) {
      return next(err);
    }

    console.log(util.inspect(result.romeoapi.publishers[0].publisher[0], false, null));
  });
});
