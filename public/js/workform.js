$(document).ready(function() {
	var container_title = "";
	var publisher_place = "";

	var form = new jQueryCite({ lang: 'en', 
															saveInCookies: false, 
															add: function() {
																var formdata = form._data.data[0];
																delete formdata._graph;
																delete formdata.id;
																$("#workdata").val(JSON.stringify(form._data.data[0]));
																$("#workform").submit();
															},
															inputForm: $(".cjs-in").html(),
															outputForm: ""
														});
	
	form.insertInputForm($('#cjs-in'));
	form.insertOutputForm($('#cjs-out'));
	
	$(window).on('beforeunload', function() {
		form.terminate();
	});

	// Publication autocomplete
	$("fieldset[data-cjs-field-type*='article'] input[data-cjs-field='container-title']").autoComplete({
		minChars: 2,
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
			container_title = renderedItem.data('val');
		}
	});

	$("fieldset[data-cjs-field-type*='article'] input[data-cjs-field='container-title']").on('focus', function() {
		$("fieldset[data-name='issn']").show();
	});

	$("fieldset[data-cjs-field-type*='article'] input[data-cjs-field='container-title']").on('blur', function() {
		if ($(this).val() === container_title) {
			$("fieldset[data-name='issn']").hide();
		}
	});

	// Publisher autocomplete
	$("input[data-cjs-field='publisher']").autoComplete({
		minChars: 2,
		source: function(term, suggest) {
			try {xhr.abort();} catch(e){}
			xhr = $.getJSON('/publishers/search', {q: term})
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
			return '<div class="autocomplete-suggestion" data-publisherid="' + item.id + '" data-val="' + item.name + '">' + item.name + '</div>';
		},
		onSelect: function(e, selectedItem, renderedItem) {
			$("#publisherid").val(renderedItem.data('publisherid'));
			container_title = renderedItem.data('val');
		}
	});

	// People autocomplete
	var peopleAutocomplete = {
		minChars: 2,
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
			return '<div class="autocomplete-suggestion" data-personid="' + item.id + '" data-val="' + item.fullname + '">' + item.fullname + '</div>';
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