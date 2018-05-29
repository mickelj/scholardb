$(document).ready(function() {
	var form = new jQueryCite({ lang: 'en', 
															saveInCookies: false, 
															add: function() {console.log(JSON.stringify(form._data.data[0])); },
															inputForm: $(".cjs-in").html(),
															outputForm: ""
														});
	
	form.insertInputForm($('#cjs-in'));
	form.insertOutputForm($('#cjs-out')) ;
	
	$(window).on('beforeunload', function() {
		form.terminate();
	});

	$("input.autocomplete").autocomplete({
		data: {
			"Apple": null,
			"Microsoft": null,
			"Google": 'https://placehold.it/250x250'
		},
	});
});