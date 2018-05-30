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
		source: function(term, suggest) {
			try {xhr.abort();} catch(e){}
			xhr = $.getJSON('/publications/search', {q: term}, function(data) {
				var suggestions = [];
				for (var d in data) {
					suggestions.push(data[d]);
				}	
				suggest(suggestions);
			});
		},
		renderItem: function(item, search) {
			return '<div class="autocomplete-suggestion" data-pubid="' + item.id + '" data-identifier="' + item.identifier + '" data-name="' + item.name + '" data-val="' + item.name + '">' + item.name + '</div>';
		}
	});
});