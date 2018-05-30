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
			xhr = $.getJSON('/publications/search', {q: term})
				.done(function(data) {
					var suggestions = [];
					for (var d in data) {
						suggestions.push(data[d]);
					}	
					suggest(suggestions);
				})
				.fail(function(jqxhr, textStatus, error) {
				});
		},
		renderItem: function(item, search) {
			return '<div class="autocomplete-suggestion" data-pubid="' + item.id + '" data-val="' + item.name + '">' + item.name + '</div>';
		},
		onSelect: function(e, selectedItem, renderedItem) {
			$("#pubid").val(renderedItem.data('pubid'));
			$("fieldset[data-name='issn']").hide();
		}
	});

	$("input[data-cjs-field='container-title']").on('focus', function() {
		$("fieldset[data-name='issn']").show();
	});

	var peopleAutocomplete = {
		source: function(term, suggest) {
			try {xhr.abort();} catch(e){}
			xhr = $.getJSON('/people/search', {q: term})
				.done(function(data) {
					var suggestions = [];
					for (var d in data) {
						suggestions.push(data[d]);
					}	
					suggest(suggestions);
				})
				.fail(function(jqxhr, textStatus, error) {
				});
		},
		renderItem: function(item, search) {
			return '<div class="autocomplete-suggestion" data-personid="' + item.id + '" data-val="' + item.name + '">' + item.name + '</div>';
		},
		onSelect: function(e, selectedItem, renderedItem) {
			var stringToAppend = $("#contributors").val().length > 0 ? $("#contributors").val() + "," : "";
    	$("#contributors").val(stringToAppend + renderedItem.data('personid'));
		}
	};

	$("input[data-cjs-field*='author'], input[data-cjs-field='editor']").autoComplete(peopleAutocomplete);
	$(document).on('DOMNodeInserted', "input[data-cjs-field*='author'], input[data-cjs-field='editor']", function(){
		$(this).autoComplete(peopleAutocomplete);
	});
});