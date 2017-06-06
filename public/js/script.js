$(document).ready(function() {
   $(".button-collapse").sideNav();

   $(".filter-toggle").on('click', function() {
     $(this).nextAll().toggleClass('hide');
     var txt = $(this).next().is(':visible') ? 'Show fewer results...' : 'Show more results...';
     $(this).text(txt);
   });
});
