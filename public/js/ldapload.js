$(document).ready(function() {
	$("#ldapusername").on("keydown", function() {
		if ($(this).val()) {
			$("#ldaploadconfirm").removeClass('disabled');
		} else {
			$("#ldaploadconfirm").addClass('disabled');
		}
	});

	$("#ldapload").on("click", function(e) {
		e.preventDefault();
		if ($("#ldapusername").val()) {
			$("#ldaploadconfirm").removeClass('disabled');
		} else {
			$("#ldaploadconfirm").addClass('disabled');
		}
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