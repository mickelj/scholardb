$(document).ready(function() {
  $("#deleteuser").on('click', function(e) {
    e.preventDefault();
    if (confirm("LAST CHANCE... Are you sure you want to delete " + $("#usersearch").val() + "?")) {
			$("#userdelform").submit();
    }
  });
});
