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
				info = JSON.parse(data);
				$("#uid").val(info.employeeID);
				$("#firstname").val(info.givenName);
				$("#middlename").val(info.initials);
				$("#lastname").val(info.sn);
				$("#email").val(info.mail);
				$("#phone").val(info.telephoneNumber);
				$("#office").val(info.physicalDeliveryOfficeName);
			})
			.fail(function(jqxhr, textStatus, error) {
			}
		);
	})
});