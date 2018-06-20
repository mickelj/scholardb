$(document).ready(function() {
  $("#deptadd").on('click', function() {
    var deptid = $("#deptlist").val();
    $.ajax({
      method: "POST",
      url: "/user/groups/add",
      data: {"deptid": deptid},
      success: function(result) {
        location.reload();
      }
    });
  });

  $(document).on('click', ".departments a.deldept", function(e) {
    e.preventDefault();
    if (confirm("Are you sure you want to remove " + $(this).data('deptname') + "?")) {
      var deptid = $(this).data('deptid');
      $.ajax({
        method: "POST",
        url: "/user/groups/delete",
        data: {"deptid": deptid},
        success: function(result) {
          location.reload(); 
        }
      });
    }
  });
});
