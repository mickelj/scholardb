const crossref = require('crossref');
const nconf = require('nconf');
nconf.file('database', '../config/environment.json');

module.exports = function () {
	function doiSearch(doiVal) {
		crossref.work(doiVal + '?mailto:' + nconf.get('appurls:adminemail'), (err, work) => {
			if (err) return next(err);

			return work;
		});
	}
};