$(document).ready(function() {
	$("#deptlist").on("change", function() {
		var groupid = $(this).val();
		try {xhr.abort();} catch(e){}
		xhr = $.getJSON('/departments/search/', {groupid: groupid})
			.done(function(data) {
				console.log(data);
				if (!data.length) {
					popupError("Error retrieving group from database");
				} else {
					try {
						var info = JSON.parse(data);
						$("#groupid").val(info.id);
						$("#name").val(info.name);
						$("#url").val(info.url);
						$("#parentdeptlist").val(info.parent_id);
						$(".select-dropdown.dropdown-trigger").val(info.parent_id)
						$("ul[id*='select-options'] li").removeClass('selected');
						$("ul[id*='select-options'] li span:contains('" + parent_id + "')").parent().addClass('selected');
						$("#hidden").prop("checked", info.hidden);
						$("#groupmodform").show();
					} catch(e) {
						popupError(e);
					}
				}
			});
	});
});