$(document).ready(function() {
	$("#usersearch").autoComplete({
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
			return '<div class="autocomplete-suggestion" data-alldata="' + JSON.stringify(item) + '" data-personid="' + item.id + '" data-val="' + item.fullname + '">' + item.fullname + '</div>';
		},
		onSelect: function(e, term, renderedItem) {
			try {
				var selectedItem = JSON.parse(renderedItem.data(alldata));
			} catch(err) {
				return false;
			}
			$("#uid").val(selectedItem.university_id);
			$("#usertype").val(selectedItem.user_type);
			$("#firstname").val(selectedItem.first_name);
			$("#middlename").val(selectedItem.middle_name);
			$("#lastname").val(selectedItem.last_name);
			$("#altlastnames").val((selectedItem.alt_last_names) ? selectedItem.alt_last_names.join(",") : "");
			$("#altfirstnames").val((selectedItem.alt_first_names) ? selectedItem.alt_first_names.join(",") : "");
			$("#prefix").val(selectedItem.prefix);
			$("#suffix").val(selectedItem.suffix);
			$("#email").val(selectedItem.email);
			$("#phone").val(selectedItem.phone);
			$("#office").val(selectedItem.office_location);
			$("#isactive").prop("checked", selectedItem.active);
			$("#isadmin").prop("checked", selectedItem.admin);
			// $("#usermodform").show();
		}
	});
});