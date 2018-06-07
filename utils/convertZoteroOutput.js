const request = require('request');
const nconf = require('nconf');
const Cite = require('citation-js');
nconf.file('database', '../config/environment.json');
const urlHead = nconf.get('zotero:tsurl');
const cslUrl = urlHead + "/export?format=csljson";
const blUrl = urlHead + "/export?format=biblatex";

module.exports = {
	convert: function(zjson, cb) {
		if (typeof zjson !== 'string') zjson = JSON.stringify(zjson);
		// We got some Zotero JSON, so now let's try to convert to CSL-JSON
		var result;
		var options = {
			headers: {
				'Content-Type' : 'application/json'
			},
			uri: cslUrl,
			method: 'POST',
			body: zjson
		};

		request(options, (err, response, csljsonConv) => {
			// If the JSON won't convert to CSL, convert to BibTex and then CSL using another library
			// Otherwise, all converted properly so send back the CSL-JSON
			if (response) {
				if (response.statusCode !== 200) {
					var options = {
						headers: {
							'Content-Type' : 'application/json'
						},
						uri: blUrl,
						method: 'POST',
						body: zjson
					};

					request(options, (err, response, biblatexConv) => {
						// Whomp whomp...wouldn't convert so return the error message
						if (response) {
							if (response.statusCode !== 200) return {err: response.statusCode, msg: biblatexConv};

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
						} else {
							cb({rcode: 500, msg: "No response from Zotero server on biblatex -> csl"});
						}
					});
				} else {
					result = {
						rcode: response.statusCode,
						msg: csljsonConv
					};
					cb(result);
				}
			} else {
				cb({rcode: 500, msg: "No response from Zotero server on zjson -> csl"});
			}
		});
	}
}