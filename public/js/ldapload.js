$(document).ready(function() {
	$("#ldapusername").on("keyup", function() {
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
		try {xhr.abort();} catch(e){}
		xhr = $.getJSON('/admin/adinfo', {username: $("#ldapusername").val()})
			.done(function(data) {
				console.log(data);
			})
			.fail(function(jqxhr, textStatus, error) {
			}
		);
	})
});