$(function main() {
	var form = new jQueryCite({ lang: 'en', 
															saveInCookies: false, 
															add: function() {console.log(JSON.stringify(form._data.data[0])); },
															inputForm: $(".cjs-in").html(),
															outputForm: ""
														});
	
	form.insertInputForm($('#cjs-in'));
	form.insertOutputForm($('#cjs-out')) ;
	
	$(window).on('beforeunload', function finish() {
		form.terminate();
	});

	$("input#journal-title").autocomplete({
		data: {
			"Apple": null,
			"Microsoft": null,
			"Google": null
		},
		minLength: 3
	});
});