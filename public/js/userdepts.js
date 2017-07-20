$(document).ready(function() {
  $("#deptlist").on('change', function() {
    $("#newdeptlist .collection").append("<li class='collection-item'><div>" + $(this).text() + " <a class='secondary-content tooltipped red-text text-darken-4 deldept' href='#!' data-position='bottom' data-delay='50' data-tooltip='Remove " + $(this).text() + "' data-deptid='" + $(this).val() + "' data-deptname='" + $(this).text() + "'><i class='material-icons'>remove_circle</i></a></div></li>");

    $("#newdeptheader").removeClass('hide');
    $("#newdeptlist").removeClass('hide');
    var indepts = $("#inDepts").val();
    if (indepts) {
      $("#inDepts").val(indepts + ",{id: " + $(this).val() + ", name: " + $(this).text() + "}");
    else {
      $("#inDepts").val("{id: " + $(this).val() + ", name: " + $(this).text() + "}");
    }

    // REMOVE THIS FROM outDepts IF FOUND THERE
  });

  $(".deldept").on('click', function(e) {
    e.preventDefault();

    var gid = $(this).data('deptid');
    var gname = $(this).data('deptname');

    var outdepts = $("#outDepts").val();
    if (outdepts) {
      $("#outDepts").val(outdepts + ",{id: " + gid + ", name: " + gname + "}");
    else {
      $("#outDepts").val("{id: " + gid + ", name: " + gname + "}");
    }

    $(this).parent().parent().remove();

    // REMOVE THIS FROM inDepts IF FOUND THERE
  });
});
