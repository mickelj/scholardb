$(document).ready(function() {
  $("#deptlist").on('change', function() {
    var seltext = $("#deptlist option:selected").text();
    var selval = $("#deptlist").val();

    $("#newdeptlist .collection").append("<li class='collection-item'><div>" + seltext + " <a class='secondary-content red-text text-darken-4 deldept' href='#!' data-deptid='" + selval + "' data-deptname='" + seltext + "'><i class='material-icons'>remove_circle</i></a></div></li>");

    $("#newdeptheader").removeClass('hide');
    $("#newdeptlist").removeClass('hide');
    var indepts = $("#inDepts").val();
    if (indepts) {
      $("#inDepts").val(indepts + ",{id: " + selval + ", name: " + seltext + "}");
    } else {
      $("#inDepts").val("{id: " + selval + ", name: " + seltext + "}");
    }

    // REMOVE THIS FROM outDepts IF FOUND THERE
  });

  $(document).on('click', ".departments a.deldept", function(e) {
    e.preventDefault();

    var gid = $(this).data('deptid');
    var gname = $(this).data('deptname');

    var outdepts = $("#outDepts").val();
    if (outdepts) {
      $("#outDepts").val(outdepts + ",{id: " + gid + ", name: " + gname + "}");
    } else {
      $("#outDepts").val("{id: " + gid + ", name: " + gname + "}");
    }

    $(this).parent().parent().remove();

    // REMOVE THIS FROM inDepts IF FOUND THERE
  });
});
