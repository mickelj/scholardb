$(document).ready(function() {
  $("#deptadd").on('click', function() {
    var personid = $("#peopleid").val();
    var deptid = $("#deptlist").val();
    var deptname = $("#deptlist").text();
    $.ajax({
      method: "POST",
      url: "/admin/departments/add",
      data: {"userid": personid, "deptid": deptid},
      success: function(result) {
        if (!($(".collection li").length)) {
          $(".collection + p").remove();
        }
        $("#deptlist option[value='" + deptid + "']").prop('disabled', true);
        $(".collection").append('<li class="collection-item"><div>' + deptname + ' <a class="secondary-content red-text text-darken-4 deldept" href="#!" data-deptid="' + deptid + '" data-deptname="' + deptname + '"><i class="material-icons">remove_circle</i></a></div></li>');
        }
    });
  });

  $(document).on('click', ".departments a.deldept", function(e) {
    e.preventDefault();
    if (confirm("Are you sure you want to remove " + $(this).data('deptname') + "?")) {
      var personid = $("#peopleid").val();
      var deptid = $(this).data('deptid');
      $.ajax({
        method: "POST",
        url: "/admin/departments/delete",
        data: {"userid": personid, "deptid": deptid},
        success: function(result) {
          $("#deptlist option[value='" + deptid + "']").prop('disabled', false);
          $(".collection li div a[data-deptid='" + deptid + "']").parent().parent().parent().remove();
          if (!($(".collection li").length)) {
            $(".collection").after('<p>Not currently a member of any departments or programs</p>');
          }
        }
      });
    }
  });
});
