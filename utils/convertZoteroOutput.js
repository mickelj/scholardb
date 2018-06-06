const request = require('request');
const nconf = require('nconf');
const Cite = require('citation-js');
nconf.file('database', '../config/environment.json');

module.exports = {
	convert: function(zjson, cb) {
		// We got some Zotero JSON, so now let's try to convert to CSL-JSON
		var result;
		//var url = nconf.get('zotero:tsurl') + "/export?format=csljson";
		var url = "https://scholarsdb-zotero.herokuapp.com/export?format=csljson";
		var options = {
			headers: {
				'Content-Type' : 'application/json'
			},
			uri: url,
			method: 'POST',
			body: zjson
		};

		request(options, (err, response, csljsonConv) => {
			// If the JSON won't convert to CSL, convert to BibTex and then CSL using another library
			// Otherwise, all converted properly so send back the CSL-JSON
			if (response && response.statusCode !== 200) {
				//url = nconf.get('zotero:tsurl') + "/export?format=biblatex";
				url = "https://scholarsdb-zotero.herokuapp.com/export?format=biblatex";
				var options = {
					headers: {
						'Content-Type' : 'application/json'
					},
					uri: url,
					method: 'POST',
					body: zjson
				};

				request(options, (err, response, biblatexConv) => {
					// Whomp whomp...wouldn't convert to return the error message
					if (response && response.statusCode !== 200) return {err: response.statusCode, msg: biblatexConv};

					var bloptions = {
						format: 'string',
						type: 'json',
						style: 'csl',
						lang: 'en-US'
					};
					var data = new Cite(biblatexConv, bloptions);

					result = {
						rcode: response.statusCode,
						msg: data.get()
					};
					cb(result);
				});
			} else {
				result = {
					rcode: response.statusCode,
					msg: csljsonConv
				};
				cb(result);
			}
		});
	}
}