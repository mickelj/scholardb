$(document).ready(function() {
  $("#deptadd").on('click', function() {
    var personid = $("#peopleid").val();
    var deptid = $("#deptlist").val();
    var deptname = $("#deptlist option:selected").text();
    $.ajax({
      method: "POST",
      url: "/admin/departments/add",
      data: {"userid": personid, "deptid": deptid},
      success: function(result) {
        if (!($("#userdepts li").length)) {
          $("#userdepts + p").remove();
        }
        $("#deptlist option[value='" + deptid + "']").prop('disabled', true);
        $("#userdepts").append('<li class="collection-item"><div>' + deptname + ' <a class="secondary-content red-text text-darken-4 deldept" href="#!" data-deptid="' + deptid + '" data-deptname="' + deptname + '"><i class="material-icons">remove_circle</i></a></div></li>');
        $("#deptlist option:first").prop('selected', true);
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
          $("#userdepts li div a[data-deptid='" + deptid + "']").parent().parent().remove();
          if (!($("#userdepts li").length)) {
            $("#userdepts").after('<p>Not currently a member of any departments or programs</p>');
          }
        }
      });
    }
  });
});
