$(document).ready(function() {
	$("#ldapload").on("click", function(e) {
		e.preventDefault();
	});

	$("#ldaploadconfirm").on("click", function(e) {
		alert("Holy crap, you clicked it!");
			// try {xhr.abort();} catch(e){}
			// xhr = $.getJSON('/people/search', {q: term})
			// 	.done(function(data) {
			// 		var suggestions = [];
			// 		for (var d in data) {
			// 			suggestions.push(data[d]);
			// 		}	
			// 		suggest(suggestions);
			// 	})
			// 	.fail(function(jqxhr, textStatus, error) {
			// });
	})
});