const request = require('request');
const nconf = require('nconf');
const Cite = require('citation-js');
nconf.file('database', '../config/environment.json');

module.exports = {
	convert: function (zjson) {
		// We got some Zotero JSON, so now let's try to convert to CSL-JSON
		url = nconf.get('zotero:tsurl') + "/export?format=csljson";
		var options = {
			headers: {
				'Content-Type' : 'application/json'
			},
			uri: url,
			method: 'POST',
			body: zjson
		};

		r = request(options, (err, response, csljsonConv) => {
			// If the JSON won't convert to CSL, convert to BibTex and then CSL using another library
			// Otherwise, all converted properly so send back the CSL-JSON
			console.log(csljsonConv);
			if (response.statusCode === 500) {
				url = nconf.get('zotero:tsurl') + "/export?format=biblatex";
				var options = {
					headers: {
						'Content-Type' : 'application/json'
					},
					uri: url,
					method: 'POST',
					body: zjson
				};

				r = request(options, (err, response, biblatexConv) => {
					// Whomp whomp...wouldn't convert to return the error message
					if (response.statusCode !== 200) return {err: response.statusCode, msg: biblatexConv};

					const data = new Cite(biblatexConv);
					const bl2csljson = data.get({
						format: 'string',
						type: 'json',
						style: 'csl',
						lang: 'en-US'
					});

					return {err: response.statusCode, msg: bl2csljson};
				});
			} else {
				return {err: response.statusCode, msg: csljsonConv};
			}
		});
	}
};