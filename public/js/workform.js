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

	$("input[data-cjs-field='container-title']").autoComplete({
		source: function(term, response) {
			try {xhr.abort();} catch(e){}
			xhr = $.getJSON('URL', {q: term}, function(data) {
				response(data);
			});
		}
	});
});