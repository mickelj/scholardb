$(document).ready(function() {
	$("#deptlist").on("select", function() {
		var groupid = $(this).val();
		try {xhr.abort();} catch(e){}
		xhr = $.getJSON('/departments/search/', {groupid: groupid})
			.done(function(data) {
				if (!data.length) {
					popupError("Error retrieving group from database");
				} else {
					try {
						var info = JSON.parse(data);
						$("#groupid").val(info.id);
						$("#name").val(info.name);
						$("#url").val(info.url);
						$("#parentdeptlist").val(info.parent_id);
						$("#groupmodform .select-dropdown.dropdown-trigger").val(info.parent_name)
						$("#groupmodform ul[id*='select-options'] li").removeClass('selected');
						$("#groupmodform ul[id*='select-options'] li span:contains('" + info.parent_name + "')").parent().addClass('selected');
						$("#hidden").prop("checked", info.hidden);
						$("#groupmodform form label").addClass("active");
						$("#groupmodform").show();
					} catch(e) {
						popupError(e);
					}
				}
			});
	});
});