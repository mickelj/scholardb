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
			return '<div class="autocomplete-suggestion" data-alldata="' + encodeURI(JSON.stringify(item)) + '" data-personid="' + item.id + '" data-val="' + item.fullname + '">' + item.fullname + '</div>';
		},
		onSelect: function(e, term, renderedItem) {
			try {
				var selectedItem = JSON.parse(decodeURI(renderedItem.data("alldata")));
			} catch (err) {
				return false;
			}

			var capUserType = selectedItem.user_type.charAt(0).toUpperCase() + selectedItem.user_type.slice(1);

			$("#peopleid").val(selectedItem.id);

			if ($("#usermodform").length) {
				$("#uid").val(selectedItem.university_id);
				$("#usertype").val(selectedItem.user_type);
				$(".select-dropdown.dropdown-trigger").val(capUserType)
				$("ul[id*='select-options'] li").removeClass('selected');
				$("ul[id*='select-options'] li span:contains('" + capUserType + "')").parent().addClass('selected');
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
				$("#ldapusername").val((selectedItem.email) ? selectedItem.email.split('@')[0] : "");
				$("#usermodform form label").addClass("active");
				$("#usermodform").show();
			} else if ($("#photoform").length) {
				if (selectedItem.image_url) {
					var imageurl = urlprefix + selectedItem.image_url + urlsuffix + "?" + new Date().getTime();
					$("#currentimage").html('<img id="photourl" class="responsive-img" src="' + imageurl + '" alt="Current Profile Image" width="200">');
					$("#fname").val(selectedItem.image_url)
				} else {
					$("#fname").val((selectedItem.email) ? selectedItem.email.split('@')[0] : "");
					$("#currentimage").html('<p>No photo has been uploaded</p>');
				}
				$("#photoform").show();
			} else if ($("#deptform").length) {
				try {xhr.abort();} catch(e){}
				xhr = $.getJSON('/admin/getdepts', {id: selectedItem.id})
					.done(function(data) {
						if (data.length) {
						  for (var d in data) {
								$("#userdepts").append('<li class="collection-item"><div>' + data[d].name + ' <a class="secondary-content red-text text-darken-4 deldept" href="#!" data-deptid="' + data[d].group_id + '" data-deptname="' + data[d].name + '"><i class="material-icons">remove_circle</i></a></div></li>');
								$("#deptlist option[value='" + data[d].group_id + "']").prop('disabled', true);
						  }
					  } else {
							$("#userdepts").hide();
							$("#userdepts").after('<p class="col s10 offset-s1 m8 offset-m1 l6 offset-l1">Not currently a member of any departments or programs</p>');
						}
						$("#deptform").show();
					})
					.fail(function(jqxhr, textStatus, error) {
					});
			}
		}
	});
});