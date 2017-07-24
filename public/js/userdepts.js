$(document).ready(function() {
  $("#deptlist").on('change', function() {
  });

  $(document).on('click', ".departments a.deldept", function(e) {
    e.preventDefault();
    if (confirm("Are you sure you want to remove " + $(this).data('deptname')) + "?") {
      var deptid = $(this).data('deptid');
      $.ajax({
        method: "POST",
        url: "/user/departments/delete",
        data: {"deptid": deptid},
        success: function(result) {
          if(result) {
            location.reload();
          }
        }
      });
    }
  });
});
