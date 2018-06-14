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
		var changedIcon = '<i class="material-icons prefix amber-text text-accent-4 tooltipped" data-position="top" data-tooltip="Updated from LDAP">assignment_late</i>';

		try {xhr.abort();} catch(e){}
		xhr = $.getJSON('/admin/adinfo', {username: $("#ldapusername").val()})
			.done(function(data) {
				info = JSON.parse(data);
				if (info.employeeID !== $("#uid").val()) 										$("#uid").val(info.employeeID).next().after(changedIcon);
				if (info.givenName !== $("#firstname").val()) 							$("#firstname").val(info.givenName).next().after(changedIcon);
				if (info.initials !== $("#middlename").val()) 							$("#middlename").val(info.initials).next().after(changedIcon);
				if (info.sn !== $("#lastname").val()) 											$("#lastname").val(info.sn).next().after(changedIcon);
				if (info.mail !== $("#email").val()) 												$("#email").val(info.mail).next().after(changedIcon);
				if (info.telephoneNumber !== $("#phone").val()) 						$("#phone").val(info.telephoneNumber).next().after(changedIcon);
			  if (info.physicalDeliveryOfficeName !== $("#office").val()) $("#office").val(info.physicalDeliveryOfficeName).next().after(changedIcon);
			})
			.fail(function(jqxhr, textStatus, error) {
			}
		);
	})
});