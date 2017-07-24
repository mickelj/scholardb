function removeFromArray(item, arrayToEdit) {
  var arr = JSON.parse("[" + JSON.stringify(arrayToEdit.value) + "]");
  var index = _.indexOf(arrayToEdit, _.findWhere(arr, item));
  if (index) arr.splice(index, 1);
  var arrstr = (JSON.stringify(arr)).substring(1, arr.length-1);
  arrayToEdit.value = arrstr;
}

$(document).ready(function() {
  var indepts = $("#inDepts");
  var outdepts = $("#outDepts");

  $("#deptlist").on('change', function() {
    var seltext = $("#deptlist option:selected").text();
    var selval = $("#deptlist").val();

    $("#newdeptlist .collection").append("<li class='collection-item'><div>" + seltext + " <a class='secondary-content red-text text-darken-4 deldept' href='#!' data-deptid='" + selval + "' data-deptname='" + seltext + "'><i class='material-icons'>remove_circle</i></a></div></li>");

    $("#newdeptheader").removeClass('hide');
    $("#newdeptlist").removeClass('hide');
    if (indepts.val()) {
      indepts.val(indepts.val() + ",{id: " + selval + ", name: '" + seltext + "'}");
    } else {
      indepts.val("{id: " + selval + ", name: '" + seltext + "'}");
    }

    removeFromArray("{id: " + selval + "}", outDepts);
    console.log("After add selection (in) : " + indepts.val());
    console.log("After add selection (out): " + outdepts.val());
  });

  $(document).on('click', ".departments a.deldept", function(e) {
    e.preventDefault();

    var gid = $(this).data('deptid');
    var gname = $(this).data('deptname');

    if (outdepts.val()) {
      outdepts.val(outdepts.val() + ",{id: " + gid + ", name: '" + gname + "'}");
    } else {
      outdepts.val("{id: " + gid + ", name: '" + gname + "'}");
    }

    $(this).parent().parent().remove();

    removeFromArray("{id: " + gid + "}", inDepts);
    console.log("After removal click (in) : " + indepts.val());
    console.log("After removal click (out): " + outdepts.val());
  });
});
